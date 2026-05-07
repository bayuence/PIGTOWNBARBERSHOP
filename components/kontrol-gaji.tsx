"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
    CreditCard, DollarSign, TrendingUp, Award, Settings, Package, 
    Trash2, Loader2, Printer, Users, Receipt, CheckCircle,
    AlertCircle, Wifi, WifiOff, Calendar, Filter, Download
} from "lucide-react";
import { supabase, setupTransactionsRealtime, setupKomisiRealtime, broadcastTransactionEvent, setupGlobalEventsListener } from "@/lib/supabase";

const formatNominal = (value: string | number): string => {
    if (!value && value !== 0) return "";
    const stringValue = String(value).replace(/[^0-9]/g, '');
    if (stringValue === "") return "";
    return new Intl.NumberFormat('id-ID').format(parseInt(stringValue, 10));
};

const parseNominal = (value: string): number => {
    if (!value) return 0;
    return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
};

interface Employee {
  id: string
  name: string
  email: string
  position?: string
  baseSalary?: number
  commissions?: CommissionRule[] 
  branch?: string
  branchId?: string
  joinDate?: string
  phone?: string
  status?: string
}

interface CommissionRule {
  id?: string
  user_id: string
  service_id: string
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  service_name?: string 
  service_price?: number
}

interface Service {
  id: string
  name: string
  price: number
  type: "service" | "product"
}

interface EarnedCommissionStats {
    [employeeId: string]: number;
}

interface ReportFilter {
    period: 'day' | 'week' | 'month' | 'custom'
    startDate: string
    endDate: string
    branch: string
    employee: string
}

interface BonusPenaltyData {
  [employeeId: string]: {
    bonus: number;
    penalty: number;
  };
}

export function KontrolGaji() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [earnedCommissions, setEarnedCommissions] = useState<EarnedCommissionStats>({});
  const [bonusPenaltyData, setBonusPenaltyData] = useState<BonusPenaltyData>({});
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isKelolaGajiOpen, setIsKelolaGajiOpen] = useState(false);
  const [newBaseSalary, setNewBaseSalary] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [commissionValue, setCommissionValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [showSlipModal, setShowSlipModal] = useState(false);

  // Fungsi untuk mengambil data bonus dan penalty
  const fetchBonusPenaltyData = useCallback(async () => {
    try {
      console.log('🔄 Fetching bonus/penalty data from Supabase...');
      
      const { data, error } = await supabase
        .from("points")
        .select("user_id, points_earned, points_type")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      if (error) {
        console.error('❌ Error fetching bonus/penalty data:', error);
        return;
      }
      
      const result: BonusPenaltyData = {};
      
      data?.forEach(item => {
        if (!result[item.user_id]) {
          result[item.user_id] = { bonus: 0, penalty: 0 };
        }
        
        if (item.points_type === 'reward' || item.points_type === 'bonus') {
          result[item.user_id].bonus += Math.abs(item.points_earned);
        } else if (item.points_type === 'penalty' || item.points_type === 'deducted') {
          result[item.user_id].penalty += Math.abs(item.points_earned);
        }
      });
      
      setBonusPenaltyData(result);
      console.log('✅ Bonus/penalty data loaded:', result);
    } catch (error) {
      console.error("❌ Error fetching bonus/penalty data:", error);
    }
  }, []);

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setPageLoading(true);
      setConnectionStatus('reconnecting');
    }
    
    try {
      console.log('🔄 Fetching data from Supabase...');
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id, name, email, position, salary, branch_id, phone, status, created_at,
          branches:branch_id (id, name)
        `)
        .order('name')
        .eq('status', 'active');

      // Ignore empty error objects, only throw if there's a real error message
      if (usersError?.message) {
        throw new Error(`Database error: ${usersError.message}`);
      }

      if (!users || users.length === 0) {
        console.warn('⚠️ No active users found');
      } else {
        console.log(`✅ Loaded ${users.length} active users`);
      }

      const { data: commissionRules, error: commissionError } = await supabase
        .from('commission_rules')
        .select('*');
      
      if (commissionError) {
        console.error('❌ Commission rules error:', commissionError);
        throw commissionError;
      }

      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price, type');
      
      if (servicesError) {
        console.error('❌ Services error:', servicesError);
        throw servicesError;
      }

      const { data: summaryData, error: summaryError } = await supabase
        .from('employee_summary')
        .select('employee_id, total_earned_commission');
      
      if (summaryError) {
        console.error('❌ Summary error:', summaryError);
        throw summaryError;
      }

      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('status', 'active');
      
      if (branchesError) {
        console.error('❌ Branches error:', branchesError);
        throw branchesError;
      }
      
      setBranches(branchesData || []);
      
      const commissionStats: EarnedCommissionStats = {};
      if (summaryData) {
        summaryData.forEach(summary => {
          commissionStats[summary.employee_id] = summary.total_earned_commission || 0;
        });
      }
      setEarnedCommissions(commissionStats);
      
      const servicesMap = new Map(allServices?.map(s => [s.id, { name: s.name, price: s.price }]));

      const processedEmployees: Employee[] = (users || []).map(user => {
        const userCommissions = commissionRules
          ?.filter(c => c.user_id === user.id)
          .map(c => {
              const serviceInfo = servicesMap.get(c.service_id);
              return { 
                  ...c, 
                  service_name: serviceInfo?.name || 'Layanan Dihapus',
                  service_price: serviceInfo?.price || 0
              };
          }) || [];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          position: user.position || 'Karyawan',
          position: user.position,
          baseSalary: user.salary,
          commissions: userCommissions,
          branch: user.branches?.name || 'Tidak Ada Cabang',
          branchId: user.branch_id,
          joinDate: user.created_at,
          phone: user.phone || '',
          status: user.status || 'active'
        };
      });

      setEmployees(processedEmployees);
      setIsOnline(true);
      setConnectionStatus('connected');
      
      console.log(`✅ Data loaded: ${processedEmployees.length} employees, ${branchesData?.length} branches`);

    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setIsOnline(false);
      setConnectionStatus('disconnected');
      
      toast({ 
        title: "Gagal Memuat Data", 
        description: "Tidak dapat terhubung ke database. Silakan refresh halaman.",
        variant: "destructive" 
      });
      
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        fetchData();
      }, 5000);
      
    } finally {
      if (showLoading) {
        setPageLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    fetchData(true);
    fetchBonusPenaltyData();
    
    const fetchActiveServices = async () => {
      setServicesLoading(true);
      try {
        const { data, error } = await supabase.from('services').select('*').eq('status', 'active');
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
        setIsOnline(false);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchActiveServices();

    const transactionsChannel = setupTransactionsRealtime(() => {
      console.log('Refresh data karena perubahan transaksi');
      fetchData();
    });

    const komisiChannel = setupKomisiRealtime(() => {
      console.log('Refresh data karena perubahan komisi');
      fetchData();
    });

    const pointsChannel = supabase
      .channel('points-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'points' }, 
        () => {
          console.log('Points data changed, refreshing bonus/penalty data...');
          fetchBonusPenaltyData();
        }
      )
      .subscribe();

    const globalChannel = setupGlobalEventsListener((event, payload) => {
      console.log('Global event received in KontrolGaji:', event, payload);
      if (event === 'transaction_deleted' || event === 'transaction_created') {
        fetchData();
      }
    });

    return () => {
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(komisiChannel);
      supabase.removeChannel(pointsChannel);
      supabase.removeChannel(globalChannel);
    };
  }, [fetchData, fetchBonusPenaltyData]);

  useEffect(() => {
    if (selectedEmployee && isKelolaGajiOpen) {
      const updatedEmployee = employees.find(emp => emp.id === selectedEmployee.id);
      if (updatedEmployee) {
        setSelectedEmployee(updatedEmployee);
      }
    }
  }, [employees, selectedEmployee, isKelolaGajiOpen]);

  const handleUpdateBaseSalary = async () => {
    if (!selectedEmployee || !newBaseSalary) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ salary: parseNominal(newBaseSalary) })
        .eq('id', selectedEmployee.id);
      if (error) throw error;
      toast({ title: "Gaji Pokok Diperbarui" });
      await fetchData();
    } catch (error) {
      toast({ title: "Gagal Memperbarui Gaji", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    if (!selectedEmployee || !selectedService || !commissionValue) return;
    setLoading(true);

    try {
        const commissionRule = {
            user_id: selectedEmployee.id,
            service_id: selectedService,
            commission_type: commissionType,
            commission_value: commissionType === 'percentage' 
                ? parseFloat(commissionValue) 
                : parseNominal(commissionValue),
        };

        const { error } = await supabase
            .from('commission_rules')
            .upsert(commissionRule, { onConflict: 'user_id,service_id' });
        if (error) throw error;
        
        setSelectedService('');
        setCommissionValue('');
        await fetchData();
        toast({ title: "Aturan Komisi Disimpan" });

    } catch (error) {
        toast({ title: "Gagal Menyimpan Komisi", description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleRemoveCommission = async (commissionId: string) => {
    if (!confirm('Yakin ingin menghapus pengaturan komisi ini?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', commissionId);
      if (error) throw error;
      
      await fetchData();
      toast({ title: "Aturan Komisi Dihapus" });

    } catch (error) {
      toast({ title: "Gagal Menghapus Komisi", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getEarnedCommission = (employeeId: string) => earnedCommissions[employeeId] || 0;

  const getBonusPenaltyData = (employeeId: string) => bonusPenaltyData[employeeId] || { bonus: 0, penalty: 0 };

  const calculateTotalSalary = (employee: Employee) => {
    const baseSalary = employee.baseSalary || 0;
    const totalCommission = getEarnedCommission(employee.id);
    const bonusData = getBonusPenaltyData(employee.id);
    return baseSalary + totalCommission + bonusData.bonus - bonusData.penalty;
  };

  const openKelolaGajiModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewBaseSalary(formatNominal(employee.baseSalary?.toString() || '0'));
    setIsKelolaGajiOpen(true);
  };

  const openSlipGajiModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSlipModal(true);
  };

  const handlePrintSlip = () => {
    if (!selectedEmployee) return;
    const bonusData = getBonusPenaltyData(selectedEmployee.id);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const printContent = `
      <!DOCTYPE html><html><head><title>Slip Gaji - ${selectedEmployee.name}</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; } .header { text-align: center; margin-bottom: 30px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; } .section { margin: 20px 0; }
          .section h3 { border-bottom: 2px solid #333; padding-bottom: 5px; } .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { border-top: 2px solid #333; margin-top: 20px; padding-top: 10px; font-weight: bold; font-size: 18px; }
      </style></head><body>
      <div class="header"><h1>SLIP GAJI</h1><p>PT. Barbershop Indonesia</p></div>
      <div class="info"><div><strong>Nama:</strong> ${selectedEmployee.name}</div><div><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</div></div>
      <div class="section"><h3>PENDAPATAN</h3>
          <div class="item"><span>Gaji Pokok</span><span>Rp ${formatNominal(selectedEmployee.baseSalary || 0)}</span></div>
          <div class="item"><span>Komisi Didapat</span><span>Rp ${formatNominal(getEarnedCommission(selectedEmployee.id))}</span></div>
          <div class="item"><span>Bonus</span><span>Rp ${formatNominal(bonusData.bonus)}</span></div>
      </div>
      <div class="section"><h3>POTONGAN</h3>
          <div class="item"><span>Denda/Penalti</span><span>Rp ${formatNominal(bonusData.penalty)}</span></div>
      </div>
      <div class="total item"><span>GAJI BERSIH</span><span>Rp ${formatNominal(calculateTotalSalary(selectedEmployee))}</span></div>
      </body></html>`;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const availableServicesForCommission = useMemo(() => {
    if (!selectedEmployee) return services;
    const assignedServiceIds = new Set(selectedEmployee.commissions?.map(c => c.service_id));
    return services.filter(s => !assignedServiceIds.has(s.id));
  }, [services, selectedEmployee]);

  const filteredEmployees = useMemo(() => {
    return employees; // Tetap tampilkan semua karyawan, filter cabang dihapus
  }, [employees]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex justify-center items-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="text-gray-600">Memuat sistem penggajian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full -mx-6">
      <Card className="border-0 border-t border-b border-gray-200 rounded-none shadow-sm">
        <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl font-bold">Sistem Penggajian Lanjutan</CardTitle>
                <CardDescription className="text-red-50 text-sm">
                  Kelola gaji individu, komisi per layanan, dan cetak slip gaji detail
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-300" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Online ({employees.length} karyawan)
                    </Badge>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-300" />
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Reconnecting...
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-300" />
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Offline - Retrying...
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-800">Ringkasan Penggajian</h3>
                <p className="text-sm text-gray-600 mt-1">Data agregat gaji dan komisi bulan ini</p>
              </div>
              <Badge className="mt-2 sm:mt-0 bg-red-100 text-red-800 border-red-200">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-red-600" />
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Karyawan</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{filteredEmployees.length}</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-green-600" />
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Gaji Pokok</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-bold text-green-600">
                  Rp {filteredEmployees.reduce((sum, emp) => sum + (emp.baseSalary || 0), 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Komisi Didapat</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  Rp {Object.values(earnedCommissions).reduce((sum, commission) => sum + commission, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-red-600" />
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Penggajian</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-bold text-red-600">
                  Rp {filteredEmployees.reduce((sum, emp) => sum + calculateTotalSalary(emp), 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {filteredEmployees.map((employee) => {
              const bonusData = getBonusPenaltyData(employee.id);
              return (
              <div key={employee.id} className="p-6 border-t border-gray-200 first:border-t-0 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-3 md:gap-4">
                  {/* Header Section - Mobile Stacked */}
                  <div className="flex items-start gap-3 md:gap-4">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-red-100 flex-shrink-0">
                      <AvatarFallback className="bg-red-100 text-red-600 font-semibold text-xs md:text-sm">
                        {employee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base lg:text-lg text-gray-800 truncate">{employee.name}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{employee.email}</p>
                      <div className="flex flex-wrap gap-1 md:gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] md:text-xs border-red-200 text-red-700">
                          {employee.position || 'Karyawan'}
                        </Badge>
                        {employee.branch && (
                          <Badge variant="outline" className="text-[10px] md:text-xs border-blue-200 text-blue-700 truncate max-w-[120px]">
                            {employee.branch}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] md:text-xs border-green-200 text-green-700">
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Salary Section */}
                  <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Gaji Bulan Ini</p>
                    <p className="font-bold text-lg md:text-xl lg:text-2xl text-red-600 mb-2">
                      Rp {calculateTotalSalary(employee).toLocaleString("id-ID")}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
                      <Badge variant="secondary" className="text-[10px] md:text-xs bg-green-100 text-green-700 justify-center truncate">
                        Pokok: Rp {formatNominal(employee.baseSalary || 0)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs bg-yellow-100 text-yellow-700 justify-center truncate">
                        Komisi: Rp {formatNominal(getEarnedCommission(employee.id))}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs bg-blue-100 text-blue-700 justify-center truncate">
                        Bonus: Rp {formatNominal(bonusData.bonus)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] md:text-xs bg-red-100 text-red-700 justify-center truncate">
                        Penalty: Rp {formatNominal(bonusData.penalty)}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => openKelolaGajiModal(employee)}
                      className="bg-red-600 hover:bg-red-700 text-white flex-1 h-9 text-xs md:text-sm"
                      size="sm"
                    >
                      <Settings className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Kelola Gaji
                    </Button>
                    <Button 
                      onClick={() => openSlipGajiModal(employee)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-9 text-xs md:text-sm"
                      size="sm"
                    >
                      <Receipt className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Slip Gaji
                    </Button>
                  </div>
                </div>
              </div>
            )})}
          </div>

          <Dialog open={isKelolaGajiOpen} onOpenChange={setIsKelolaGajiOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-red-100 pb-4">
                <DialogTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  Kelola Gaji - {selectedEmployee?.name}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Atur gaji pokok dan komisi dalam satu tempat
                </p>
              </DialogHeader>
              
              <Tabs defaultValue="gaji" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 bg-red-50 border border-red-100">
                  <TabsTrigger value="gaji" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gaji Pokok
                  </TabsTrigger>
                  <TabsTrigger value="komisi" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Komisi & Point
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="gaji" className="pt-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Informasi Gaji Saat Ini</h4>
                      <p className="text-sm text-gray-600">
                        Gaji pokok saat ini: <span className="font-semibold text-red-600">Rp {formatNominal(selectedEmployee?.baseSalary || 0)}</span>
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="salary" className="text-sm font-medium text-gray-700">
                        Gaji Pokok Baru (Rp)
                      </Label>
                      <Input 
                        id="salary" 
                        type="text" 
                        value={newBaseSalary} 
                        onChange={(e) => setNewBaseSalary(formatNominal(e.target.value))}
                        className="text-lg border-red-200 focus:border-red-400"
                        placeholder="Masukkan gaji pokok baru..."
                      />
                      <Button 
                        onClick={handleUpdateBaseSalary} 
                        disabled={loading || !newBaseSalary} 
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Simpan Gaji Pokok
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="komisi" className="pt-6">
                  {/* Info Box - Komisi & Point Bulan Ini */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-yellow-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-red-600" />
                      Ringkasan Komisi & Point Bulan Ini
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Komisi Didapat</p>
                        <p className="text-lg font-bold text-green-600">
                          Rp {formatNominal(getEarnedCommission(selectedEmployee?.id || ''))}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Bonus Point</p>
                        <p className="text-lg font-bold text-blue-600">
                          {getBonusPenaltyData(selectedEmployee?.id || '').bonus.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs text-gray-600 mb-1">Penalty Point</p>
                        <p className="text-lg font-bold text-red-600">
                          {getBonusPenaltyData(selectedEmployee?.id || '').penalty.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info: Pengaturan komisi di menu terpisah */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Info:</strong> Untuk menambah atau mengubah pengaturan komisi, silakan gunakan menu <strong>"Komisi & Point"</strong> di tab utama.
                    </p>
                  </div>

                  {/* Daftar Komisi Aktif - Full Width */}
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Award className="h-4 w-4 text-red-600" />
                      Aturan Komisi Aktif ({selectedEmployee?.commissions?.length || 0})
                    </h4>
                      
                    {selectedEmployee?.commissions?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedEmployee.commissions.map((comm) => {
                          const potentialCommission = comm.commission_type === 'percentage'
                            ? (comm.service_price || 0) * (comm.commission_value / 100)
                            : comm.commission_value;

                          return (
                            <div key={comm.id} className="p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold text-gray-800">{comm.service_name}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {comm.commission_type === 'percentage' ? 'Persentase' : 'Tetap'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Harga Layanan:</span>
                                    <span className="font-medium">Rp {formatNominal(comm.service_price || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Rate Komisi:</span>
                                    <span className="font-medium">
                                      {comm.commission_type === 'percentage' 
                                        ? `${comm.commission_value}%` 
                                        : `Rp ${formatNominal(comm.commission_value)}`
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                  <span className="text-sm font-medium text-gray-700">Potensi per Transaksi:</span>
                                  <span className="font-bold text-green-600">Rp {formatNominal(potentialCommission)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Belum ada pengaturan komisi</p>
                        <p className="text-xs text-gray-400 mt-1">Silakan atur komisi di menu "Komisi & Point"</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Dialog open={showSlipModal} onOpenChange={setShowSlipModal}>
            <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="border-b border-gray-200 pb-3 md:pb-4">
                <DialogTitle className="text-base md:text-xl text-gray-800 flex items-center gap-2">
                  <Receipt className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  <span className="truncate">Slip Gaji - {selectedEmployee?.name}</span>
                </DialogTitle>
              </DialogHeader>

              {selectedEmployee && (
                <div className="space-y-4 md:space-y-6 py-3 md:py-4">
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="p-4 md:p-6 bg-gradient-to-r from-red-50 to-gray-50 border-b border-gray-200 rounded-t-lg">
                      <h3 className="text-center text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">SLIP GAJI</h3>
                      <p className="text-center text-xs md:text-sm text-gray-600">PT. Barbershop Indonesia</p>
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-200">
                          <div className="space-y-1">
                              <p className="truncate"><span className="text-gray-600">Nama:</span> <span className="font-semibold">{selectedEmployee.name}</span></p>
                              <p className="truncate"><span className="text-gray-600">Email:</span> <span className="font-semibold">{selectedEmployee.email}</span></p>
                              <p className="truncate"><span className="text-gray-600">Posisi:</span> <span className="font-semibold">{selectedEmployee.position || 'Karyawan'}</span></p>
                              <p className="truncate"><span className="text-gray-600">Cabang:</span> <span className="font-semibold">{selectedEmployee.branch}</span></p>
                          </div>
                          <div className="text-left sm:text-right space-y-1">
                              <p><span className="text-gray-600">Tanggal:</span> <span className="font-semibold">{new Date().toLocaleDateString('id-ID')}</span></p>
                              <p><span className="text-gray-600">Periode:</span> <span className="font-semibold">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span></p>
                              <p><span className="text-gray-600">Status:</span> <span className="font-semibold">{selectedEmployee.status}</span></p>
                          </div>
                      </div>
                      <div className="mb-4 md:mb-6">
                          <h4 className="font-semibold text-sm md:text-base text-gray-800 border-b border-red-200 pb-2 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" /> PENDAPATAN
                          </h4>
                          <div className="space-y-2 text-xs md:text-sm">
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600">Gaji Pokok</span>
                                  <span className="font-medium">Rp {formatNominal(selectedEmployee.baseSalary || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600">Komisi Didapat</span>
                                  <span className="font-medium text-green-600">+ Rp {formatNominal(getEarnedCommission(selectedEmployee.id))}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600">Bonus</span>
                                  <span className="font-medium text-green-600">+ Rp {formatNominal(getBonusPenaltyData(selectedEmployee.id).bonus)}</span>
                              </div>
                          </div>
                      </div>
                      <div className="mb-4 md:mb-6">
                          <h4 className="font-semibold text-sm md:text-base text-gray-800 border-b border-red-200 pb-2 mb-3 flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" /> POTONGAN
                          </h4>
                          <div className="space-y-2 text-xs md:text-sm">
                              <div className="flex justify-between items-center py-1">
                                  <span className="text-gray-600">Denda/Penalti</span>
                                  <span className="font-medium text-red-600">- Rp {formatNominal(getBonusPenaltyData(selectedEmployee.id).penalty)}</span>
                              </div>
                          </div>
                      </div>
                      <div className="border-t-2 border-red-200 pt-3 md:pt-4">
                          <div className="flex justify-between items-center font-bold text-base md:text-lg bg-red-50 p-3 md:p-4 rounded-lg">
                              <span className="text-gray-800 text-sm md:text-base">GAJI BERSIH</span>
                              <span className="text-red-600 text-lg md:text-xl">Rp {formatNominal(calculateTotalSalary(selectedEmployee))}</span>
                          </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Button onClick={handlePrintSlip} className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 text-sm">
                        <Printer className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" /> 
                        <span className="truncate">Cetak Slip Gaji</span>
                    </Button>
                    <Button variant="outline" onClick={() => setShowSlipModal(false)} className="border-red-200 text-red-600 hover:bg-red-50 h-10 text-sm">
                        Tutup
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}