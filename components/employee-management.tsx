"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Plus,
    Search,
    Users,
    TrendingUp,
    Star,
    UserX,
    Mail,
    Phone,
    Eye,
    Edit,
    Trash2,
    FileText,
    EyeOff,
    Loader2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
} from "lucide-react"
import {
    supabase,
    getEmployees,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    getEmployeeStats,
    getEmployeeCommissions,
    getEmployeeAttendance,
    getAbsentEmployeesToday,
    setupEmployeeRealtime,
    Employee,
    EmployeeStats,
    getEmployeeAbsenceInfo,
    updateMaxAbsentDays,
} from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

import { KontrolKomisi } from "./kontrol-komisi"
import { KontrolPresensi } from "./kontrol-presensi"
import { KontrolGaji } from "./kontrol-gaji"

// 🔥 FUNGSI FORMAT RUPIAH BARU
const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatRupiahDecimal = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [employeeStats, setEmployeeStats] = useState<Record<string, EmployeeStats>>({})
    const [employeeCommissions, setEmployeeCommissions] = useState<Record<string, any[]>>({})
    const [employeeAttendance, setEmployeeAttendance] = useState<Record<string, any>>({})
    const [operationLoading, setOperationLoading] = useState(false)

    const [showNewEmployeePin, setShowNewEmployeePin] = useState(false)
    const [showEditEmployeePin, setShowEditEmployeePin] = useState(false)

    const { toast } = useToast()

    const [absentEmployees, setAbsentEmployees] = useState<Employee[]>([])
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

    const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false)
    const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")

    // State untuk manajemen hari libur
    const [selectedEmployeeForAbsence, setSelectedEmployeeForAbsence] = useState<Employee | null>(null)
    const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false)
    const [absenceInfo, setAbsenceInfo] = useState({
        maxAbsentDays: 4,
        currentAbsentDays: 0,
        remainingDays: 4,
        excessDays: 0
    })
    const [updatingAbsence, setUpdatingAbsence] = useState(false)

    const [newEmployee, setNewEmployee] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        pin: "",
        status: "active",
    })

    const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

    const [isEditPayrollOpen, setIsEditPayrollOpen] = useState(false)
    const [editingPayrollEmployee, setEditingPayrollEmployee] = useState<Employee | null>(null)
    const [payrollForm, setPayrollForm] = useState({
        baseSalary: 0,
        commissionRate: 0,
        overtimeRate: 0,
        bonusPoints: 0,
    })

    // Fungsi untuk load absence info
    const loadAbsenceInfo = async (employeeId: string) => {
        try {
            const info = await getEmployeeAbsenceInfo(employeeId)
            setAbsenceInfo(info)
        } catch (error) {
            console.error("Error loading absence info:", error)
        }
    }

    // Fungsi untuk update max days
    const handleUpdateMaxDays = async (employeeId: string, maxDays: number) => {
        setUpdatingAbsence(true)
        try {
            await updateMaxAbsentDays(employeeId, maxDays)
            await loadAbsenceInfo(employeeId)
            toast({
                title: "Berhasil",
                description: "Jumlah hari libur berhasil diupdate",
            })
        } catch (error) {
            console.error("Error updating max days:", error)
            toast({
                title: "Error",
                description: "Gagal mengupdate jumlah hari libur",
                variant: "destructive",
            })
        } finally {
            setUpdatingAbsence(false)
        }
    }

    const loadAbsentEmployees = async () => {
        try {
            const absent = await getAbsentEmployeesToday()
            setAbsentEmployees(absent)
        } catch (error) {
            console.error("Error loading absent employees:", error)
        }
    }

    const loadEmployees = async () => {
        setLoading(true)
        try {
            const { data, error } = await getEmployees()
            if (error) {
                console.error("Error loading employees:", error)
                toast({
                    title: "Error",
                    description: "Gagal memuat data karyawan",
                    variant: "destructive",
                })
            } else {
                console.log("Loaded employees from database:", data.length)
                setEmployees(data || [])

                if (data && data.length > 0) {
                    await loadEmployeeStats(data)
                }
            }
        } catch (error) {
            console.error("Error loading employees:", error)
            toast({
                title: "Error",
                description: "Terjadi kesalahan saat memuat data karyawan",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadEmployeeStats = async (employeeList: Employee[]) => {
        const statsPromises = employeeList.map(async (employee) => {
            const [stats, commissions, attendance] = await Promise.all([
                getEmployeeStats(employee.id),
                getEmployeeCommissions(employee.id),
                getEmployeeAttendance(employee.id),
            ]);

            return {
                id: employee.id,
                stats: stats || {
                    totalTransactions: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                    averageTransaction: 0,
                    bonusPoints: 0,
                    penaltyPoints: 0,
                    totalBonus: 0,
                    totalPenalty: 0
                },
                commissions: commissions.data || [],
                attendance: attendance.data || [],
                attendanceRate: attendance.attendanceRate || 0,
                presentDays: attendance.presentDays || 0,
                lateDays: attendance.lateDays || 0,
                overtimeHours: attendance.overtimeHours || 0,
            };
        });

        const results = await Promise.all(statsPromises);

        const newStats: Record<string, EmployeeStats> = {};
        const newCommissions: Record<string, any[]> = {};
        const newAttendance: Record<string, any> = {};

        results.forEach((result) => {
            newStats[result.id] = result.stats;
            newCommissions[result.id] = result.commissions;
            newAttendance[result.id] = {
                data: result.attendance,
                attendanceRate: result.attendanceRate,
                presentDays: result.presentDays,
                lateDays: result.lateDays,
                overtimeHours: result.overtimeHours,
            };
        });

        setEmployeeStats(newStats);
        setEmployeeCommissions(newCommissions);
        setEmployeeAttendance(newAttendance);
    };

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        loadEmployees()
        loadAbsentEmployees()
    }, [])

    // Refresh data stats only (without reloading entire page)
    useEffect(() => {
        console.log("Setting up real-time subscription for employees")

        const channel = setupEmployeeRealtime(async () => {
            console.log("Real-time update received, refreshing stats only...")
            // Hanya refresh stats, tidak reload full employees
            if (employees.length > 0) {
                await loadEmployeeStats(employees)
            }
            // Refresh absent employees
            await loadAbsentEmployees()
        })

        return () => {
            console.log("Cleaning up real-time subscription")
            supabase.removeChannel(channel)
        }
    }, [employees])

    const activeEmployees = employees.filter((e) => e.status !== "inactive").length
    const totalSalary = employees.reduce((sum, emp) => {
        const stats = employeeStats[emp.id]
        const baseSalary = emp.salary || 3000000
        const commission = stats?.totalCommission || 0
        return sum + baseSalary + commission
    }, 0)

    const filteredEmployees = employees.filter((employee) => {
        const matchesSearch =
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.position || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.phone || "").toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = filterStatus === "all" || employee.status?.toLowerCase() === filterStatus.toLowerCase()
        
        return matchesSearch && matchesStatus
    })

    const handleViewDetail = (employee: Employee) => {
        setSelectedEmployeeDetail(employee);
        setIsDetailDialogOpen(true);
    };

    const handleOpenAbsenceDialog = async (employee: Employee) => {
        setSelectedEmployeeForAbsence(employee);
        await loadAbsenceInfo(employee.id);
        setIsAbsenceDialogOpen(true);
    };

    const handleDeleteConfirmation = (employee: Employee) => {
        setEmployeeToDelete(employee);
        setIsDeleteDialogOpen(true);
    };

    const handleAddEmployee = async () => {
        console.log("=== handleAddEmployee called ===")
        console.log("newEmployee data:", newEmployee)
        
        if (!newEmployee.name.trim()) {
            console.log("Validation failed: name is empty")
            toast({
                title: "Error",
                description: "Nama karyawan harus diisi",
                variant: "destructive",
            })
            return
        }
        
        if (!newEmployee.email.trim() || !/\S+@\S+\.\S+/.test(newEmployee.email)) {
            console.log("Validation failed: email invalid")
            toast({
                title: "Error",
                description: "Email harus valid",
                variant: "destructive",
            })
            return
        }
        
        if (!newEmployee.position.trim()) {
            console.log("Validation failed: position is empty")
            toast({
                title: "Error",
                description: "Posisi harus diisi",
                variant: "destructive",
            })
            return
        }
        
        if (!newEmployee.pin || newEmployee.pin.length !== 6) {
            console.log("Validation failed: PIN invalid", { pin: newEmployee.pin, length: newEmployee.pin?.length })
            toast({
                title: "Error",
                description: "PIN harus 6 digit",
                variant: "destructive",
            })
            return
        }

        console.log("All validations passed, starting to add employee...")
        setOperationLoading(true)
        try {
            console.log("Adding new employee:", newEmployee)
            const { data, error } = await addEmployee({
                name: newEmployee.name,
                email: newEmployee.email,
                phone: newEmployee.phone,
                position: newEmployee.position,
                pin: newEmployee.pin,
                status: newEmployee.status,
            })

            if (error) {
                console.error("Error adding employee:", error)
                toast({
                    title: "Error",
                    description: error.message || "Gagal menambahkan karyawan",
                    variant: "destructive",
                })
                setOperationLoading(false)
                return
            }

            console.log("Employee added successfully:", data)
            toast({
                title: "Berhasil",
                description: "Karyawan berhasil ditambahkan",
            })

            setIsAddDialogOpen(false)
            setNewEmployee({ 
                name: "", 
                email: "", 
                phone: "",
                position: "",
                pin: "",
                status: "active",
            })
            await loadEmployees()
            setOperationLoading(false)
        } catch (error) {
            console.error("Error in handleAddEmployee:", error)
            toast({
                title: "Error",
                description: "Terjadi kesalahan saat menambahkan karyawan",
                variant: "destructive",
            })
            setOperationLoading(false)
        }
    }

    const handleEditEmployee = (employee: Employee) => {
        setEditEmployee(employee)
        setIsEditDialogOpen(true)
    }

    const handleUpdateEmployee = async () => {
        if (!editEmployee) {
            toast({
                title: "Error",
                description: "Tidak ada data karyawan yang dipilih untuk diupdate.",
                variant: "destructive",
            });
            return;
        }

        setOperationLoading(true)
        try {
            const { data, error } = await updateEmployee(editEmployee.id, {
                name: editEmployee.name,
                email: editEmployee.email,
                phone: editEmployee.phone,
                pin: editEmployee.pin,
                status: editEmployee.status,
                position: editEmployee.position,
            });

            if (error) {
                console.error("Error updating employee:", error);
                toast({
                    title: "Error",
                    description: `Gagal mengupdate karyawan: ${error.message}`,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Berhasil",
                description: "Data karyawan berhasil diupdate.",
            });

            setIsEditDialogOpen(false);
            setEditEmployee(null);
            await loadEmployees();
        } catch (e: any) {
            console.error("Exception in handleUpdateEmployee:", e);
            toast({
                title: "Error Sistem",
                description: `Terjadi kesalahan tak terduga: ${e.message}`,
                variant: "destructive",
            });
        } finally {
            setOperationLoading(false)
        }
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        setOperationLoading(true)
        try {
            const employeeExists = employees.find(emp => emp.id === employeeId);
            if (!employeeExists) {
                toast({
                    title: "Error",
                    description: "Karyawan tidak ditemukan untuk dihapus.",
                    variant: "destructive",
                });
                setIsDeleteDialogOpen(false);
                return;
            }

            const { data, error } = await deleteEmployee(employeeId);

            if (error) {
                console.error("Error deleting employee:", {
                    message: error.message,
                    details: error.details,
                    code: error.code,
                    hint: error.hint,
                });
                toast({
                    title: "Gagal Menghapus",
                    description: error.message || "Terjadi kesalahan pada server.",
                    variant: "destructive",
                });
                setIsDeleteDialogOpen(false);
                return;
            }

            toast({
                title: "Berhasil",
                description: `Karyawan ${employeeExists.name} berhasil dihapus.`,
            });

            setIsDeleteDialogOpen(false);
            setEmployeeToDelete(null);
            await loadEmployees();

        } catch (e: any) {
            console.error("Exception in handleDeleteEmployee:", e);
            toast({
                title: "Error Sistem",
                description: "Terjadi kesalahan tak terduga.",
                variant: "destructive",
            });
            setIsDeleteDialogOpen(false);
        } finally {
            setOperationLoading(false)
        }
    };

    const handleGeneratePayslip = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsPayslipDialogOpen(true)
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800"
            case "inactive":
                return "bg-red-100 text-red-800"
            case "on-leave":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-green-100 text-green-800"
        }
    }

    const getStatusText = (status?: string) => {
        switch (status) {
            case "active":
                return "Aktif"
            case "inactive":
                return "Tidak Aktif"
            case "on-leave":
                return "Cuti"
            default:
                return "Aktif"
        }
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Manajemen Karyawan</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">Kelola semua karyawan di sistem</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 w-full sm:w-auto text-sm">
                            <Plus className="h-4 w-4" />
                            <span className="hidden xs:inline">Tambah Karyawan</span>
                            <span className="xs:hidden">Tambah</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-lg md:text-xl">Tambah Karyawan Baru</DialogTitle>
                            <DialogDescription className="text-xs md:text-sm">Isi informasi karyawan baru yang akan ditambahkan</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap *</Label>
                                <Input
                                    id="name"
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                    placeholder="Nama lengkap karyawan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor Telepon</Label>
                                <Input
                                    id="phone"
                                    value={newEmployee.phone}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                    placeholder="+62 812 xxxx xxxx"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Posisi *</Label>
                                <Input
                                    id="position"
                                    value={newEmployee.position}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                                    placeholder="Masukkan posisi"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pin">PIN Keamanan (6 digit) *</Label>
                                <div className="relative">
                                    <Input
                                        id="pin"
                                        type={showNewEmployeePin ? "text" : "password"}
                                        maxLength={6}
                                        value={newEmployee.pin || ""}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, pin: e.target.value })}
                                        placeholder="••••••"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowNewEmployeePin(!showNewEmployeePin)}
                                    >
                                        {showNewEmployeePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={newEmployee.status}
                                    onValueChange={(value) => setNewEmployee({ ...newEmployee, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                        <SelectItem value="on-leave">Cuti</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={operationLoading}>
                                Batal
                            </Button>
                            <Button type="button" onClick={handleAddEmployee} disabled={operationLoading}>
                                {operationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah Karyawan"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards - RESPONSIVE */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                        <CardTitle className="text-xs md:text-sm font-medium">Total Karyawan</CardTitle>
                        <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                        <div className="text-lg md:text-2xl font-bold">{employees.length}</div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{activeEmployees} aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                        <CardTitle className="text-xs md:text-sm font-medium">Total Gaji</CardTitle>
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                        <div className="text-sm md:text-2xl font-bold truncate">{formatRupiah(totalSalary)}</div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">Per bulan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                        <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">Tidak Hadir Hari Ini</CardTitle>
                        <UserX className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                        <div className="text-lg md:text-2xl font-bold">{absentEmployees.length}</div>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {absentEmployees.length > 0
                                ? absentEmployees
                                    .slice(0, 2)
                                    .map((emp) => emp.name)
                                    .join(", ") + (absentEmployees.length > 2 ? "..." : "")
                                : "Semua hadir"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                        <CardTitle className="text-xs md:text-sm font-medium">Karyawan Cuti</CardTitle>
                        <UserX className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                        <div className="text-lg md:text-2xl font-bold">{employees.filter((e) => e.status === "on-leave").length}</div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">Sedang cuti</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters - RESPONSIVE */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari karyawan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm"
                        />
                    </div>
                </div>
                <Select value={filterStatus} onValueChange={(value) => {
                    console.log("Filter changed to:", value);
                    setFilterStatus(value);
                }}>
                    <SelectTrigger className="w-full sm:w-40 md:w-48">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        <SelectItem value="on-leave">Cuti</SelectItem>
                        <SelectItem value="suspended">Ditangguhkan</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Employee Tabs - RESPONSIVE */}
            <Tabs defaultValue="grid" className="space-y-4 md:space-y-6">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto gap-1">
                    <TabsTrigger value="grid" className="text-xs md:text-sm py-2">Grid View</TabsTrigger>
                    <TabsTrigger value="transactions" className="text-xs md:text-sm py-2">Komisi & Point</TabsTrigger>
                    <TabsTrigger value="attendance" className="text-xs md:text-sm py-2">Presensi</TabsTrigger>
                    <TabsTrigger value="payroll" className="text-xs md:text-sm py-2">Penggajian</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="space-y-4 md:space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p>Memuat data karyawan...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Tidak ada karyawan ditemukan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                            {filteredEmployees.map((employee) => {
                                const stats = employeeStats[employee.id] || { totalTransactions: 0, totalCommission: 0 }
                                const attendance = employeeAttendance[employee.id] || { attendanceRate: 100 }

                                return (
                                    <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="p-3 md:p-4 lg:p-6">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                                    <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                                                        <AvatarImage src={employee.avatar_url || "/images/pigtown-logo.png"} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs md:text-sm">
                                                            {employee.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-sm md:text-base lg:text-lg truncate">{employee.name}</CardTitle>
                                                        <CardDescription className="text-xs md:text-sm truncate">
                                                            {employee.position || "Karyawan"}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge className={`${getStatusColor(employee.status)} text-[10px] md:text-xs flex-shrink-0`}>{getStatusText(employee.status)}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 md:space-y-4 p-3 md:p-4 lg:p-6 pt-0">
                                            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate">{employee.email || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate">{employee.phone || "N/A"}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 text-xs md:text-sm">
                                                <div>
                                                    <p className="text-muted-foreground text-[10px] md:text-xs">Transaksi</p>
                                                    <p className="font-medium">{stats.totalTransactions}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-[10px] md:text-xs">Komisi & Point</p>
                                                    <p className="font-medium text-xs md:text-sm truncate">{formatRupiah(stats.totalCommission || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-[10px] md:text-xs">Presensi</p>
                                                    <p className="font-medium">{attendance.attendanceRate || 0}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-[10px] md:text-xs">Gaji Pokok</p>
                                                    <p className="font-medium text-xs md:text-sm truncate">{formatRupiah(employee.salary || 0)}</p>
                                                </div>
                                            </div>

                                            {/* 🔥 INFO HARI LIBUR - RESPONSIVE */}
                                            <div className="p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-center justify-between mb-1 md:mb-2">
                                                    <span className="text-xs md:text-sm font-medium text-blue-800">Hari Libur</span>
                                                    <Badge variant={employee.current_absent_days && employee.current_absent_days > (employee.max_absent_days || 4) ? "destructive" : "outline"} className="text-[10px] md:text-xs">
                                                        {employee.current_absent_days || 0}/{employee.max_absent_days || 4}
                                                    </Badge>
                                                </div>
                                                <div className="text-[10px] md:text-xs text-blue-600">
                                                    {employee.current_absent_days && employee.current_absent_days > (employee.max_absent_days || 4) 
                                                        ? "⚠️ Melebihi batas" 
                                                        : "✅ Masih dalam batas"}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 gap-1 bg-transparent text-xs md:text-sm h-8 md:h-9"
                                                    onClick={() => handleViewDetail(employee)}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Detail</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 gap-1 bg-transparent text-xs md:text-sm h-8 md:h-9"
                                                    onClick={() => handleEditEmployee(employee)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 gap-1 text-blue-600 hover:text-blue-700 bg-transparent text-xs md:text-sm h-8 md:h-9"
                                                    onClick={() => handleOpenAbsenceDialog(employee)}
                                                >
                                                    <Calendar className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Libur</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1 text-red-600 hover:text-red-700 bg-transparent text-xs md:text-sm h-8 md:h-9 px-2"
                                                    onClick={() => handleDeleteConfirmation(employee)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-6">
                    <KontrolKomisi employees={filteredEmployees} />
                </TabsContent>

                <TabsContent value="attendance" className="mt-6">
                    <KontrolPresensi employees={filteredEmployees} employeeAttendance={employeeAttendance} />
                </TabsContent>

                <TabsContent value="payroll" className="mt-6">
                    <KontrolGaji employees={filteredEmployees} employeeStats={employeeStats} />
                </TabsContent>
            </Tabs>

            {/* 🔥 DIALOG BARU: MANAJEMEN HARI LIBUR */}
            <Dialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manajemen Hari Libur</DialogTitle>
                        <DialogDescription>
                            Atur kuota hari libur untuk {selectedEmployeeForAbsence?.name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Status Info */}
                        <div className={`p-3 rounded-lg border ${
                            absenceInfo.excessDays > 0 
                                ? "bg-red-100 text-red-800 border-red-200" 
                                : absenceInfo.remainingDays > 2 
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {absenceInfo.excessDays > 0 ? (
                                    <XCircle className="h-5 w-5" />
                                ) : absenceInfo.remainingDays > 2 ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5" />
                                )}
                                <span className="font-semibold">
                                    {absenceInfo.excessDays > 0 
                                        ? `⚠️ LEBIH ${absenceInfo.excessDays} HARI!`
                                        : absenceInfo.remainingDays > 2 
                                        ? "✅ Masih dalam batas"
                                        : "⏳ Hampir mencapai batas"
                                    }
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Total Tidak Hadir:</div>
                                <div className="font-semibold">{absenceInfo.currentAbsentDays} hari</div>
                                
                                <div>Batas Maksimal:</div>
                                <div className="font-semibold">{absenceInfo.maxAbsentDays} hari/bulan</div>
                                
                                <div>Sisa Kuota:</div>
                                <div className={`font-semibold ${
                                    absenceInfo.remainingDays > 2 ? "text-green-600" : "text-red-600"
                                }`}>
                                    {absenceInfo.remainingDays} hari
                                </div>
                                
                                {absenceInfo.excessDays > 0 && (
                                    <>
                                        <div>Kelebihan:</div>
                                        <div className="font-semibold text-red-600">{absenceInfo.excessDays} hari</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Atur Jumlah Libur */}
                        <div className="space-y-2">
                            <Label htmlFor="maxDays">Atur Jumlah Hari Libur Maksimal per Bulan</Label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    id="maxDays"
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={absenceInfo.maxAbsentDays}
                                    onChange={(e) => setAbsenceInfo({
                                        ...absenceInfo,
                                        maxAbsentDays: Number(e.target.value)
                                    })}
                                    className="w-20"
                                />
                                <span>hari/bulan</span>
                                <Button 
                                    onClick={() => handleUpdateMaxDays(selectedEmployeeForAbsence!.id, absenceInfo.maxAbsentDays)}
                                    disabled={updatingAbsence}
                                    size="sm"
                                >
                                    {updatingAbsence ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Setiap karyawan boleh tidak hadir maksimal {absenceInfo.maxAbsentDays} hari dalam sebulan
                            </p>
                        </div>

                        {/* Warning Message */}
                        {absenceInfo.excessDays > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-800">
                                    <XCircle className="h-4 w-4" />
                                    <span className="font-semibold">Peringatan!</span>
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                    {selectedEmployeeForAbsence?.name} telah melebihi {absenceInfo.excessDays} hari dari batas yang diperbolehkan. 
                                    Perlu perhatian khusus!
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAbsenceDialogOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Employee Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Karyawan</DialogTitle>
                        <DialogDescription>Informasi lengkap karyawan</DialogDescription>
                    </DialogHeader>

                    {selectedEmployeeDetail && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Nama Lengkap</Label>
                                    <p className="text-sm text-muted-foreground">{selectedEmployeeDetail.name}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Email</Label>
                                    <p className="text-sm text-muted-foreground">{selectedEmployeeDetail.email || "N/A"}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Nomor Telepon</Label>
                                    <p className="text-sm text-muted-foreground">{selectedEmployeeDetail.phone || "N/A"}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Posisi</Label>
                                    <p className="text-sm text-muted-foreground">{selectedEmployeeDetail.position || "N/A"}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Badge className={getStatusColor(selectedEmployeeDetail.status)}>{getStatusText(selectedEmployeeDetail.status)}</Badge>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tanggal Bergabung</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(selectedEmployeeDetail.created_at).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Statistik Performa</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {employeeStats[selectedEmployeeDetail.id]?.totalTransactions || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total Transaksi</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatRupiah(employeeStats[selectedEmployeeDetail.id]?.totalRevenue || 0)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Total Revenue</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {employeeAttendance[selectedEmployeeDetail.id]?.attendanceRate || 0}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Tingkat Kehadiran</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">⭐ {selectedEmployeeDetail.rating || "N/A"}</div>
                                        <div className="text-xs text-muted-foreground">Rating</div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Info */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Informasi Keuangan</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Gaji Pokok</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRupiah(selectedEmployeeDetail.salary || 3000000)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Komisi</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRupiah((employeeStats[selectedEmployeeDetail.id]?.totalCommission || 0))}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Bonus</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRupiah((employeeStats[selectedEmployeeDetail.id]?.totalBonus || 0))}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Penalty</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatRupiah((employeeStats[selectedEmployeeDetail.id]?.totalPenalty || 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Details */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Detail Kehadiran</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-xl font-bold text-green-600">{employeeAttendance[selectedEmployeeDetail.id]?.presentDays || 0}</div>
                                        <div className="text-xs text-muted-foreground">Hari Hadir</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-xl font-bold text-red-600">{employeeAttendance[selectedEmployeeDetail.id]?.lateDays || 0}</div>
                                        <div className="text-xs text-muted-foreground">Hari Terlambat</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-xl font-bold text-blue-600">{employeeAttendance[selectedEmployeeDetail.id]?.overtimeHours || 0}h</div>
                                        <div className="text-xs text-muted-foreground">Jam Lembur</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Employee Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Karyawan</DialogTitle>
                        <DialogDescription>Update informasi karyawan secara lengkap</DialogDescription>
                    </DialogHeader>

                    {editEmployee && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nama Lengkap</Label>
                                <Input
                                    id="edit-name"
                                    value={editEmployee.name}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editEmployee.email || ""}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Nomor Telepon</Label>
                                <Input
                                    id="edit-phone"
                                    value={editEmployee.phone || ""}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-position">Posisi</Label>
                                <Input
                                    id="edit-position"
                                    value={editEmployee.position || ""}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-pin">PIN Keamanan Saat Ini</Label>
                                <div className="relative">
                                    <Input
                                        id="edit-pin"
                                        type={showEditEmployeePin ? "text" : "password"}
                                        maxLength={6}
                                        value={editEmployee.pin || ""}
                                        onChange={(e) => setEditEmployee({ ...editEmployee, pin: e.target.value })}
                                        placeholder="••••••"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowEditEmployeePin(!showEditEmployeePin)}
                                    >
                                        {showEditEmployeePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={editEmployee.status || "active"}
                                    onValueChange={(value) => setEditEmployee({ ...editEmployee, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                        <SelectItem value="on-leave">Cuti</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={operationLoading}>
                            Batal
                        </Button>
                        <Button onClick={handleUpdateEmployee} disabled={operationLoading}>
                            {operationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Karyawan"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Karyawan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus karyawan{" "}
                            <span className="font-semibold">{employeeToDelete?.name}</span>?
                            <br />
                            <span className="text-red-600 text-sm">
                                Tindakan ini tidak dapat dibatalkan.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setEmployeeToDelete(null);
                            }}
                            disabled={operationLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (employeeToDelete) {
                                    handleDeleteEmployee(employeeToDelete.id);
                                }
                            }}
                            disabled={operationLoading}
                        >
                            {operationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus Karyawan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export { EmployeeManagement }
export default EmployeeManagement
