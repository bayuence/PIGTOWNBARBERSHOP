"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Trash2,
  Plus,
  Star,
  Users,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Building2,
  Settings,
  TrendingUp,
  Target,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"

interface Service {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
  category: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  days: string[]
  maxEmployees: number
  currentEmployees: number
  isActive: boolean
  breakTime?: {
    start: string
    end: string
    duration: number
  }
  minStaff: number
  hasBreakTime?: boolean
  breakTimes?: Array<{
    id: string
    start: string
    end: string
    duration: number
  }>
}

interface NewShift {
  name: string
  startTime: string
  endTime: string
  days: string[]
  hasBreakTime: boolean
  breakTimes: Array<{
    id: string
    start: string
    end: string
    duration: number
  }>
  isActive?: boolean
}

interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  isActive: boolean
  shifts: string[]
  salary: number
  commission: number
}

interface BranchTarget {
  id: string
  type: "revenue" | "customers" | "services"
  target: number
  current: number
  period: "daily" | "weekly" | "monthly"
  isActive: boolean
}

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  manager: string
  employees: number
  status: "active" | "inactive" | "maintenance"
  revenue: string
  customers: number
  rating: number
  openTime: string
  closeTime: string
  services: Service[]
  shifts: Shift[]
  branchEmployees: Employee[]
  targets: BranchTarget[]
  settings: {
    autoAcceptBookings: boolean
    allowWalkIns: boolean
    requireDeposit: boolean
    depositAmount: number
    cancellationPolicy: string
    maxAdvanceBooking: number
    timezone: string
    currency: string
    taxRate: number
    serviceCommission: number
  }
  created_at?: string
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isEditShiftDialogOpen, setIsEditShiftDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const [newShift, setNewShift] = useState<NewShift>({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    days: [],
    hasBreakTime: false,
    breakTimes: [],
    isActive: true,
  })

  const [newBranch, setNewBranch] = useState<Partial<Branch>>({
    name: "",
    address: "",
    phone: "",
    manager: "",
    openTime: "09:00",
    closeTime: "21:00",
    services: [],
    shifts: [],
    branchEmployees: [],
    targets: [],
    settings: {
      autoAcceptBookings: true,
      allowWalkIns: true,
      requireDeposit: false,
      depositAmount: 50000,
      cancellationPolicy: "24 jam sebelumnya",
      maxAdvanceBooking: 30,
      timezone: "Asia/Jakarta",
      currency: "IDR",
      taxRate: 10,
      serviceCommission: 15,
    },
  })

  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    price: 0,
    duration: 30,
    isActive: true,
    category: "haircut",
  })

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    position: "barber",
    phone: "",
    email: "",
    isActive: true,
    shifts: [],
    salary: 0,
    commission: 10,
  })

  const [newTarget, setNewTarget] = useState<Partial<BranchTarget>>({
    type: "revenue",
    target: 0,
    current: 0,
    period: "monthly",
    isActive: true,
  })

  const [enrichedBranches, setEnrichedBranches] = useState<Branch[]>([])

  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching branches from database...")

      const { data: branchesData, error: branchError } = await supabase
        .from("branches")
        .select(
          "id, name, address, phone, status, manager_id, manager_name, operating_hours, shifts, settings, created_at",
        )

      if (branchError) {
        console.error("[v0] Error fetching branches:", branchError)
        setError("Gagal memuat data cabang")
        return
      }

      console.log("[v0] Raw branches data with shifts:", branchesData)
      branchesData.forEach((branch) => {
        console.log(`[v0] Branch ${branch.name}: manager_id=${branch.manager_id}, manager_name=${branch.manager_name}`)
      })

      console.log("[v0] Raw branches data with shifts:", branchesData)

      const enrichedBranchesData = await Promise.all(
        branchesData.map(async (branch) => {
          // Get employee count
          // Get employee count with error handling
          let employeeCount = 0;
          try {
            const { count, error } = await supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .eq("branch_id", branch.id);

            if (!error) {
              employeeCount = count || 0;
            } else {
              console.warn(`[v0] Error counting users for branch ${branch.name}:`, error);
            }
          } catch (error) {
            console.warn(`[v0] Exception counting users for branch ${branch.name}:`, error);
          }
          // Get revenue from transactions
          // Get revenue from transactions with error handling
          let transactions = null;
          try {
            const { data, error } = await supabase
              .from("transactions")
              .select("total_amount")
              .eq("branch_id", branch.id)
              .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

            if (!error) {
              transactions = data;
            } else {
              console.warn(`[v0] Error fetching transactions for branch ${branch.name}:`, error);
              transactions = [];
            }
          } catch (error) {
            console.warn(`[v0] Exception fetching transactions for branch ${branch.name}:`, error);
            transactions = [];
          }
          const shifts = Array.isArray(branch.shifts)
            ? branch.shifts.map((shift: any) => ({
              id: shift.id || crypto.randomUUID(),
              name: shift.name,
              startTime: shift.start_time || shift.startTime,
              endTime: shift.end_time || shift.endTime,
              days: shift.days || [],
              currentEmployees: shift.current_employees || shift.currentEmployees || 0,
              isActive:
                shift.is_active !== undefined
                  ? shift.is_active
                  : shift.isActive !== undefined
                    ? shift.isActive
                    : true,
              breakTimes: shift.break_times || shift.breakTimes || [],
              minStaff: shift.min_staff || shift.minStaff || 1,
              hasBreakTime: shift.has_break_time !== undefined ? shift.has_break_time : shift.hasBreakTime || false,
            }))
            : []

          const revenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const customerCount = transactions?.length || 0

          return {
            id: branch.id,
            name: branch.name,
            address: branch.address || "",
            phone: branch.phone || "",
            manager: branch.manager_name || branch.manager || "Belum ada manager",
            employees: employeeCount || 0,
            status: branch.status as "active" | "inactive" | "maintenance",
            revenue: `Rp ${revenue.toLocaleString("id-ID")}`,
            customers: customerCount,
            rating: 4.5, // You can add rating calculation
            openTime: branch.operating_hours?.open || "09:00",
            closeTime: branch.operating_hours?.close || "21:00",
            services: [], // You can add shifts table later
            shifts, // Use shifts data from JSONB column
            branchEmployees: [],
            targets: [],
            settings: branch.settings || {
              autoAcceptBookings: true,
              allowWalkIns: true,
              requireDeposit: false,
              depositAmount: 50000,
              cancellationPolicy: "24 jam sebelumnya",
              maxAdvanceBooking: 30,
              timezone: "Asia/Jakarta",
              currency: "IDR",
              taxRate: 10,
              serviceCommission: 15,
            },
          }
        }),
      )

      setBranches(enrichedBranchesData)
      setEnrichedBranches(enrichedBranchesData)
      console.log("[v0] Enriched branches data:", enrichedBranchesData)
    } catch (err) {
      console.error("[v0] Error in fetchBranches:", err)
      setError("Terjadi kesalahan saat memuat data")
    } finally {
      setLoading(false)
    }
  }

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || branch.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
      case "inactive":
        return <Badge variant="destructive">Tidak Aktif</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Maintenance</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleAddBranch = async () => {
    if (!newBranch.name || !newBranch.address) {
      toast.error("Nama cabang dan alamat harus diisi")
      return
    }

    try {
      console.log("[v0] Adding new branch to database...")

      const { data, error } = await supabase
        .from("branches")
        .insert([
          {
            name: newBranch.name,
            address: newBranch.address,
            phone: newBranch.phone,
            manager_name: newBranch.manager,
            status: "active",
          },
        ])
        .select()

      if (error) {
        console.error("[v0] Error adding branch:", error)
        toast.error("Gagal menambah cabang baru")
        return
      }

      console.log("[v0] Branch added successfully:", data)
      toast.success("Cabang berhasil ditambahkan")

      // Reset form and close dialog
      setNewBranch({
        name: "",
        address: "",
        phone: "",
        manager: "",
        openTime: "09:00",
        closeTime: "21:00",
        services: [],
        shifts: [],
        branchEmployees: [],
        targets: [],
        settings: {
          autoAcceptBookings: true,
          allowWalkIns: true,
          requireDeposit: false,
          depositAmount: 50000,
          cancellationPolicy: "24 jam sebelumnya",
          maxAdvanceBooking: 30,
          timezone: "Asia/Jakarta",
          currency: "IDR",
          taxRate: 10,
          serviceCommission: 15,
        },
      })
      setIsAddDialogOpen(false)

      // Refresh data
      await fetchBranches()
    } catch (err) {
      console.error("[v0] Error in handleAddBranch:", err)
      toast.error("Terjadi kesalahan saat menambah cabang")
    }
  }

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsEditDialogOpen(true)
  }

  const handleDeleteBranch = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus cabang ini? Semua data terkait (shift, transaksi, absensi) akan ikut terhapus.",
      )
    ) {
      return
    }

    try {
      console.log("[v0] Deleting branch and related data from database:", id)

      // Delete transaction items with error handling
      try {
        const { data: transactionIds, error: transactionError } = await supabase
          .from("transactions")
          .select("id")
          .eq("branch_id", id)

        if (transactionError) {
          console.warn("[v0] Error fetching transaction IDs:", transactionError)
        } else if (transactionIds && transactionIds.length > 0) {
          const { error: transactionItemsError } = await supabase
            .from("transaction_items")
            .delete()
            .in(
              "transaction_id",
              transactionIds.map((t) => t.id),
            )

          if (transactionItemsError) {
            console.warn("[v0] Error deleting transaction items:", transactionItemsError)
          }
        }
      } catch (error) {
        console.warn("[v0] Exception in transaction cleanup:", error)
      }

      // Delete transactions
      const { error: transactionsError } = await supabase.from("transactions").delete().eq("branch_id", id)

      if (transactionsError) {
        console.error("[v0] Error deleting transactions:", transactionsError)
        toast.error("Gagal menghapus data transaksi cabang")
        return
      }

      // Delete attendance records
      // Delete attendance records with error handling
      try {
        const { error: attendanceError } = await supabase.from("attendance").delete().eq("branch_id", id)
        if (attendanceError) {
          console.warn("[v0] Error deleting attendance:", attendanceError)
          // Jangan return, biarkan lanjut ke operasi berikutnya
        }
      } catch (error) {
        console.warn("[v0] Exception deleting attendance:", error)
      }

      // Delete expenses with error handling  
      try {
        const { error: expensesError } = await supabase.from("expenses").delete().eq("branch_id", id)
        if (expensesError) {
          console.warn("[v0] Error deleting expenses:", expensesError)
          // Jangan return, biarkan lanjut ke operasi berikutnya
        }
      } catch (error) {
        console.warn("[v0] Exception deleting expenses:", error)
      }

      // Finally delete the branch (this will also delete the shifts stored in the JSON column)
      const { error } = await supabase.from("branches").delete().eq("id", id)

      if (error) {
        console.error("[v0] Error deleting branch:", error)
        toast.error("Gagal menghapus cabang")
        return
      }

      console.log("[v0] Branch and all related data deleted successfully")
      toast.success("Cabang dan semua data terkait berhasil dihapus")

      // Refresh data
      await fetchBranches()
    } catch (err) {
      console.error("[v0] Error in handleDeleteBranch:", err)
      toast.error("Terjadi kesalahan saat menghapus cabang")
    }
  }

  const handleAddShift = async (branchId: string) => {
    if (!newShift.name || !newShift.days?.length) {
      toast.error("Nama shift dan hari kerja harus diisi")
      return
    }

    try {
      const currentBranch = branches.find((b) => b.id === branchId)
      const currentShifts = currentBranch?.shifts || []

      const newShiftData: Shift = {
        id: crypto.randomUUID(),
        name: newShift.name,
        startTime: newShift.startTime || "09:00",
        endTime: newShift.endTime || "17:00",
        days: newShift.days || [],
        currentEmployees: 0,
        isActive: true,
        breakTimes: newShift.breakTimes || [],
        minStaff: 1,
      }

      const updatedShifts = [...currentShifts, newShiftData]

      // Update shifts column in branches table
      const { error } = await supabase
        .from("branches")
        .update({
          shifts: updatedShifts.map((shift) => ({
            id: shift.id,
            name: shift.name,
            start_time: shift.startTime,
            end_time: shift.endTime,
            days: shift.days,
            current_employees: shift.currentEmployees,
            is_active: shift.isActive,
            break_times: shift.breakTimes,
            min_staff: shift.minStaff,
          })),
        })
        .eq("id", branchId)

      if (error) {
        console.error("[v0] Error adding shift:", error)
        toast.error("Gagal menambahkan shift: " + error.message)
        return
      }

      console.log("[v0] Shift added successfully:", newShiftData)

      // Update local state
      setBranches(branches.map((branch) => (branch.id === branchId ? { ...branch, shifts: updatedShifts } : branch)))

      // Reset form
      setNewShift({
        name: "",
        startTime: "09:00",
        endTime: "17:00",
        days: [],
        hasBreakTime: false,
        breakTimes: [],
        isActive: true,
      })
      setIsShiftDialogOpen(false)
      toast.success("Shift berhasil ditambahkan")
    } catch (error) {
      console.error("[v0] Error adding shift:", error)
      toast.error("Gagal menambahkan shift")
    }
  }

  const addBreakTime = () => {
    const newBreakTime = {
      id: Date.now().toString(),
      start: "12:00",
      end: "13:00",
      duration: 60,
    }
    setNewShift({
      ...newShift,
      breakTimes: [...newShift.breakTimes, newBreakTime],
    })
  }

  const removeBreakTime = (id: string) => {
    setNewShift({
      ...newShift,
      breakTimes: newShift.breakTimes.filter((bt) => bt.id !== id),
    })
  }

  const updateBreakTime = (id: string, field: string, value: string | number) => {
    setNewShift({
      ...newShift,
      breakTimes: newShift.breakTimes.map((bt) => (bt.id === id ? { ...bt, [field]: value } : bt)),
    })
  }

  const handleAddService = (branchId: string) => {
    if (!newService.name || !newService.price) {
      toast.error("Nama layanan dan harga harus diisi")
      return
    }

    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      price: newService.price || 0,
      duration: newService.duration || 30,
      isActive: true,
      category: newService.category || "haircut",
    }

    setBranches(
      branches.map((branch) =>
        branch.id === branchId ? { ...branch, services: [...(branch.services || []), service] } : branch,
      ),
    )

    setNewService({
      name: "",
      price: 0,
      duration: 30,
      isActive: true,
      category: "haircut",
    })
    setIsServiceDialogOpen(false)
    toast.success("Layanan berhasil ditambahkan")
  }

  const handleAddEmployee = (branchId: string) => {
    if (!newEmployee.name || !newEmployee.phone) {
      toast.error("Nama dan nomor telepon karyawan harus diisi")
      return
    }

    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      position: newEmployee.position || "barber",
      phone: newEmployee.phone,
      email: newEmployee.email || "",
      isActive: true,
      shifts: [],
      salary: newEmployee.salary || 0,
      commission: newEmployee.commission || 10,
    }

    setBranches(
      branches.map((branch) =>
        branch.id === branchId ? { ...branch, branchEmployees: [...(branch.branchEmployees || []), employee] } : branch,
      ),
    )

    setNewEmployee({
      name: "",
      position: "barber",
      phone: "",
      email: "",
      isActive: true,
      shifts: [],
      salary: 0,
      commission: 10,
    })
    setIsEmployeeDialogOpen(false)
    toast.success("Karyawan berhasil ditambahkan")
  }

  const handleAddTarget = (branchId: string) => {
    if (!newTarget.target) {
      toast.error("Target harus diisi")
      return
    }

    const target: BranchTarget = {
      id: Date.now().toString(),
      type: newTarget.type || "revenue",
      target: newTarget.target || 0,
      current: 0,
      period: newTarget.period || "monthly",
      isActive: true,
    }

    setBranches(
      branches.map((branch) =>
        branch.id === branchId ? { ...branch, targets: [...(branch.targets || []), target] } : branch,
      ),
    )

    setNewTarget({
      type: "revenue",
      target: 0,
      current: 0,
      period: "monthly",
      isActive: true,
    })
    setIsTargetDialogOpen(false)
    toast.success("Target berhasil ditambahkan")
  }

  const handleUpdateBranchSettings = async (branchId: string, settings: any) => {
    setBranches(
      branches.map((branch) =>
        branch.id === branchId ? { ...branch, settings: { ...branch.settings, ...settings } } : branch,
      ),
    )
    toast.success("Pengaturan cabang berhasil diperbarui")
  }

  const handleEditShift = (branchId: string, shift: Shift) => {
    setEditingShift(shift)
    setNewShift({
      name: shift.name || "",
      startTime: shift.startTime || "09:00",
      endTime: shift.endTime || "17:00",
      days: shift.days || [],
      breakTimes: shift.breakTimes || [],
      hasBreakTime: shift.hasBreakTime || false,
      isActive: true,
    })
    setIsEditShiftDialogOpen(true)
  }

  const handleSaveEditShift = async (branchId: string) => {
    if (!editingShift || !newShift.name || !newShift.days?.length) {
      toast.error("Nama shift dan hari kerja harus diisi")
      return
    }

    try {
      console.log("[v0] Updating shift in database...")

      const updatedShift = {
        id: editingShift.id,
        name: newShift.name,
        startTime: newShift.startTime || "09:00",
        endTime: newShift.endTime || "17:00",
        days: newShift.days || [],
        breakTimes: newShift.breakTimes || [],
        hasBreakTime: newShift.hasBreakTime || false,
        isActive: true,
      }

      // Update shifts array in branches table
      const currentBranch = branches.find((b) => b.id === branchId)
      if (!currentBranch) {
        toast.error("Cabang tidak ditemukan")
        return
      }

      const updatedShifts = currentBranch.shifts.map((shift) => (shift.id === editingShift.id ? updatedShift : shift))

      const { error } = await supabase.from("branches").update({ shifts: updatedShifts }).eq("id", branchId)

      if (error) {
        console.error("[v0] Error updating shift:", error)
        toast.error("Gagal mengupdate shift")
        return
      }

      console.log("[v0] Shift updated successfully")

      // Update local state
      setBranches(branches.map((branch) => (branch.id === branchId ? { ...branch, shifts: updatedShifts } : branch)))

      setEditingShift(null)
      setNewShift({
        name: "",
        startTime: "09:00",
        endTime: "17:00",
        days: [],
        breakTimes: [],
        hasBreakTime: false,
        isActive: true,
      })
      setIsEditShiftDialogOpen(false)
      toast.success("Shift berhasil diperbarui")
    } catch (err) {
      console.error("[v0] Error in handleSaveEditShift:", err)
      toast.error("Terjadi kesalahan saat mengupdate shift")
    }
  }

  const handleDeleteShift = async (branchId: string, shiftId: string, shiftName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus shift "${shiftName}"?`)) {
      try {
        console.log("[v0] Deleting shift from database...")

        const currentBranch = branches.find((b) => b.id === branchId)
        if (!currentBranch) {
          toast.error("Cabang tidak ditemukan")
          return
        }

        const updatedShifts = currentBranch.shifts.filter((shift) => shift.id !== shiftId)

        const { error } = await supabase.from("branches").update({ shifts: updatedShifts }).eq("id", branchId)

        if (error) {
          console.error("[v0] Error deleting shift:", error)
          toast.error("Gagal menghapus shift")
          return
        }

        console.log("[v0] Shift deleted successfully")

        // Update local state
        setBranches(branches.map((branch) => (branch.id === branchId ? { ...branch, shifts: updatedShifts } : branch)))
        toast.success("Shift berhasil dihapus")
      } catch (err) {
        console.error("[v0] Error in handleDeleteShift:", err)
        toast.error("Terjadi kesalahan saat menghapus shift")
      }
    }
  }

  const handleCopyShift = (sourceShift: Shift, targetBranchId: string) => {
    const newShift: Shift = {
      ...sourceShift,
      id: Date.now().toString(),
      currentEmployees: 0,
    }

    setBranches(
      branches.map((branch) =>
        branch.id === targetBranchId ? { ...branch, shifts: [...(branch.shifts || []), newShift] } : branch,
      ),
    )
    toast.success("Shift berhasil disalin ke cabang lain")
  }

  const handleViewBranch = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateBranch = async () => {
    if (!selectedBranch || !selectedBranch.name || !selectedBranch.address) {
      toast.error("Nama cabang dan alamat harus diisi")
      return
    }

    if (isUpdating) {
      return
    }

    try {
      setIsUpdating(true)
      console.log("[v0] Updating branch in database...")
      const updateData = {
        name: selectedBranch.name,
        address: selectedBranch.address,
        phone: selectedBranch.phone,
        status: selectedBranch.status,
        manager_name: selectedBranch.manager_name || null,
        operating_hours: {
          open: selectedBranch.openTime || "09:00",
          close: selectedBranch.closeTime || "21:00",
        },
      }
      console.log("[v0] Update data being sent:", updateData)

      const { error } = await supabase.from("branches").update(updateData).eq("id", selectedBranch.id)

      if (error) {
        console.error("[v0] Error updating branch:", error)
        toast.error("Gagal mengupdate cabang")
        return
      }

      console.log("[v0] Branch updated successfully")

      setBranches(
        branches.map((branch) =>
          branch.id === selectedBranch.id
            ? {
              ...branch,
              ...updateData,
              openTime: selectedBranch.openTime,
              closeTime: selectedBranch.closeTime,
            }
            : branch,
        ),
      )

      await fetchBranches()

      toast.success("Cabang berhasil diupdate")
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("[v0] Error in handleUpdateBranch:", err)
      toast.error("Terjadi kesalahan saat mengupdate cabang")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleStatus = async (branchId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    try {
      const { error } = await supabase.from("branches").update({ status: newStatus }).eq("id", branchId)

      if (error) {
        console.error("[v0] Error updating branch status:", error)
        toast.error("Gagal mengubah status cabang")
        return
      }

      toast.success(`Status cabang berhasil diubah menjadi ${newStatus === "active" ? "aktif" : "tidak aktif"}`)
      await fetchBranches()
    } catch (err) {
      console.error("[v0] Error in handleToggleStatus:", err)
      toast.error("Terjadi kesalahan saat mengubah status")
    }
  }

  const dayOptions = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
  const roleOptions = ["barber", "assistant", "receptionist", "manager", "trainee"]
  const serviceCategories = ["haircut", "beard", "styling", "treatment", "package"]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data cabang...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchBranches}>Coba Lagi</Button>
          </div>
        </div>
      </div>
    )
  }

  // Enrich each branch with calculated data
  const enrichedBranchesCalculator = async () => {
    const { data: branchesData, error: branchError } = await supabase.from("branches").select("*")

    if (branchError) {
      console.error("[v0] Error fetching branches:", branchError)
      setError("Gagal memuat data cabang")
      return []
    }

    const enrichedBranches: Branch[] = await Promise.all(
      branchesData.map(async (branch: any) => {
        // Get employee count for this branch
        const { count: employeeCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branch.id)

        // Calculate revenue (you can modify this logic based on your needs)
        const { data: transactions } = await supabase
          .from("transactions")
          .select("total_amount")
          .eq("branch_id", branch.id)

        const revenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

        // Get customer count (unique customers who made transactions)
        const { data: customers } = await supabase
          .from("transactions")
          .select("customer_id")
          .eq("branch_id", branch.id)
          .not("customer_id", "is", null)

        const uniqueCustomers = new Set(customers?.map((c) => c.customer_id) || [])
        const customerCount = uniqueCustomers.size

        return {
          id: branch.id,
          name: branch.name,
          address: branch.address || "",
          phone: branch.phone || "",
          manager: branch.manager_name || "Belum ada manager",
          employees: employeeCount || 0,
          status: branch.status as "active" | "inactive" | "maintenance",
          revenue: `Rp ${revenue.toLocaleString("id-ID")}`,
          customers: customerCount,
          rating: 4.5, // You can add rating calculation
          openTime: branch.operating_hours?.open || "09:00",
          closeTime: branch.operating_hours?.close || "21:00",
          services: [], // You can add shifts table later
          shifts: [], // Use shifts data from JSONB column
          branchEmployees: [],
          targets: [],
          settings: branch.settings || {
            autoAcceptBookings: true,
            allowWalkIns: true,
            requireDeposit: false,
            depositAmount: 50000,
            cancellationPolicy: "24 jam sebelumnya",
            maxAdvanceBooking: 30,
            timezone: "Asia/Jakarta",
            currency: "IDR",
            taxRate: 10,
            serviceCommission: 15,
          },
        }
      }),
    )
    return enrichedBranches
  }

  const calculateBreakDuration = (breakTimes: any[]) => {
    if (!breakTimes || breakTimes.length === 0) return 0

    return breakTimes.reduce((total, breakTime) => {
      const start = new Date(`2000-01-01T${breakTime.start}:00`)
      const end = new Date(`2000-01-01T${breakTime.end}:00`)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
      return total + duration
    }, 0)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Manajemen Cabang</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Kelola semua cabang barbershop Anda</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Tambah Cabang</span>
              <span className="xs:hidden">Tambah</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Tambah Cabang Baru</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">Isi informasi cabang baru yang akan ditambahkan</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Cabang</Label>
                <Input
                  id="name"
                  value={newBranch.name || ""}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="Contoh: Cabang Menteng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  value={newBranch.manager || ""}
                  onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                  placeholder="Nama manager cabang"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={newBranch.address || ""}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  placeholder="Alamat lengkap cabang"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={newBranch.phone || ""}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  placeholder="+62 21 xxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Operasional</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newBranch.openTime || "09:00"}
                    onChange={(e) => setNewBranch({ ...newBranch, openTime: e.target.value })}
                  />
                  <span className="flex items-center">-</span>
                  <Input
                    type="time"
                    value={newBranch.closeTime || "21:00"}
                    onChange={(e) => setNewBranch({ ...newBranch, closeTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddBranch}>Tambah Cabang</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
        <div className="flex-1">
          <Input
            placeholder="Cari cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 md:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards - RESPONSIVE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Total Cabang</CardTitle>
            <Building2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold">{branches.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {branches.filter((b) => b.status === "active").length} aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">Total Karyawan</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold">{branches.reduce((sum, b) => sum + b.employees, 0)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Di semua cabang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">Total Pendapatan</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-sm md:text-2xl font-bold truncate">
              Rp{" "}
              {branches
                .reduce((sum, b) => {
                  const revenue = Number.parseInt(b.revenue.replace(/\D/g, "")) || 0
                  return sum + revenue
                }, 0)
                .toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">Bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">Rata-rata Rating</CardTitle>
            <Star className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg md:text-2xl font-bold">
              {branches.length > 0
                ? (branches.reduce((sum, b) => sum + b.rating, 0) / branches.length).toFixed(1)
                : "0"}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">Dari semua cabang</p>
          </CardContent>
        </Card>
      </div>

      {/* Branches Grid - RESPONSIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {filteredBranches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Tidak ada cabang yang sesuai dengan filter"
                : "Belum ada cabang yang terdaftar"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Cabang Pertama
              </Button>
            )}
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(branch.status)}`} />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate leading-tight">{branch.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 text-xs truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{branch.address.split(",")[0]}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(branch.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                {/* Info Grid - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs mb-0.5">Manager</p>
                    <p className="font-semibold truncate text-sm">{branch.manager}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs mb-0.5">Karyawan</p>
                    <p className="font-semibold text-sm">{branch.employees} orang</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs mb-0.5">Pendapatan</p>
                    <p className="font-semibold text-green-600 truncate text-sm">{branch.revenue}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs mb-0.5">Pelanggan</p>
                    <p className="font-semibold text-sm">{branch.customers}</p>
                  </div>
                </div>

                {/* Operating Hours & Rating */}
                <div className="flex items-center justify-between text-xs border-t pt-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium">
                      {branch.openTime} - {branch.closeTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-current flex-shrink-0" />
                    <span className="font-semibold">{branch.rating}</span>
                  </div>
                </div>

                {/* Action Buttons - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-9 bg-transparent hover:bg-primary/10"
                    onClick={() => handleEditBranch(branch)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Edit Cabang</span>
                    <span className="xs:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 gap-1.5 text-xs h-9 ${branch.status === "active"
                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      } bg-transparent`}
                    onClick={() => handleToggleStatus(branch.id, branch.status)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">{branch.status === "active" ? "Nonaktifkan" : "Aktifkan"}</span>
                    <span className="xs:hidden">{branch.status === "active" ? "Off" : "On"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="sm:flex-none gap-1.5 text-xs h-9 text-red-600 hover:text-red-700 bg-transparent hover:bg-red-50"
                    onClick={() => handleDeleteBranch(branch.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Hapus</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Performance Overview */}
      {branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performa Cabang
            </CardTitle>
            <CardDescription>Ranking performa cabang berdasarkan pendapatan bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branches
                .sort(
                  (a, b) =>
                    Number.parseInt(b.revenue.replace(/\D/g, "")) - Number.parseInt(a.revenue.replace(/\D/g, "")),
                )
                .map((branch, index) => (
                  <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">{branch.manager}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{branch.revenue}</p>
                      <p className="text-sm text-muted-foreground">{branch.customers} pelanggan</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Detail Dialog with Comprehensive Management */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="h-4 w-4 md:h-5 md:w-5" />
              <span className="truncate">Manajemen: {selectedBranch?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">Kontrol penuh untuk semua aspek operasional cabang</DialogDescription>
          </DialogHeader>

          {selectedBranch && (
            <Tabs defaultValue="overview" className="w-full">
              {/* Mobile: Scrollable Tabs */}
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <TabsList className="inline-flex md:grid w-max md:w-full md:grid-cols-7 gap-1 bg-muted/50 p-1">
                  <TabsTrigger value="overview" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Ringkasan</TabsTrigger>
                  <TabsTrigger value="shifts" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Shift</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Layanan</TabsTrigger>
                  <TabsTrigger value="employees" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Karyawan</TabsTrigger>
                  <TabsTrigger value="targets" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Target</TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Pengaturan</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs md:text-sm whitespace-nowrap px-3 md:px-4">Analitik</TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base md:text-lg">Informasi Dasar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-xs md:text-sm line-clamp-2">{selectedBranch.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs md:text-sm">{selectedBranch.phone || "Tidak ada"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs md:text-sm">
                          {selectedBranch.openTime} - {selectedBranch.closeTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Manager: {selectedBranch.manager}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistik</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedBranch.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Karyawan:</span>
                        <span className="text-sm font-medium">{selectedBranch.employees} orang</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pendapatan:</span>
                        <span className="text-sm font-medium text-green-600">{selectedBranch.revenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pelanggan:</span>
                        <span className="text-sm font-medium">{selectedBranch.customers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{selectedBranch.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Layanan Tersedia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(selectedBranch.services || []).map((service, index) => (
                        <Badge key={index} variant="secondary">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shifts Management Tab */}
              <TabsContent value="shifts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Manajemen Shift</h3>
                  <Button onClick={() => setIsShiftDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Shift
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(selectedBranch.shifts || []).map((shift) => (
                    <Card key={shift.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{shift.name}</h4>
                            <Badge variant="default" className="bg-green-500">
                              Aktif
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span>
                                ⏰ {shift.startTime} - {shift.endTime}
                              </span>
                              <span>
                                👥 {shift.currentEmployees}/{shift.maxEmployees} karyawan
                              </span>
                              <span>📅 {shift.days.join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>
                                ☕ Istirahat: {shift.breakTime?.start} - {shift.breakTime?.end}
                              </span>
                              <span>👤 Min Staff: {shift.minStaff}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShift(selectedBranch?.id || "", shift)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 bg-transparent"
                            onClick={() => handleDeleteShift(selectedBranch?.id || "", shift.id, shift.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Services Management Tab */}
              <TabsContent value="services" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Manajemen Layanan & Harga</h3>
                  <Button onClick={() => setIsServiceDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Layanan
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(selectedBranch.services || []).map((service) => (
                    <Card key={service.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{service.name}</h4>
                            <Badge variant="outline">{service.category}</Badge>
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>💰 Rp {service.price.toLocaleString("id-ID")}</span>
                            <span className="ml-4">⏱️ {service.duration} menit</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Employees Management Tab */}
              <TabsContent value="employees" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-semibold">Manajemen Karyawan</h3>
                  <Button onClick={() => setIsEmployeeDialogOpen(true)} className="gap-2 w-full sm:w-auto text-sm h-9">
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Tambah Karyawan
                  </Button>
                </div>

                <div className="grid gap-3 md:gap-4">
                  {(selectedBranch.branchEmployees || []).map((employee) => (
                    <Card key={employee.id} className="p-3 md:p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                              <h4 className="font-medium text-sm md:text-base truncate">{employee.name}</h4>
                              <Badge variant="outline" className="text-[10px] md:text-xs">{employee.position || "Karyawan"}</Badge>
                              <Badge variant={employee.isActive ? "default" : "secondary"} className="text-[10px] md:text-xs">
                                {employee.isActive ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                              <div className="truncate">
                                📞 {employee.phone} {employee.email && `| 📧 ${employee.email}`}
                              </div>
                              <div className="truncate">
                                💰 Gaji: Rp {employee.salary.toLocaleString("id-ID")} | Komisi: {employee.commission}%
                              </div>
                              <div className="truncate">📅 Shift: {employee.shifts.join(", ") || "Belum ditentukan"}</div>
                            </div>
                          </div>
                          <div className="flex sm:flex-row flex-col items-center gap-1.5 flex-shrink-0">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 bg-transparent">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Targets Management Tab */}
              <TabsContent value="targets" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-base md:text-lg font-semibold">Target & KPI</h3>
                  <Button onClick={() => setIsTargetDialogOpen(true)} className="gap-2 w-full sm:w-auto text-sm h-9">
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Tambah Target
                  </Button>
                </div>

                <div className="grid gap-3 md:gap-4">
                  {(selectedBranch.targets || []).map((target) => (
                    <Card key={target.id} className="p-3 md:p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                              <h4 className="font-medium text-xs md:text-sm line-clamp-2">
                                Target{" "}
                                {target.type === "revenue"
                                  ? "Pendapatan"
                                  : target.type === "customers"
                                    ? "Pelanggan"
                                    : "Layanan"}
                                {" ("}
                                {target.period === "daily"
                                  ? "Harian"
                                  : target.period === "weekly"
                                    ? "Mingguan"
                                    : "Bulanan"}
                                )
                              </h4>
                              <Badge variant={target.isActive ? "default" : "secondary"} className="text-[10px] md:text-xs">
                                {target.isActive ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs md:text-sm">
                                <span>Progress:</span>
                                <span className="font-medium">{((target.current / target.target) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${Math.min((target.current / target.target) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {target.current.toLocaleString("id-ID")} / {target.target.toLocaleString("id-ID")}
                              </div>
                            </div>
                          </div>
                          <div className="flex sm:flex-row flex-col items-center gap-1.5 flex-shrink-0">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 bg-transparent">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <h3 className="text-lg font-semibold">Pengaturan Operasional</h3>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-4">Pengaturan Booking</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Auto Accept Booking</Label>
                        <Switch
                          checked={selectedBranch.settings?.autoAcceptBookings}
                          onCheckedChange={(checked) =>
                            handleUpdateBranchSettings(selectedBranch.id, { autoAcceptBookings: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Terima Walk-in</Label>
                        <Switch
                          checked={selectedBranch.settings?.allowWalkIns}
                          onCheckedChange={(checked) =>
                            handleUpdateBranchSettings(selectedBranch.id, { allowWalkIns: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Wajib Deposit</Label>
                        <Switch
                          checked={selectedBranch.settings?.requireDeposit}
                          onCheckedChange={(checked) =>
                            handleUpdateBranchSettings(selectedBranch.id, { requireDeposit: checked })
                          }
                        />
                      </div>
                      {selectedBranch.settings?.requireDeposit && (
                        <div className="space-y-2">
                          <Label>Jumlah Deposit</Label>
                          <Input
                            type="number"
                            value={selectedBranch.settings?.depositAmount}
                            onChange={(e) =>
                              handleUpdateBranchSettings(selectedBranch.id, { depositAmount: Number(e.target.value) })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-4">Pengaturan Finansial</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pajak (%)</Label>
                        <Input
                          type="number"
                          value={selectedBranch.settings?.taxRate}
                          onChange={(e) =>
                            handleUpdateBranchSettings(selectedBranch.id, { taxRate: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Komisi Layanan (%)</Label>
                        <Input
                          type="number"
                          value={selectedBranch.settings?.serviceCommission}
                          onChange={(e) =>
                            handleUpdateBranchSettings(selectedBranch.id, { serviceCommission: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mata Uang</Label>
                        <Select
                          value={selectedBranch.settings?.currency}
                          onValueChange={(value) => handleUpdateBranchSettings(selectedBranch.id, { currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                            <SelectItem value="USD">USD (Dollar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-4">Kebijakan Cabang</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kebijakan Pembatalan</Label>
                      <Textarea
                        value={selectedBranch.settings?.cancellationPolicy}
                        onChange={(e) =>
                          handleUpdateBranchSettings(selectedBranch.id, { cancellationPolicy: e.target.value })
                        }
                        placeholder="Contoh: Pembatalan harus dilakukan 24 jam sebelumnya"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Booking di Muka (hari)</Label>
                      <Input
                        type="number"
                        value={selectedBranch.settings?.maxAdvanceBooking}
                        onChange={(e) =>
                          handleUpdateBranchSettings(selectedBranch.id, { maxAdvanceBooking: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <h3 className="text-lg font-semibold">Analitik & Laporan</h3>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">Performa Hari Ini</h4>
                    <p className="text-2xl font-bold text-green-600">+15%</p>
                    <p className="text-sm text-muted-foreground">vs kemarin</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">Tingkat Okupansi</h4>
                    <p className="text-2xl font-bold text-blue-600">85%</p>
                    <p className="text-sm text-muted-foreground">rata-rata</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <h4 className="font-medium">Rating Bulan Ini</h4>
                    <p className="text-2xl font-bold text-yellow-600">{selectedBranch.rating}</p>
                    <p className="text-sm text-muted-foreground">dari 5.0</p>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-4">Grafik Pendapatan 7 Hari Terakhir</h4>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <p>Grafik akan ditampilkan di sini</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Shift Dialog */}
      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Shift Baru</DialogTitle>
            <DialogDescription>Buat shift kerja baru untuk cabang {selectedBranch?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Shift</Label>
                <Input
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  placeholder="Contoh: Pagi, Siang, Malam"
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Kerja</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  />
                  <span className="flex items-center">-</span>
                  <Input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={newShift.days.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const updatedDays = newShift.days.includes(day)
                        ? newShift.days.filter((d) => d !== day)
                        : [...newShift.days, day]
                      setNewShift({ ...newShift, days: updatedDays })
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Waktu Istirahat</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBreakTime}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Istirahat
                </Button>
              </div>
              {newShift.breakTimes.map((breakTime) => (
                <div key={breakTime.id} className="flex items-center gap-2 p-3 border rounded">
                  <Input
                    type="time"
                    value={breakTime.start}
                    onChange={(e) => updateBreakTime(breakTime.id, "start", e.target.value)}
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={breakTime.end}
                    onChange={(e) => updateBreakTime(breakTime.id, "end", e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeBreakTime(breakTime.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => selectedBranch && handleAddShift(selectedBranch.id)}>Tambah Shift</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={isEditShiftDialogOpen} onOpenChange={setIsEditShiftDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>Edit shift kerja untuk cabang {selectedBranch?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Shift</Label>
                <Input
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  placeholder="Contoh: Pagi, Siang, Malam"
                />
              </div>
              <div className="space-y-2">
                <Label>Jam Kerja</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  />
                  <span className="flex items-center">-</span>
                  <Input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hari Kerja</Label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={newShift.days.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const updatedDays = newShift.days.includes(day)
                        ? newShift.days.filter((d) => d !== day)
                        : [...newShift.days, day]
                      setNewShift({ ...newShift, days: updatedDays })
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Waktu Istirahat</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBreakTime}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Istirahat
                </Button>
              </div>
              {newShift.breakTimes.map((breakTime) => (
                <div key={breakTime.id} className="flex items-center gap-2 p-3 border rounded">
                  <Input
                    type="time"
                    value={breakTime.start}
                    onChange={(e) => updateBreakTime(breakTime.id, "start", e.target.value)}
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={breakTime.end}
                    onChange={(e) => updateBreakTime(breakTime.id, "end", e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => removeBreakTime(breakTime.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditShiftDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => selectedBranch && handleSaveEditShift(selectedBranch.id)}>Simpan Perubahan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {/* PERBAIKAN: Mengganti <CardTitle> menjadi <DialogTitle> untuk aksesibilitas */}
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Cabang - {selectedBranch?.name}
            </DialogTitle>
            <DialogDescription>Kelola informasi dasar dan shift kerja cabang</DialogDescription>
          </DialogHeader>

          {selectedBranch && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                <TabsTrigger value="shifts">Shift Kerja</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Cabang</Label>
                    <Input
                      value={selectedBranch.name}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager</Label>
                    <Input
                      value={selectedBranch.manager_name || ""}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, manager_name: e.target.value })}
                      placeholder="Nama manager cabang"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor Telepon</Label>
                    <Input
                      value={selectedBranch.phone}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Alamat</Label>
                    <Textarea
                      value={selectedBranch.address}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedBranch.status}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, status: e.target.value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Buka</Label>
                    <Input
                      type="time"
                      value={selectedBranch.openTime}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, openTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jam Tutup</Label>
                    <Input
                      type="time"
                      value={selectedBranch.closeTime}
                      onChange={(e) => setSelectedBranch({ ...selectedBranch, closeTime: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shifts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Manajemen Shift Kerja</h3>
                  <Button onClick={() => setIsShiftDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Shift
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(selectedBranch.shifts || []).map((shift) => (
                    <Card key={shift.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{shift.name}</h4>
                            <span className="text-sm text-muted-foreground">
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>📅 Hari: {shift.days.join(", ")}</span>
                            <span>
                              ☕ Istirahat:{" "}
                              {shift.breakTimes && shift.breakTimes.length > 0
                                ? `${calculateBreakDuration(shift.breakTimes)} menit`
                                : "- (menit)"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditShift(selectedBranch.id, shift)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 bg-transparent"
                            onClick={() => handleDeleteShift(selectedBranch.id, shift.id, shift.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateBranch} disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan Semua Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
