"use client"

import React, { useState, useEffect } from 'react';
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
    Settings, Trash2, CheckCircle, XCircle, Loader2, 
    Users, DollarSign, AlertTriangle, 
    Sparkles, Search, Download, Eye, Edit
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Helper functions
const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

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

// Data Types
interface Employee {
    id: string;
    name: string;
    email: string;
    position?: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
    type: 'service' | 'product';
}

interface CommissionRule {
    id: string;
    user_id: string;
    service_id: string;
    commission_type: 'percentage' | 'fixed';
    commission_value: number;
    service_name?: string;
    service_price?: number;
}

interface EmployeeCommissionStatus {
    employee: Employee;
    totalServices: number;
    configuredServices: number;
    notConfiguredServices: number;
    commissions: CommissionRule[];
    missingServices: Service[];
}

interface TransactionItem {
    id: string;
    transaction_id: string;
    barber_id: string;
    service_id: string;
    quantity: number;
    unit_price: number;
    commission_type?: string | null;
    commission_value?: number | null;
    commission_amount?: number | null;
    created_at: string;
    barber_name?: string;
    service_name?: string;
}

export function KontrolKomisi({ employees = [] }: { employees?: Employee[] }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
    const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeCommissionStatus[]>([]);
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedService, setSelectedService] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
    const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
    const [commissionValue, setCommissionValue] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'instant' });
        loadData();
    }, []);

    // Rebuild employee statuses when employees change
    useEffect(() => {
        if (employees.length > 0 && services.length > 0) {
            buildEmployeeStatuses(employees, services, commissionRules);
        }
    }, [employees, services, commissionRules]);

    // Setup realtime subscriptions
    useEffect(() => {
        const transactionChannel = supabase
            .channel('commission-transactions')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'transaction_items' },
                (payload) => {
                    console.log('📡 Transaction change detected, reloading...');
                    loadData();
                }
            )
            .subscribe();

        const commissionChannel = supabase
            .channel('commission-rules-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'commission_rules' },
                (payload) => {
                    console.log('📡 Commission rule change detected, reloading...');
                    loadData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(transactionChannel);
            supabase.removeChannel(commissionChannel);
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            console.log('[loadData] Starting to load commission data...');
            
            // Load services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('type', 'service')
                .order('name');

            if (servicesError) throw servicesError;
            console.log('[loadData] Services loaded:', servicesData?.length);
            setServices(servicesData || []);

            // Load commission rules
            const { data: rulesData, error: rulesError } = await supabase
                .from('commission_rules')
                .select('*');

            if (rulesError) throw rulesError;
            console.log('[loadData] Commission rules loaded:', rulesData?.length);
            setCommissionRules(rulesData || []);

            // Load recent transactions - gunakan snapshot data
            const { data: transactionsData, error: transactionsError } = await supabase
                .from('transaction_items')
                .select(`
                    *,
                    users:barber_id(name)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (!transactionsError && transactionsData) {
                const formattedTransactions: TransactionItem[] = transactionsData.map((item: any) => ({
                    id: item.id,
                    transaction_id: item.transaction_id,
                    barber_id: item.barber_id,
                    service_id: item.service_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    commission_type: item.commission_type,
                    commission_value: item.commission_value,
                    commission_amount: item.commission_amount,
                    created_at: item.created_at,
                    barber_name: item.users?.name || 'Unknown',
                    service_name: item.service_name || 'Unknown' // Gunakan snapshot
                }));
                console.log('[loadData] Transactions loaded:', formattedTransactions.length);
                setTransactions(formattedTransactions);
            }

            // Build employee statuses
            if (employees.length > 0) {
                console.log('[loadData] Building employee statuses for', employees.length, 'employees');
                buildEmployeeStatuses(employees, servicesData || [], rulesData || []);
            }
            
            console.log('[loadData] Data loading completed successfully');
        } catch (error: any) {
            console.error('[loadData] Error loading data:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const buildEmployeeStatuses = (
        emps: Employee[], 
        servs: Service[], 
        rules: CommissionRule[]
    ) => {
        console.log('[buildEmployeeStatuses] Called with:', {
            employees: emps.length,
            services: servs.length,
            rules: rules.length
        });

        if (!emps || emps.length === 0) {
            console.log('[buildEmployeeStatuses] No employees, setting empty statuses');
            setEmployeeStatuses([]);
            return;
        }

        const statuses: EmployeeCommissionStatus[] = emps.map(employee => {
            // Ambil hanya komisi unik per layanan (yang terbaru jika ada duplikat)
            const employeeRules = rules.filter(r => r.user_id === employee.id);
            const uniqueCommissions = new Map<string, CommissionRule>();
            
            employeeRules.forEach(rule => {
                const existing = uniqueCommissions.get(rule.service_id);
                // Simpan yang terbaru berdasarkan created_at
                if (!existing || (rule.created_at && existing.created_at && new Date(rule.created_at) > new Date(existing.created_at))) {
                    uniqueCommissions.set(rule.service_id, rule);
                } else if (!existing) {
                    uniqueCommissions.set(rule.service_id, rule);
                }
            });

            const employeeCommissions = Array.from(uniqueCommissions.values());
            const configuredServiceIds = employeeCommissions.map(c => c.service_id);
            const missingServices = servs.filter(s => !configuredServiceIds.includes(s.id));

            return {
                employee,
                totalServices: servs.length,
                configuredServices: employeeCommissions.length,
                notConfiguredServices: missingServices.length,
                commissions: employeeCommissions,
                missingServices
            };
        });

        console.log('[buildEmployeeStatuses] Statuses built:', statuses.length);
        setEmployeeStatuses(statuses);
    };

    const openAddCommissionDialog = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSelectedService('');
        setCommissionType('percentage');
        setCommissionValue('');
        setEditMode(false);
        setEditingCommissionId(null);
        setIsDialogOpen(true);
    };

    const openEditCommissionDialog = (employee: Employee, commission: CommissionRule) => {
        const service = services.find(s => s.id === commission.service_id);
        setSelectedEmployee(employee);
        setSelectedService(commission.service_id);
        setCommissionType(commission.commission_type);
        setCommissionValue(String(commission.commission_value));
        setEditMode(true);
        setEditingCommissionId(commission.id);
        setIsDialogOpen(true);
    };

    const handleSaveCommission = async () => {
        if (!selectedEmployee || !selectedService || !commissionValue) {
            toast({
                title: "Error",
                description: "Mohon lengkapi semua field",
                variant: "destructive"
            });
            return;
        }

        const value = parseNominal(commissionValue);
        
        if (value <= 0) {
            toast({
                title: "Error",
                description: "Nilai komisi harus lebih dari 0",
                variant: "destructive"
            });
            return;
        }

        if (commissionType === 'percentage' && value > 100) {
            toast({
                title: "Error",
                description: "Persentase tidak boleh lebih dari 100%",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            console.log('Saving commission:', {
                user_id: selectedEmployee.id,
                service_id: selectedService,
                commission_type: commissionType,
                commission_value: value,
                editMode,
                editingCommissionId
            });

            // CEK DUPLIKAT - Pastikan tidak ada komisi ganda untuk user_id + service_id yang sama
            if (!editMode) {
                console.log('Checking for duplicate commission...');
                const { data: existingCommissions, error: checkError } = await supabase
                    .from('commission_rules')
                    .select('*')
                    .eq('user_id', selectedEmployee.id)
                    .eq('service_id', selectedService);

                if (checkError) {
                    console.error('Error checking duplicates:', checkError);
                    throw checkError;
                }

                if (existingCommissions && existingCommissions.length > 0) {
                    console.log('Duplicate found:', existingCommissions);
                    toast({
                        title: "Komisi Sudah Ada",
                        description: `Komisi untuk layanan ini sudah diatur. Silakan gunakan tombol Edit untuk mengubahnya.`,
                        variant: "destructive"
                    });
                    setLoading(false);
                    return;
                }
            }

            let data, error;

            if (editMode && editingCommissionId) {
                // Update existing commission
                console.log('Updating commission with ID:', editingCommissionId);
                const result = await supabase
                    .from('commission_rules')
                    .update({
                        commission_type: commissionType,
                        commission_value: value
                    })
                    .eq('id', editingCommissionId)
                    .select();
                data = result.data;
                error = result.error;
                console.log('Update result:', { data, error });
            } else {
                // Insert new commission
                console.log('Inserting new commission');
                const result = await supabase
                    .from('commission_rules')
                    .insert({
                        user_id: selectedEmployee.id,
                        service_id: selectedService,
                        commission_type: commissionType,
                        commission_value: value
                    })
                    .select();
                data = result.data;
                error = result.error;
                console.log('Insert result:', { data, error });
            }

            if (error) {
                console.error('Error saving commission:', error);
                
                // Jika error karena constraint unique violation
                if (error.code === '23505') {
                    toast({
                        title: "Komisi Sudah Ada",
                        description: "Komisi untuk karyawan dan layanan ini sudah ada. Gunakan Edit untuk mengubahnya.",
                        variant: "destructive"
                    });
                } else {
                    throw error;
                }
                setLoading(false);
                return;
            }

            console.log('Commission saved successfully:', data);

            toast({
                title: "Berhasil",
                description: editMode ? "Komisi berhasil diupdate" : "Komisi berhasil ditambahkan"
            });

            setIsDialogOpen(false);
            setSelectedEmployee(null);
            setSelectedService('');
            setCommissionValue('');
            setEditMode(false);
            setEditingCommissionId(null);
            
            // Reload data untuk update UI
            await loadData();
        } catch (error: any) {
            console.error('Exception in handleSaveCommission:', error);
            toast({
                title: "Error",
                description: error.message || "Gagal menyimpan komisi",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCommission = async (commissionId: string) => {
        if (!confirm('Hapus komisi ini?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('commission_rules')
                .delete()
                .eq('id', commissionId);

            if (error) throw error;

            toast({
                title: "Berhasil",
                description: "Komisi berhasil dihapus"
            });

            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const openTransactionDialog = (transaction: TransactionItem) => {
        setSelectedTransaction(transaction);
        setCommissionType('percentage');
        setCommissionValue('');
        setIsTransactionDialogOpen(true);
    };

    const handleSaveTransactionCommission = async () => {
        if (!selectedTransaction || !commissionValue) {
            toast({
                title: "Error",
                description: "Mohon masukkan nilai komisi",
                variant: "destructive"
            });
            return;
        }

        const value = parseInt(commissionValue);
        if (isNaN(value)) {
            toast({
                title: "Error",
                description: "Nilai komisi harus berupa angka",
                variant: "destructive"
            });
            return;
        }

        if (commissionType === 'percentage' && (value < 0 || value > 100)) {
            toast({
                title: "Error",
                description: "Persentase harus antara 0-100",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Calculate commission amount
            const commissionAmount = commissionType === 'percentage'
                ? (selectedTransaction.unit_price * selectedTransaction.quantity * value) / 100
                : value;

            // Update transaction item
            const { error } = await supabase
                .from('transaction_items')
                .update({
                    commission_type: commissionType,
                    commission_value: value,
                    commission_amount: commissionAmount,
                    commission_status: 'completed'
                })
                .eq('id', selectedTransaction.id);

            if (error) throw error;

            toast({
                title: "Berhasil!",
                description: "Komisi transaksi berhasil diatur dan tersimpan"
            });

            setIsTransactionDialogOpen(false);
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredStatuses = employeeStatuses.filter(status => 
        status.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        status.employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingTransactions = transactions.filter(t => !t.commission_value);
    const completedTransactions = transactions.filter(t => t.commission_value);

    const getProgressColor = (configured: number, total: number) => {
        const percentage = (configured / total) * 100;
        if (percentage === 100) return 'text-green-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getProgressBg = (configured: number, total: number) => {
        const percentage = (configured / total) * 100;
        if (percentage === 100) return 'bg-green-600';
        if (percentage >= 50) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    if (loading && employeeStatuses.length === 0) {
        return (
            <div className="w-full -mx-6">
                <Card className="border-0 border-t border-b border-gray-200 rounded-none">
                    <CardContent className="p-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-red-600 mb-4" />
                        <p className="text-gray-600">Memuat data komisi...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full -mx-6">
            <Card className="border-0 border-t border-b border-gray-200 rounded-none shadow-sm">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-xl font-bold mb-2">
                                <Sparkles className="h-6 w-6" />
                                Kontrol Komisi
                            </CardTitle>
                            <CardDescription className="text-red-50 text-sm">
                                Kelola dan pantau semua komisi transaksi (realtime)
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <Tabs defaultValue="transactions" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="transactions" className="gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Transaksi ({pendingTransactions.length})
                            </TabsTrigger>
                            <TabsTrigger value="manage" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Atur Komisi
                            </TabsTrigger>
                            <TabsTrigger value="status" className="gap-2">
                                <Users className="h-4 w-4" />
                                Status
                            </TabsTrigger>
                            <TabsTrigger value="overview" className="gap-2">
                                <DollarSign className="h-4 w-4" />
                                Overview
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: TRANSAKSI (PRIORITY) */}
                        <TabsContent value="transactions" className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-yellow-800 mb-1">Transaksi Perlu Diatur</p>
                                        <p className="text-sm text-yellow-700">
                                            Ada {pendingTransactions.length} transaksi yang belum diatur komisinya. 
                                            Klik "Atur Komisi" untuk langsung menyimpan data komisi!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {pendingTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-xl font-semibold text-gray-800 mb-2">Semua Transaksi Sudah Diatur!</p>
                                    <p className="text-gray-600">Tidak ada transaksi yang perlu pengaturan komisi</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingTransactions.map((transaction) => (
                                        <div 
                                            key={transaction.id}
                                            className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-lg hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                                        Belum Diatur
                                                    </Badge>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-gray-800">{transaction.barber_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {transaction.service_name} • {formatRupiah(transaction.unit_price)} x {transaction.quantity}
                                                </p>
                                                <p className="text-lg font-bold text-red-600 mt-1">
                                                    Total: {formatRupiah(transaction.unit_price * transaction.quantity)}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => openTransactionDialog(transaction)}
                                                className="gap-2 bg-red-600 hover:bg-red-700"
                                                disabled={loading}
                                            >
                                                <Settings className="h-4 w-4" />
                                                Atur Komisi
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Transaksi yang sudah diatur */}
                            {completedTransactions.length > 0 && (
                                <div className="mt-6">
                                    <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Sudah Diatur ({completedTransactions.length} Transaksi)
                                    </p>
                                    <div className="space-y-2">
                                        {completedTransactions.slice(0, 10).map((transaction) => (
                                            <div 
                                                key={transaction.id}
                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm text-gray-800">{transaction.barber_name}</p>
                                                    <p className="text-xs text-gray-600">{transaction.service_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-green-600">
                                                        {transaction.commission_type === 'percentage' 
                                                            ? `${transaction.commission_value}%`
                                                            : formatRupiah(transaction.commission_value || 0)
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        = {formatRupiah(transaction.commission_amount || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* TAB 2: ATUR KOMISI */}
                        <TabsContent value="manage" className="space-y-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Cari karyawan..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-0">
                                {filteredStatuses.map((status, index) => (
                                    <div 
                                        key={status.employee.id}
                                        className="border-t border-gray-200 first:border-t-0 p-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                                                    <AvatarFallback className="bg-red-600 text-white font-bold">
                                                        {status.employee.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg text-gray-800">{status.employee.name}</p>
                                                    <p className="text-sm text-gray-600">{status.employee.email}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {status.employee.position || 'Karyawan'}
                                                        </Badge>
                                                        <Badge 
                                                            variant={status.configuredServices === status.totalServices ? "default" : "destructive"}
                                                            className="text-xs"
                                                        >
                                                            {status.configuredServices}/{status.totalServices} Layanan
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`text-3xl font-bold mb-1 ${getProgressColor(status.configuredServices, status.totalServices)}`}>
                                                    {Math.round((status.configuredServices / status.totalServices) * 100)}%
                                                </div>
                                                <p className="text-xs text-gray-600">Komisi Teratur</p>
                                                <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getProgressBg(status.configuredServices, status.totalServices)} transition-all`}
                                                        style={{ width: `${(status.configuredServices / status.totalServices) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Komisi yang sudah diatur */}
                                        {status.commissions.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    Komisi Sudah Diatur ({status.commissions.length})
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {status.commissions.map((commission) => {
                                                        const service = services.find(s => s.id === commission.service_id);
                                                        return (
                                                            <div 
                                                                key={commission.id}
                                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                                            >
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm text-gray-800">{service?.name}</p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {commission.commission_type === 'percentage' 
                                                                            ? `${commission.commission_value}%`
                                                                            : formatRupiah(commission.commission_value)
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openEditCommissionDialog(status.employee, commission)}
                                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteCommission(commission.id)}
                                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Layanan yang belum diatur */}
                                        {status.notConfiguredServices > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                    Belum Diatur ({status.notConfiguredServices} Layanan)
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => openAddCommissionDialog(status.employee)}
                                                        size="sm"
                                                        className="gap-2 bg-red-600 hover:bg-red-700"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        Atur Komisi
                                                    </Button>
                                                    <p className="text-xs text-gray-600">
                                                        {status.missingServices.map(s => s.name).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {filteredStatuses.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">Tidak ada karyawan ditemukan</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* TAB 2: STATUS KOMISI */}
                        <TabsContent value="status" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-green-600 rounded-lg">
                                                <CheckCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {employeeStatuses.filter(s => s.configuredServices === s.totalServices).length}
                                                </p>
                                                <p className="text-sm text-gray-600">Komisi Lengkap</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-yellow-50 border-yellow-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-yellow-600 rounded-lg">
                                                <AlertTriangle className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-yellow-600">
                                                    {employeeStatuses.filter(s => s.configuredServices > 0 && s.configuredServices < s.totalServices).length}
                                                </p>
                                                <p className="text-sm text-gray-600">Sebagian Diatur</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-red-50 border-red-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-red-600 rounded-lg">
                                                <XCircle className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {employeeStatuses.filter(s => s.configuredServices === 0).length}
                                                </p>
                                                <p className="text-sm text-gray-600">Belum Diatur</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-2">
                                {employeeStatuses.map((status) => {
                                    const percentage = Math.round((status.configuredServices / status.totalServices) * 100);
                                    let statusColor = 'red';
                                    let statusText = 'Belum Diatur';
                                    
                                    if (percentage === 100) {
                                        statusColor = 'green';
                                        statusText = 'Lengkap';
                                    } else if (percentage > 0) {
                                        statusColor = 'yellow';
                                        statusText = 'Sebagian';
                                    }

                                    return (
                                        <div key={status.employee.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-4 flex-1">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className={`bg-${statusColor}-600 text-white font-bold text-sm`}>
                                                        {status.employee.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">{status.employee.name}</p>
                                                    <p className="text-sm text-gray-600">{status.configuredServices}/{status.totalServices} layanan diatur</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full bg-${statusColor}-600 transition-all`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <Badge variant={percentage === 100 ? "default" : "destructive"} className="min-w-[80px] justify-center">
                                                    {statusText}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        {/* TAB 3: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-center">
                                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <p className="text-3xl font-bold text-gray-800">{employeeStatuses.length}</p>
                                            <p className="text-sm text-gray-600">Total Karyawan</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-center">
                                            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-3xl font-bold text-gray-800">{services.length}</p>
                                            <p className="text-sm text-gray-600">Total Layanan</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-center">
                                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <p className="text-3xl font-bold text-gray-800">{commissionRules.length}</p>
                                            <p className="text-sm text-gray-600">Komisi Diatur</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="text-center">
                                            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                            <p className="text-3xl font-bold text-gray-800">
                                                {(employeeStatuses.length * services.length) - commissionRules.length}
                                            </p>
                                            <p className="text-sm text-gray-600">Belum Diatur</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Detail Per Karyawan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {employeeStatuses.map((status) => (
                                            <div key={status.employee.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-semibold text-gray-800">{status.employee.name}</p>
                                                    <Badge variant={status.configuredServices === status.totalServices ? "default" : "destructive"}>
                                                        {Math.round((status.configuredServices / status.totalServices) * 100)}%
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Total Layanan</p>
                                                        <p className="font-semibold">{status.totalServices}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Sudah Diatur</p>
                                                        <p className="font-semibold text-green-600">{status.configuredServices}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Belum Diatur</p>
                                                        <p className="font-semibold text-red-600">{status.notConfiguredServices}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Dialog: Add Commission */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editMode ? 'Edit Komisi' : 'Atur Komisi'} - {selectedEmployee?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pilih Layanan</Label>
                            <Select 
                                value={selectedService} 
                                onValueChange={setSelectedService}
                                disabled={editMode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih layanan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {editMode ? (
                                        // Saat edit, tampilkan layanan yang sedang diedit
                                        services
                                            .filter(s => s.id === selectedService)
                                            .map(service => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name} - {formatRupiah(service.price)}
                                                </SelectItem>
                                            ))
                                    ) : (
                                        // Saat tambah, tampilkan layanan yang belum diatur
                                        selectedEmployee && 
                                            employeeStatuses
                                                .find(s => s.employee.id === selectedEmployee.id)
                                                ?.missingServices.map(service => (
                                                    <SelectItem key={service.id} value={service.id}>
                                                        {service.name} - {formatRupiah(service.price)}
                                                    </SelectItem>
                                                ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipe Komisi</Label>
                            <Select 
                                value={commissionType} 
                                onValueChange={(value: 'percentage' | 'fixed') => setCommissionType(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Nilai Komisi {commissionType === 'percentage' ? '(%)' : '(Rp)'}
                            </Label>
                            <Input
                                type="text"
                                value={commissionType === 'percentage' ? commissionValue : formatNominal(commissionValue)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (commissionType === 'percentage') {
                                        // Untuk percentage, hanya angka tanpa format
                                        const numericValue = value.replace(/[^0-9]/g, '');
                                        setCommissionValue(numericValue);
                                    } else {
                                        // Untuk fixed, simpan angka murni tapi tampilkan dengan format
                                        const numericValue = value.replace(/[^0-9]/g, '');
                                        setCommissionValue(numericValue);
                                    }
                                }}
                                placeholder={commissionType === 'percentage' ? 'Contoh: 10' : 'Contoh: 50.000'}
                            />
                            {commissionType === 'percentage' && commissionValue && (
                                <p className="text-xs text-gray-600">
                                    = {parseNominal(commissionValue)}% dari harga layanan
                                </p>
                            )}
                            {commissionType === 'fixed' && commissionValue && (
                                <p className="text-xs text-gray-600">
                                    = {formatRupiah(parseNominal(commissionValue))} per transaksi
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSaveCommission}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Komisi'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Transaction Commission */}
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Atur Komisi Transaksi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="font-semibold text-gray-800 mb-2">{selectedTransaction?.barber_name}</p>
                            <p className="text-sm text-gray-600 mb-1">{selectedTransaction?.service_name}</p>
                            <p className="text-lg font-bold text-red-600">
                                {selectedTransaction && formatRupiah(selectedTransaction.unit_price * selectedTransaction.quantity)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedTransaction && new Date(selectedTransaction.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipe Komisi</Label>
                            <Select 
                                value={commissionType} 
                                onValueChange={(value: 'percentage' | 'fixed') => setCommissionType(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Nilai Komisi {commissionType === 'percentage' ? '(%)' : '(Rp)'}</Label>
                            <Input
                                type="text"
                                value={commissionType === 'percentage' ? commissionValue : formatNominal(commissionValue)}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (commissionType === 'percentage') {
                                        // Untuk percentage, hanya angka tanpa format
                                        const numericValue = value.replace(/[^0-9]/g, '');
                                        setCommissionValue(numericValue);
                                    } else {
                                        // Untuk fixed, simpan angka murni tapi tampilkan dengan format
                                        const numericValue = value.replace(/[^0-9]/g, '');
                                        setCommissionValue(numericValue);
                                    }
                                }}
                                placeholder={commissionType === 'percentage' ? '10' : '50.000'}
                            />
                            {selectedTransaction && commissionType === 'percentage' && commissionValue && (
                                <p className="text-sm font-semibold text-green-600 bg-green-50 p-2 rounded">
                                    Komisi: {formatRupiah((selectedTransaction.unit_price * selectedTransaction.quantity * parseNominal(commissionValue)) / 100)}
                                </p>
                            )}
                            {commissionType === 'fixed' && commissionValue && (
                                <p className="text-sm font-semibold text-green-600 bg-green-50 p-2 rounded">
                                    Komisi: {formatRupiah(parseNominal(commissionValue))}
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                                <strong>💾 Auto-Save:</strong> Komisi ini akan langsung tersimpan di database dan 
                                dihitung dalam sistem penggajian bulan ini!
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsTransactionDialogOpen(false)}
                            className="flex-1"
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSaveTransactionCommission}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                '💾 Simpan & Terapkan'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
