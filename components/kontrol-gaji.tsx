"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  email?: string
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

export function KontrolGaji({ 
  employees: propEmployees,
  employeeStats: propEmployeeStats
}: { 
  employees?: Employee[]; 
  employeeStats?: any;
} = {}) {
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
          id, name, email, position, branch_id, phone, status, created_at
        `)
        .order('name')
        .eq('status', 'active');

      // Ignore empty error objects, only throw if there's a real error message
      if (usersError?.message && !usersError.message.includes('does not exist')) {
        throw new Error(`Database error: ${usersError.message}`);
      }

      if (!users || users.length === 0) {
        console.warn('⚠️ No active users found');
      } else {
        console.log(`✅ Loaded ${users.length} active users`);
      }
      
      // Fetch branches separately
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name');
      
      if (branchesError) {
        console.error('❌ Branches error:', branchesError);
      }
      
      // Create branch map for quick lookup
      const branchMap = new Map(branches?.map(b => [b.id, b]) || []);
      
      // Enrich users with branch data
      const usersWithBranches = users?.map(user => ({
        ...user,
        branches: user.branch_id ? branchMap.get(user.branch_id) : null
      })) || [];

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

      // Fetch base salaries from employee_salaries table
      const { data: salariesData } = await supabase
        .from('employee_salaries')
        .select('user_id, base_salary')
        .order('created_at', { ascending: false });

      const salariesMap = new Map();
      if (salariesData) {
        // Since we ordered by created_at desc, we get the latest salary if there are multiple
        salariesData.forEach(s => {
          if (!salariesMap.has(String(s.user_id))) {
            salariesMap.set(String(s.user_id), Number(s.base_salary));
          }
        });
      }

      // Calculate earned commissions from transaction_items directly
      const { data: txItems } = await supabase
        .from('transaction_items')
        .select('barber_id, commission_amount')
        .not('commission_amount', 'is', null)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      // Use branches data that was already fetched above
      setBranches(branches || []);
      
      const commissionStats: EarnedCommissionStats = {};
      if (txItems) {
        txItems.forEach(item => {
          if (item.barber_id) {
            commissionStats[String(item.barber_id)] = (commissionStats[String(item.barber_id)] || 0) + (Number(item.commission_amount) || 0);
          }
        });
      }
      setEarnedCommissions(commissionStats);
      
      const servicesMap = new Map(allServices?.map(s => [s.id, { name: s.name, price: s.price }]));

      const processedEmployees: Employee[] = (usersWithBranches || []).map(user => {
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
          id: String(user.id),
          name: user.name,
          email: user.email,
          position: user.position || 'Karyawan',
          baseSalary: salariesMap.get(String(user.id)) || 0,
          commissions: userCommissions,
          branch: user.branches?.name || 'Tidak Ada Cabang',
          branchId: String(user.branch_id),
          joinDate: user.created_at,
          phone: user.phone || '',
          status: user.status || 'active'
        };
      });

      setEmployees(processedEmployees);
      setIsOnline(true);
      setConnectionStatus('connected');
      
      console.log(`✅ Data loaded: ${processedEmployees.length} employees, ${branches?.length} branches`);

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
        const { data, error } = await supabase.from('services').select('*').eq('aktif', true);
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        // Fallback - get all services without filter
        const { data } = await supabase.from('services').select('*').limit(100);
        setServices(data || []);
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

    const globalChannel = setupGlobalEventsListener((event: string, payload: any) => {
      console.log('Global event received in KontrolGaji:', event, payload);
      if (event === 'transaction_deleted' || event === 'transaction_created') {
        fetchData();
      }
    });

    return () => {
      supabase.removeChannel(transactionsChannel);
      komisiChannel.unsubscribe();
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
      const salaryAmount = parseNominal(newBaseSalary);
      // Coba cek apakah data gaji karyawan sudah ada
      const { data: existing } = await supabase
        .from('employee_salaries')
        .select('id')
        .eq('user_id', selectedEmployee.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        // Update
        const { error } = await supabase
          .from('employee_salaries')
          .update({ base_salary: salaryAmount, effective_date: new Date().toISOString() })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('employee_salaries')
          .insert({ user_id: selectedEmployee.id, base_salary: salaryAmount, effective_date: new Date().toISOString() });
        if (error) throw error;
      }

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
    if (propEmployees && propEmployees.length > 0) {
      const allowedIds = new Set(propEmployees.map(e => String(e.id)));
      return employees.filter(e => allowedIds.has(String(e.id)));
    }
    return employees; // Tetap tampilkan semua karyawan, filter cabang dihapus
  }, [employees, propEmployees]);

  if (pageLoading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center p-8 bg-slate-50/50">
        <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
        <p className="text-gray-600 font-medium">Memuat sistem penggajian...</p>
      </div>
    );
  }

  const isSingleEmployee = propEmployees && propEmployees.length === 1;
  const singleEmployee = isSingleEmployee ? propEmployees[0] : null;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* 1. COMPACT MODAL HEADER */}
      <div className="flex-shrink-0 bg-gradient-to-r from-red-700 to-red-600 text-white px-6 py-5 flex items-center justify-between border-b border-red-800">
        {singleEmployee ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarFallback className="bg-red-800 text-white font-bold">
                {singleEmployee.name ? singleEmployee.name.split(" ").map((n) => n[0]).join("") : "KG"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold leading-tight">{singleEmployee.name}</h2>
              <p className="text-xs text-red-100 mt-0.5">{singleEmployee.position || "Karyawan"} · Kelola Gaji Pokok & Slip Gaji</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Sistem Penggajian Lanjutan</h2>
              <p className="text-xs text-red-100 mt-0.5">Kelola gaji individu, komisi per layanan, dan cetak slip gaji detail</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Online ({filteredEmployees.length} karyawan)
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (SCROLLABLE) */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Ringkasan Penggajian */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800">Ringkasan Penggajian</h3>
              <p className="text-xs text-gray-500 mt-0.5">Data agregat gaji dan komisi bulan ini</p>
            </div>
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Users className="h-5 w-5 mx-auto mb-2 text-red-600" />
              <p className="text-xs font-medium text-gray-500">Total Karyawan</p>
              <p className="text-lg font-bold text-red-600">{filteredEmployees.length}</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-xs font-medium text-gray-500">Total Gaji Pokok</p>
              <p className="text-sm font-bold text-green-600 truncate">
                Rp {filteredEmployees.reduce((sum, emp) => sum + (emp.baseSalary || 0), 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
              <p className="text-xs font-medium text-gray-500">Total Komisi</p>
              <p className="text-sm font-bold text-yellow-600 truncate">
                Rp {filteredEmployees.reduce((sum, emp) => sum + (earnedCommissions[emp.id] || 0), 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Award className="h-5 w-5 mx-auto mb-2 text-red-600" />
              <p className="text-xs font-medium text-gray-500">Total Penggajian</p>
              <p className="text-sm font-bold text-red-600 truncate">
                Rp {filteredEmployees.reduce((sum, emp) => sum + calculateTotalSalary(emp), 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {filteredEmployees.map((employee) => {
            const bonusData = getBonusPenaltyData(employee.id);
            return (
              <div key={employee.id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-4">
                  {/* Header Section */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-red-100 flex-shrink-0">
                      <AvatarFallback className="bg-red-100 text-red-600 font-semibold text-sm">
                        {employee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-gray-800 truncate">{employee.name}</p>
                      <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                          {employee.position || 'Karyawan'}
                        </Badge>
                        {employee.branch && (
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 truncate max-w-[150px]">
                            {employee.branch}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Salary Details Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Estimasi Gaji Bersih</p>
                    <p className="font-extrabold text-2xl text-red-600 mb-3">
                      Rp {calculateTotalSalary(employee).toLocaleString("id-ID")}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400">Gaji Pokok</span>
                        <span className="font-bold text-xs text-gray-700">Rp {formatNominal(employee.baseSalary || 0)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400">Komisi</span>
                        <span className="font-bold text-xs text-yellow-600">Rp {formatNominal(getEarnedCommission(employee.id))}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400">Bonus</span>
                        <span className="font-bold text-xs text-green-600">Rp {formatNominal(bonusData.bonus)}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-gray-100 text-center">
                        <span className="block text-[10px] text-gray-400">Penalty</span>
                        <span className="font-bold text-xs text-red-600">Rp {formatNominal(bonusData.penalty)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openKelolaGajiModal(employee)}
                      className="bg-red-600 hover:bg-red-700 text-white flex-1 h-10 rounded-xl"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Kelola Gaji
                    </Button>
                    <Button 
                      onClick={() => openSlipGajiModal(employee)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-10 rounded-xl"
                      size="sm"
                    >
                      <Receipt className="h-4 w-4 mr-2" /> Slip Gaji
                    </Button>
                  </div>
                </div>
              </div>
            )})}
        </div>
      </div>

      {/* Sheet: Kelola Gaji — modern side panel */}
      <Sheet open={isKelolaGajiOpen} onOpenChange={setIsKelolaGajiOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-5 flex-shrink-0">
            <SheetHeader>
              <SheetTitle className="text-white text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Kelola Gaji
              </SheetTitle>
            </SheetHeader>
            {selectedEmployee && (
              <div className="flex items-center gap-3 mt-4">
                <Avatar className="h-11 w-11 ring-2 ring-white/30">
                  <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                    {selectedEmployee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{selectedEmployee.name}</p>
                  <p className="text-red-100 text-sm">{selectedEmployee.position || 'Karyawan'} · {selectedEmployee.branch}</p>
                </div>
              </div>
            )}
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="gaji" className="w-full">
              <div className="px-6 pt-5 pb-0 border-b border-gray-100">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 h-11">
                  <TabsTrigger value="gaji" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Gaji Pokok
                  </TabsTrigger>
                  <TabsTrigger value="komisi" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    Komisi & Point
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="gaji" className="p-6 space-y-5 m-0">
                {/* Current salary summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-green-700 font-medium mb-1">Gaji Pokok Saat Ini</p>
                    <p className="text-lg font-bold text-green-700">
                      Rp {formatNominal(selectedEmployee?.baseSalary || 0)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-yellow-700 font-medium mb-1">Komisi Bulan Ini</p>
                    <p className="text-lg font-bold text-yellow-700">
                      Rp {formatNominal(getEarnedCommission(selectedEmployee?.id || ''))}
                    </p>
                  </div>
                </div>

                {/* Total gaji bersih */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Gaji Bersih</p>
                  <p className="text-2xl font-bold text-red-600">
                    Rp {formatNominal(calculateTotalSalary(selectedEmployee || {} as Employee))}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Bonus: Rp {formatNominal(getBonusPenaltyData(selectedEmployee?.id || '').bonus)}
                    </Badge>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      Penalti: Rp {formatNominal(getBonusPenaltyData(selectedEmployee?.id || '').penalty)}
                    </Badge>
                  </div>
                </div>

                {/* Update salary form */}
                <div className="space-y-3">
                  <Label htmlFor="salary" className="text-sm font-semibold text-gray-700">
                    Ubah Gaji Pokok (Rp)
                  </Label>
                  <Input
                    id="salary"
                    type="text"
                    value={newBaseSalary}
                    onChange={(e) => setNewBaseSalary(formatNominal(e.target.value))}
                    className="h-12 text-base border-gray-200 focus:border-red-400 focus:ring-red-400 rounded-xl"
                    placeholder="Contoh: 3.000.000"
                  />
                  <Button
                    onClick={handleUpdateBaseSalary}
                    disabled={loading || !newBaseSalary}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Simpan Gaji Pokok
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="komisi" className="p-6 space-y-5 m-0">
                {/* Komisi summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-green-700 font-medium mb-1">Komisi Didapat</p>
                    <p className="text-sm font-bold text-green-700 leading-tight">
                      Rp {formatNominal(getEarnedCommission(selectedEmployee?.id || ''))}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-blue-700 font-medium mb-1">Bonus Point</p>
                    <p className="text-sm font-bold text-blue-700 leading-tight">
                      {getBonusPenaltyData(selectedEmployee?.id || '').bonus.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-red-700 font-medium mb-1">Penalti Point</p>
                    <p className="text-sm font-bold text-red-700 leading-tight">
                      {getBonusPenaltyData(selectedEmployee?.id || '').penalty.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Untuk menambah/mengubah aturan komisi, gunakan tab <strong>Komisi & Point</strong> di halaman utama.
                  </p>
                </div>

                {/* Komisi list */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-red-600" />
                    Aturan Komisi Aktif ({selectedEmployee?.commissions?.length || 0})
                  </h4>
                  {selectedEmployee?.commissions?.length ? (
                    <div className="space-y-3">
                      {selectedEmployee.commissions.map((comm) => {
                        const potentialCommission = comm.commission_type === 'percentage'
                          ? (comm.service_price || 0) * (comm.commission_value / 100)
                          : comm.commission_value;
                        return (
                          <div key={comm.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <p className="font-semibold text-gray-800 text-sm leading-tight">{comm.service_name}</p>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {comm.commission_type === 'percentage' ? 'Persentase' : 'Tetap'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                              <div>
                                <span className="block">Harga Layanan</span>
                                <span className="font-semibold text-gray-700">Rp {formatNominal(comm.service_price || 0)}</span>
                              </div>
                              <div>
                                <span className="block">Rate Komisi</span>
                                <span className="font-semibold text-gray-700">
                                  {comm.commission_type === 'percentage'
                                    ? `${comm.commission_value}%`
                                    : `Rp ${formatNominal(comm.commission_value)}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                              <span className="text-xs text-gray-600">Potensi per Transaksi</span>
                              <span className="text-sm font-bold text-green-700">Rp {formatNominal(potentialCommission)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package className="h-7 w-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Belum ada aturan komisi</p>
                      <p className="text-xs text-gray-400 mt-1">Atur komisi di menu "Komisi & Point"</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet: Slip Gaji — modern side panel */}
      <Sheet open={showSlipModal} onOpenChange={setShowSlipModal}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex-shrink-0">
            <SheetHeader>
              <SheetTitle className="text-white text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                Slip Gaji
              </SheetTitle>
            </SheetHeader>
            {selectedEmployee && (
              <div className="flex items-center gap-3 mt-4">
                <Avatar className="h-11 w-11 ring-2 ring-white/30">
                  <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                    {selectedEmployee.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{selectedEmployee.name}</p>
                  <p className="text-slate-300 text-sm">{selectedEmployee.position || 'Karyawan'}</p>
                </div>
                <Badge className="ml-auto bg-white/20 text-white border-0 text-xs">
                  {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </Badge>
              </div>
            )}
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedEmployee && (
              <div className="space-y-5">
                {/* Employee info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Info Karyawan</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-800 text-right truncate">{selectedEmployee.email}</span>
                    <span className="text-gray-500">Posisi</span>
                    <span className="font-medium text-gray-800 text-right">{selectedEmployee.position || 'Karyawan'}</span>
                    <span className="text-gray-500">Cabang</span>
                    <span className="font-medium text-gray-800 text-right">{selectedEmployee.branch}</span>
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium text-gray-800 text-right capitalize">{selectedEmployee.status}</span>
                  </div>
                </div>

                {/* Pendapatan */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-b border-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Pendapatan</span>
                  </div>
                  <div className="divide-y divide-gray-50 px-4">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Gaji Pokok</span>
                      <span className="text-sm font-semibold text-gray-800">Rp {formatNominal(selectedEmployee.baseSalary || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Komisi Didapat</span>
                      <span className="text-sm font-semibold text-green-600">+ Rp {formatNominal(getEarnedCommission(selectedEmployee.id))}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Bonus</span>
                      <span className="text-sm font-semibold text-green-600">+ Rp {formatNominal(getBonusPenaltyData(selectedEmployee.id).bonus)}</span>
                    </div>
                  </div>
                </div>

                {/* Potongan */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Potongan</span>
                  </div>
                  <div className="px-4">
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-600">Denda / Penalti</span>
                      <span className="text-sm font-semibold text-red-600">- Rp {formatNominal(getBonusPenaltyData(selectedEmployee.id).penalty)}</span>
                    </div>
                  </div>
                </div>

                {/* Total gaji bersih */}
                <div className="bg-gradient-to-r from-red-600 to-orange-50 rounded-xl p-5 text-white">
                  <p className="text-sm text-red-100 mb-1">GAJI BERSIH</p>
                  <p className="text-3xl font-bold">Rp {formatNominal(calculateTotalSalary(selectedEmployee))}</p>
                  <p className="text-xs text-red-100 mt-2">
                    Per {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer — actions */}
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3">
            <Button onClick={handlePrintSlip} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold">
              <Printer className="h-4 w-4 mr-2" />
              Cetak Slip Gaji
            </Button>
            <Button variant="outline" onClick={() => setShowSlipModal(false)} className="h-11 px-5 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">
              Tutup
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}