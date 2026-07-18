"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  RefreshCw,
  Search,
  Calendar,
  MapPin,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  PieChart,
  ShoppingBag,
  Award,
  Wallet,
  X,
  Banknote,
  Send,
  ImageIcon,
  CheckCircle2
} from "lucide-react"
import { supabase, getBranches } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'

// Helper function to format currency
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Date Range presets helper
const getDateRangeLimits = (preset: string, customStart?: string, customEnd?: string) => {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (preset) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
      break
    case "thisWeek":
      // Start of the week (Sunday)
      const dayOfWeek = now.getDay()
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      break
    case "lastWeek":
      const lastWeekDay = now.getDay()
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay - 7)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay - 1, 23, 59, 59)
      break
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case "custom":
      if (customStart && customEnd) {
        start = new Date(customStart)
        end = new Date(new Date(customEnd).setHours(23, 59, 59))
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString()
  }
}

export function DailyInsight() {
  const router = useRouter()

  // User session state
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Date filter states
  const [datePreset, setDatePreset] = useState("today")
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split("T")[0])
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split("T")[0])

  // Branch filter states
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("all")

  // Loaded states
  const [transactions, setTransactions] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [kasbonList, setKasbonList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [transactionItems, setTransactionItems] = useState<any[]>([])
  const [totalCommissions, setTotalCommissions] = useState(0)
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string | null>(null)
  const [isBarberFilterDialogOpen, setIsBarberFilterDialogOpen] = useState(false)
  const [dialogSearchTerm, setDialogSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Setor Kas states
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false)
  const [setorDisplayValue, setSetorDisplayValue] = useState("") // formatted rupiah string untuk input
  const [setorRawValue, setSetorRawValue] = useState(0) // angka asli untuk submit
  const [setorBranchId, setSetorBranchId] = useState("") // cabang yang menyetor
  const [setorEmployeeId, setSetorEmployeeId] = useState("") // karyawan yang menyetor
  const [setorNote, setSetorNote] = useState("")
  const [setorProofFile, setSetorProofFile] = useState<File | null>(null)
  const [setorProofPreview, setSetorProofPreview] = useState<string | null>(null)
  const [isSubmittingSetor, setIsSubmittingSetor] = useState(false)
  const [setorLoadingMessage, setSetorLoadingMessage] = useState("")
  const [depositList, setDepositList] = useState<any[]>([])
  const [todayDepositList, setTodayDepositList] = useState<any[]>([])
  // Validation errors
  const [setorErrors, setSetorErrors] = useState<{ amount?: string; proof?: string; branch?: string; employee?: string }>({})
  const [setorTouched, setSetorTouched] = useState<{ amount?: boolean; proof?: boolean; branch?: boolean; employee?: boolean }>({})

  // Load user data & branches
  useEffect(() => {
    const initData = async () => {
      const userStr = localStorage.getItem("user")
      if (!userStr) {
        router.push("/login")
        return
      }
      const parsedUser = JSON.parse(userStr)
      setCurrentUser(parsedUser)

      // Set default branch for employees
      if (parsedUser.branch_id && parsedUser.role !== "owner" && parsedUser.position !== "manager") {
        setSelectedBranch(parsedUser.branch_id)
      }

      // Fetch branches list
      try {
        const { data, error } = await getBranches()
        if (!error && data) {
          setBranches(data)
        }
      } catch (err) {
        console.error("Error fetching branches:", err)
      }

      // Fetch all users list for mapping name
      try {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, branch_id")
        if (usersData) {
          setUsersList(usersData)
        }
      } catch (err) {
        console.error("Error fetching users:", err)
      }

      setLoading(false)
    }

    initData()
  }, [router])

  // Fetch today's deposits for the setor modal
  const fetchTodayDeposits = async (branchId: string) => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      let q = supabase
        .from("cash_deposits")
        .select("*")
        .gte("deposit_date", todayStart.toISOString())
        .order("deposit_date", { ascending: false })
      if (branchId !== "all") q = q.eq("branch_id", branchId)
      const { data } = await q
      setTodayDepositList(data || [])
    } catch (err) {
      console.error("Error fetching today's deposits:", err)
    }
  }

  // Handler input rupiah — format langsung saat mengetik
  const handleSetorAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ambil hanya digit
    const digits = e.target.value.replace(/\D/g, "")
    const raw = parseInt(digits || "0", 10)
    setSetorRawValue(raw)
    // Format dengan titik ribuan (tanpa Rp prefix, sudah ada di luar)
    setSetorDisplayValue(raw > 0 ? raw.toLocaleString("id-ID") : "")
    // Validate realtime
    if (setorTouched.amount) {
      if (raw <= 0) {
        setSetorErrors(prev => ({ ...prev, amount: "Jumlah setoran harus lebih dari Rp 0" }))
      } else if (raw < 1000) {
        setSetorErrors(prev => ({ ...prev, amount: "Jumlah setoran minimal Rp 1.000" }))
      } else {
        setSetorErrors(prev => ({ ...prev, amount: undefined }))
      }
    }
  }

  const handleSetorAmountBlur = () => {
    setSetorTouched(prev => ({ ...prev, amount: true }))
    if (setorRawValue <= 0) {
      setSetorErrors(prev => ({ ...prev, amount: "Jumlah setoran harus lebih dari Rp 0" }))
    } else if (setorRawValue < 1000) {
      setSetorErrors(prev => ({ ...prev, amount: "Jumlah setoran minimal Rp 1.000" }))
    } else {
      setSetorErrors(prev => ({ ...prev, amount: undefined }))
    }
  }

  const handleSubmitSetor = async () => {
    // Paksa semua field jadi touched
    setSetorTouched({ amount: true, proof: true, branch: true, employee: true })
    const newErrors: { amount?: string; proof?: string; branch?: string; employee?: string } = {}
    if (setorRawValue <= 0) newErrors.amount = "Jumlah setoran harus lebih dari Rp 0"
    if (setorRawValue > 0 && setorRawValue < 1000) newErrors.amount = "Jumlah setoran minimal Rp 1.000"
    if (!setorBranchId) newErrors.branch = "Pilih cabang yang menyetor"
    if (!setorEmployeeId) newErrors.employee = "Pilih karyawan yang menyetor"
    if (!setorProofFile) newErrors.proof = "Bukti foto setoran wajib dilampirkan"
    if (Object.keys(newErrors).length > 0) {
      setSetorErrors(newErrors)
      return
    }
    if (!currentUser) return
    if (!setorProofFile) return // TypeScript narrowing guard

    // Resolve employee name
    const submitterEmployee = usersList.find((u: any) => String(u.id) === String(setorEmployeeId))
    const submitterName = submitterEmployee?.name || currentUser.name

    setIsSubmittingSetor(true)
    setSetorLoadingMessage("Mengkompres gambar...")
    try {
      // 0. Kompres gambar (maksimal ~100kb, 1024px)
      const options = {
        maxSizeMB: 0.1, // 100 KB
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      
      let compressedFile: File = setorProofFile
      if (setorProofFile.type !== 'image/svg+xml') {
        compressedFile = await imageCompression(setorProofFile, options)
      }
      
      setSetorLoadingMessage("Mengunggah bukti...")

      // 1. Upload bukti foto ke bucket 'attendance-photos' subfolder cash-deposits/
      const fileExt = compressedFile.name.split('.').pop() || 'jpg'
      const fileName = `cash-deposits/setor_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, compressedFile, { upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('attendance-photos').getPublicUrl(fileName)
      const proofUrl = urlData.publicUrl

      const now = new Date()
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, -1)

      // 2. Simpan ke tabel cash_deposits
      const { error: insertError } = await supabase.from('cash_deposits').insert({
        branch_id: setorBranchId,
        amount: setorRawValue,
        deposit_date: localISO,
        submitted_by: setorEmployeeId,
        submitter_name: submitterName,
        note: setorNote || null,
        proof_url: proofUrl,
      })

      if (insertError) throw insertError

      // 4. Reset form & tutup modal
      setSetorDisplayValue('')
      setSetorRawValue(0)
      setSetorBranchId('')
      setSetorEmployeeId('')
      setSetorNote('')
      setSetorProofFile(null)
      setSetorProofPreview(null)
      setSetorErrors({})
      setSetorTouched({})
      setIsSetorModalOpen(false)
      setSetorLoadingMessage("")

      // 5. Refresh daftar deposit
      await fetchTodayDeposits(selectedBranch)
      await fetchData()

      alert(`✅ Setoran ${formatRupiah(setorRawValue)} berhasil dicatat!`)
    } catch (err: any) {
      console.error('Error submitting setor:', err)
      alert(`Gagal menyimpan setoran: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setIsSubmittingSetor(false)
    }
  }

  const fetchData = async () => {
    if (!currentUser) return
    setRefreshing(true)

    const { startISO, endISO } = getDateRangeLimits(datePreset, customStartDate, customEndDate)

    try {
      // 1. Fetch transactions
      let transQuery = supabase
        .from("transactions")
        .select("*")
        .eq("payment_status", "completed")
        .gte("created_at", startISO)
        .lte("created_at", endISO)

      if (selectedBranch !== "all") {
        transQuery = transQuery.eq("branch_id", selectedBranch)
      }

      const { data: transData, error: transError } = await transQuery
      if (transError) throw transError
      setTransactions(transData || [])

      // 2. Fetch approved/paid expenses
      let expenseQuery = supabase
        .from("expenses")
        .select("*")
        .in("status", ["approved", "paid"])
        .gte("created_at", startISO)
        .lte("created_at", endISO)

      if (selectedBranch !== "all") {
        expenseQuery = expenseQuery.eq("branch_id", selectedBranch)
      }

      const { data: expData, error: expError } = await expenseQuery
      if (expError) throw expError
      setExpenses(expData || [])

      // 3. Fetch approved/paid kasbon
      let kasbonQuery = supabase
        .from("kasbon")
        .select("*")
        .in("status", ["approved", "paid"])
        .gte("created_at", startISO)
        .lte("created_at", endISO)

      const { data: kasData, error: kasError } = await kasbonQuery
      if (kasError) throw kasError

      // Join kasbon with branch and user
      const usersMap = new Map(usersList.map((u) => [String(u.id), u]))
      
      const enrichedKasbon = (kasData || []).map((k) => {
        const user = usersMap.get(String(k.user_id))
        return {
          ...k,
          user_name: user?.name || `Staff ID ${k.user_id}`,
          branch_id: user?.branch_id || null
        }
      })

      // Filter kasbon by selected branch if needed
      const filteredKasbon = selectedBranch !== "all"
        ? enrichedKasbon.filter((k) => k.branch_id === selectedBranch)
        : enrichedKasbon

      setKasbonList(filteredKasbon)

      // 4. Fetch transaction items for commissions
      const transIds = (transData || []).map((t) => t.id)
      let itemsList: any[] = []
      let commAmount = 0
      if (transIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("transaction_items")
          .select("transaction_id, service_name, quantity, unit_price, commission_amount, barber_id")
          .in("transaction_id", transIds)
        if (!itemsError && itemsData) {
          itemsList = itemsData
          commAmount = itemsData.reduce((sum, item) => sum + (Number(item.commission_amount) || 0), 0)
        }
      }
      setTransactionItems(itemsList)
      setTotalCommissions(commAmount)

      // 5. Fetch approved/pending deposits in selected date range
      let depositQuery = supabase
        .from("cash_deposits")
        .select("*")
        .gte("deposit_date", startISO)
        .lte("deposit_date", endISO)
        .order("deposit_date", { ascending: false })

      if (selectedBranch !== "all") {
        depositQuery = depositQuery.eq("branch_id", selectedBranch)
      }

      const { data: depData, error: depError } = await depositQuery
      if (depError) throw depError
      setDepositList(depData || [])
    } catch (err) {
      console.error("Error loading insights:", err)
    } finally {
      setRefreshing(false)
    }
  }

  // Trigger refetch when filters change
  useEffect(() => {
    if (usersList.length > 0) {
      fetchData()
      fetchTodayDeposits(selectedBranch)
      setSelectedBarberFilter(null)
    }
  }, [datePreset, customStartDate, customEndDate, selectedBranch, usersList])

  // ----------------------------------------
  // Computations & Metrics
  // ----------------------------------------

  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)
    
    // Payment methods breakdown including Split payments
    let qrisTotal = 0
    let cashTotal = 0
    let transferTotal = 0

    transactions.forEach((t) => {
      const method = t.payment_method?.toLowerCase()
      const amount = Number(t.total_amount) || 0

      if (method === "qris") {
        qrisTotal += amount
      } else if (["cash", "tunai"].includes(method)) {
        cashTotal += amount
      } else if (["transfer", "bank_transfer", "bank"].includes(method)) {
        transferTotal += amount
      } else if (method === "split") {
        try {
          if (t.notes && t.notes.startsWith("{")) {
            const split = JSON.parse(t.notes)
            cashTotal += Number(split.split_cash) || 0
            qrisTotal += Number(split.split_qris) || 0
          } else {
            cashTotal += amount / 2
            qrisTotal += amount / 2
          }
        } catch (e) {
          cashTotal += amount / 2
          qrisTotal += amount / 2
        }
      }
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalKasbon = kasbonList.reduce((sum, k) => sum + (Number(k.amount) || 0), 0)
    const netProfit = totalRevenue - totalExpenses - totalKasbon
    // Hanya hitung setoran yang sudah disetujui (approved) oleh Owner
    const totalDeposits = depositList
      .filter((d) => d.status === "approved")
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

    // Uang di Laci = Pendapatan Tunai - Pengeluaran (tunai) - Kasbon - Total Setoran Diterima
    const cashInDrawer = Math.max(0, cashTotal - totalExpenses - totalKasbon - totalDeposits)

    return {
      totalRevenue,
      qrisTotal,
      cashTotal,
      transferTotal,
      totalExpenses,
      totalKasbon,
      netProfit,
      totalDeposits,
      cashInDrawer
    }
  }, [transactions, expenses, kasbonList, depositList])

  // Barber/Employee performance breakdown
  const employeePerformance = useMemo(() => {
    const performanceMap: Record<string, { name: string; transactionsCount: number; revenue: number; commission: number }> = {}
    
    // Build transaction ID to server_name map
    const txServerMap: Record<string, string> = {}
    transactions.forEach((t) => {
      txServerMap[t.id] = t.server_name || "Unknown Barber"
    })

    // Pre-populate with transaction servers to make sure we count all transactions even if items are empty
    transactions.forEach((t) => {
      const name = t.server_name || "Unknown Barber"
      if (!performanceMap[name]) {
        performanceMap[name] = {
          name,
          transactionsCount: 0,
          revenue: 0,
          commission: 0
        }
      }
      performanceMap[name].transactionsCount += 1
      performanceMap[name].revenue += Number(t.total_amount) || 0
    })

    // Add commission from transaction items
    transactionItems.forEach((item) => {
      const user = usersList.find((u) => String(u.id) === String(item.barber_id))
      const name = user?.name || txServerMap[item.transaction_id] || "Unknown Barber"
      
      if (!performanceMap[name]) {
        performanceMap[name] = {
          name,
          transactionsCount: 0,
          revenue: 0,
          commission: 0
        }
      }
      performanceMap[name].commission += Number(item.commission_amount) || 0
    })

    return Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue)
  }, [transactions, transactionItems, usersList])

  // Filter users list for search popup dialog
  const filteredUsersForDialog = useMemo(() => {
    return usersList.filter((user) => 
      user.name?.toLowerCase().includes(dialogSearchTerm.toLowerCase())
    )
  }, [usersList, dialogSearchTerm])

  // Sorting & Filtering for Transaction Table
  const sortedAndFilteredTransactions = useMemo(() => {
    let list = [...transactions]

    // Barber filter
    if (selectedBarberFilter) {
      list = list.filter((t) => (t.server_name || "Unknown Barber") === selectedBarberFilter)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      list = list.filter(
        (t) =>
          t.transaction_number?.toLowerCase().includes(searchLower) ||
          t.customer_name?.toLowerCase().includes(searchLower) ||
          t.server_name?.toLowerCase().includes(searchLower) ||
          t.cashier_name?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    list.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === "created_at") {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      } else {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return list
  }, [transactions, searchTerm, sortField, sortDirection])

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedAndFilteredTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedAndFilteredTransactions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / itemsPerPage)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }

  // Determine current branch display
  const currentBranchName = useMemo(() => {
    if (selectedBranch === "all") return "Semua Cabang"
    const branch = branches.find((b) => b.id === selectedBranch)
    return branch ? branch.name : "Cabang Aktif"
  }, [selectedBranch, branches])

  const isOwnerOrManager = currentUser?.role === "owner" || currentUser?.position === "manager"

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-red-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data insights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-4 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>{currentBranchName}</span>
            {isOwnerOrManager && <Badge variant="secondary">Akses Manajemen</Badge>}
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 dark:from-red-400 dark:via-rose-400 dark:to-orange-400 bg-clip-text text-transparent">
            Insight Laporan Harian
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Analisis lengkap pendapatan, metode bayar, pengeluaran, kasbon, dan performa karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={refreshing}
            className="w-full sm:w-auto gap-2 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Date & Branch Select Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
        {/* Date presets selection */}
        <div className="flex-1 min-w-0 space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-red-500" />
            Rentang Waktu
          </Label>
          <div className="flex items-center gap-2">
            <Select value={datePreset} onValueChange={(value) => setDatePreset(value)}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl flex-1">
                <SelectValue placeholder="Pilih Rentang Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini (Today)</SelectItem>
                <SelectItem value="yesterday">Kemarin (Yesterday)</SelectItem>
                <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                <SelectItem value="lastWeek">Minggu Lalu</SelectItem>
                <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                <SelectItem value="custom">Custom Tanggal (Custom Range)</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsSetorModalOpen(true)}
              className="flex-shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
              size="sm"
            >
              <Banknote className="h-4 w-4" />
              Setor
            </Button>
          </div>
        </div>

        {/* Custom date range fields (only when 'custom' selected) */}
        {datePreset === "custom" && (
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500">Mulai</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500">Selesai</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Branch selection (only visible for owner/manager) */}
        {isOwnerOrManager ? (
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0 space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-red-500" />
              Cabang Toko
            </Label>
            <Select value={selectedBranch} onValueChange={(value) => setSelectedBranch(value)}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Pilih Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang (Global)</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0 space-y-2 flex flex-col justify-end">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Cabang Anda:</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentBranchName}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {/* Total Revenue */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-16 w-16 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Total Pendapatan
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(metrics.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span>QRIS ({((metrics.qrisTotal / (metrics.totalRevenue || 1)) * 100).toFixed(0)}%)</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(metrics.qrisTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tunai ({((metrics.cashTotal / (metrics.totalRevenue || 1)) * 100).toFixed(0)}%)</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(metrics.cashTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer ({((metrics.transferTotal / (metrics.totalRevenue || 1)) * 100).toFixed(0)}%)</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(metrics.transferTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="h-16 w-16 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              Pengeluaran Cabang
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(metrics.totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col justify-center min-h-[50px]">
            {expenses.length === 0 ? (
              <span className="italic">Tidak ada pengeluaran disetujui</span>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {expenses.length} pengeluaran disetujui / paid
              </span>
            )}
          </CardContent>
        </Card>

        {/* Total Kasbon */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Wallet className="h-16 w-16 text-orange-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-700 dark:text-orange-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Kasbon Karyawan
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(metrics.totalKasbon)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col justify-center min-h-[50px]">
            {kasbonList.length === 0 ? (
              <span className="italic">Tidak ada kasbon aktif/disetujui</span>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {kasbonList.length} kasbon disetujui / dibayar
              </span>
            )}
          </CardContent>
        </Card>

        {/* Total Komisi Karyawan */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Award className="h-16 w-16 text-indigo-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              Total Komisi Karyawan
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(totalCommissions)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col justify-center min-h-[50px]">
            <span className="text-[11px] leading-tight text-slate-600 dark:text-slate-400">
              Total komisi yang dihasilkan oleh tim barber pada periode ini.
            </span>
          </CardContent>
        </Card>

        {/* Total Setoran */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Send className="h-16 w-16 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Send className="h-3.5 w-3.5" />
              Total Setoran Diterima
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(metrics.totalDeposits)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col justify-center min-h-[50px]">
            {depositList.filter((d) => d.status === "approved").length === 0 ? (
              <span className="italic">
                {datePreset === "today" ? "Belum ada setoran diterima hari ini" : "Belum ada setoran diterima periode ini"}
              </span>
            ) : (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {depositList.filter((d) => d.status === "approved").length}x setoran diterima
              </span>
            )}
            {depositList.filter((d) => d.status === "pending").length > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                ({depositList.filter((d) => d.status === "pending").length}x setoran pending)
              </span>
            )}
          </CardContent>
        </Card>

        {/* Uang di Laci */}
        <Card className="relative overflow-hidden group border-slate-200/50 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Banknote className="h-16 w-16 text-amber-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5" />
              Estimasi Uang di Laci
            </CardDescription>
            <CardTitle className="text-base md:text-lg xl:text-xl font-extrabold text-slate-800 dark:text-white leading-tight break-words">
              {formatRupiah(metrics.cashInDrawer)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Tunai Masuk</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(metrics.cashTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>- Pengeluaran</span>
              <span className="font-semibold text-red-600">-{formatRupiah(metrics.totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span>- Kasbon</span>
              <span className="font-semibold text-red-600">-{formatRupiah(metrics.totalKasbon)}</span>
            </div>
            <div className="flex justify-between">
              <span>- Disetor</span>
              <span className="font-semibold text-emerald-600">-{formatRupiah(metrics.totalDeposits)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Breakdown Section (Expenses, Kasbon & Barber performance side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
        {/* Barber performance (Revenue per Barber) */}
        <Card className="lg:col-span-6 border-slate-200/50 dark:border-slate-800/80 shadow-md">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Users className="h-5 w-5 text-emerald-500" />
              Performa Pendapatan per Barber
            </CardTitle>
            <CardDescription>
              Kontribusi total pendapatan dan jumlah transaksi dari masing-masing barber.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {employeePerformance.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 italic">
                Tidak ada data performa karyawan dalam rentang tanggal ini.
              </div>
            ) : (
              <div className="space-y-4">
                {employeePerformance.map((emp) => {
                  const percentage = ((emp.revenue / (metrics.totalRevenue || 1)) * 100).toFixed(0)
                  const isSelected = selectedBarberFilter === emp.name
                  return (
                    <div 
                      key={emp.name} 
                      className={`space-y-2 p-3 rounded-xl transition-all cursor-pointer border ${
                        isSelected 
                          ? "bg-red-50/80 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/50 shadow-sm" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent"
                      }`}
                      onClick={() => setSelectedBarberFilter(isSelected ? null : emp.name)}
                    >
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                            {emp.name}
                            {isSelected && <Badge className="bg-red-500 hover:bg-red-600 text-white border-none py-0 px-1.5 text-[10px]">Aktif Filter</Badge>}
                          </span>
                          <span className="text-xs text-slate-500">{emp.transactionsCount} Transaksi selesai</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(emp.revenue)}</span>
                          <span className="text-xs block text-indigo-600 dark:text-indigo-400 font-semibold">Komisi: {formatRupiah(emp.commission)} ({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected 
                              ? "bg-gradient-to-r from-red-500 to-rose-500" 
                              : "bg-gradient-to-r from-emerald-500 to-teal-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses & Kasbon Summary lists */}
        <div className="lg:col-span-6 space-y-8">
          {/* Expenses */}
          <Card className="border-slate-200/50 dark:border-slate-800/80 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                Rincian Pengeluaran Cabang
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {expenses.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 italic text-sm">
                  Tidak ada pengeluaran disetujui / dibayar pada rentang tanggal ini.
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-4 pr-2">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">{exp.description}</div>
                        <div className="text-xs text-slate-500">Kategori: {exp.category || "Umum"}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-sm text-slate-800 dark:text-white">{formatRupiah(exp.amount)}</div>
                        <Badge className="text-[10px] uppercase font-bold py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">{exp.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kasbon List */}
          <Card className="border-slate-200/50 dark:border-slate-800/80 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Wallet className="h-5 w-5 text-orange-500" />
                Rincian Kasbon Karyawan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {kasbonList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400 italic text-sm">
                  Tidak ada kasbon aktif / disetujui pada rentang tanggal ini.
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-4 pr-2">
                  {kasbonList.map((kas) => (
                    <div key={kas.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm text-slate-800 dark:text-white">{kas.user_name}</div>
                        <div className="text-xs text-slate-500">Alasan: {kas.reason || "Mendesak"}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-sm text-slate-800 dark:text-white">{formatRupiah(kas.amount)}</div>
                        <Badge className="text-[10px] uppercase font-bold py-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none">{kas.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions Details Table Card */}
      <Card className="border-slate-200/50 dark:border-slate-800/80 shadow-md">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <CreditCard className="h-5 w-5 text-red-500" />
              <span>Riwayat Transaksi Detail (Laporan Karyawan)</span>
              {selectedBarberFilter && (
                <Badge variant="destructive" className="ml-2 gap-1 py-0.5 px-2 bg-red-600 text-white font-medium flex items-center">
                  Barber: {selectedBarberFilter}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedBarberFilter(null); 
                    }} 
                    className="hover:bg-red-700 rounded p-0.5 ml-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Menampilkan riwayat lengkap data transaksi dan kasir/barber yang bertugas.
            </CardDescription>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari transaksi, pelanggan, barber..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-xl w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Waktu & Tanggal
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("transaction_number")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      No. Transaksi
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("customer_name")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Pelanggan
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cashier_name")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Kasir
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:text-red-500 transition-colors" onClick={() => setIsBarberFilterDialogOpen(true)}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Barber (User)
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("payment_method")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Metode Bayar
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("total_amount")}>
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 justify-end">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500 italic">
                      Tidak ada transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((trx, index) => {
                    const numberIndex = (currentPage - 1) * itemsPerPage + index + 1
                    const timeString = new Date(trx.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })

                    // Badge Color Payment Method
                    let badgeColor = "bg-gray-100 text-gray-800"
                    const payMethod = trx.payment_method?.toLowerCase()
                    if (payMethod === "qris") {
                      badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                    } else if (["cash", "tunai"].includes(payMethod)) {
                      badgeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    } else if (["transfer", "bank_transfer", "bank"].includes(payMethod)) {
                      badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    } else if (payMethod === "split") {
                      badgeColor = "bg-orange-100 text-orange-850 dark:bg-orange-900/30 dark:text-orange-400"
                    }

                    return (
                      <TableRow key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <TableCell className="text-center font-medium text-slate-500">{numberIndex}</TableCell>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">{timeString}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {trx.transaction_number || "TRX-N/A"}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                          {trx.customer_name || "Pelanggan Umum"}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{trx.cashier_name || "N/A"}</TableCell>
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{trx.server_name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge className={`${badgeColor} uppercase text-[10px] font-bold border-none`}>
                              {trx.payment_method === "split" ? "Split Pay" : trx.payment_method || "N/A"}
                            </Badge>
                            {trx.payment_method === "split" && trx.notes && trx.notes.startsWith("{") && (() => {
                              try {
                                const split = JSON.parse(trx.notes)
                                return (
                                  <span className="text-[9px] text-slate-500 font-semibold leading-none">
                                    T: {formatRupiah(split.split_cash)} | Q: {formatRupiah(split.split_qris)}
                                  </span>
                                )
                              } catch (e) {
                                return null
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200">
                          {formatRupiah(trx.total_amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500">
                Menampilkan {Math.min(sortedAndFilteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)} -{" "}
                {Math.min(sortedAndFilteredTransactions.length, currentPage * itemsPerPage)} dari{" "}
                {sortedAndFilteredTransactions.length} transaksi
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-xs font-semibold px-3">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -mr-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barber Filter Dialog Popup */}
      <Dialog open={isBarberFilterDialogOpen} onOpenChange={setIsBarberFilterDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Users className="h-5 w-5 text-red-500" />
              Pilih Barber (User) untuk Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Pilih salah satu barber di bawah ini untuk memfilter riwayat transaksi detail.
            </DialogDescription>
          </DialogHeader>

          {/* Search bar inside dialog */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama barber..."
              value={dialogSearchTerm}
              onChange={(e) => setDialogSearchTerm(e.target.value)}
              className="pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl w-full"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 my-4 pr-1">
            {/* Option to show all / clear filter */}
            <button
              onClick={() => {
                setSelectedBarberFilter(null)
                setIsBarberFilterDialogOpen(false)
                setDialogSearchTerm("")
              }}
              className={`w-full text-left p-3 rounded-xl text-sm font-semibold transition-all border ${
                !selectedBarberFilter
                  ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300"
              }`}
            >
              Semua Barber (Tanpa Filter)
            </button>

            {/* List of users */}
            {filteredUsersForDialog.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic text-sm">
                Tidak ada barber ditemukan.
              </div>
            ) : (
              filteredUsersForDialog.map((user) => {
                const isSelected = selectedBarberFilter === user.name
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedBarberFilter(user.name)
                      setIsBarberFilterDialogOpen(false)
                      setDialogSearchTerm("")
                    }}
                    className={`w-full text-left p-3 rounded-xl text-sm font-semibold transition-all border flex items-center justify-between ${
                      isSelected
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{user.name}</span>
                    {isSelected && <Badge className="bg-red-500 text-white py-0 border-none">Terpilih</Badge>}
                  </button>
                )
              })
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsBarberFilterDialogOpen(false)
                setDialogSearchTerm("")
              }}
              className="rounded-xl border-slate-250 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSetorModalOpen} onOpenChange={(open) => {
        if (!open) {
          setSetorDisplayValue('')
          setSetorRawValue(0)
          setSetorBranchId('')
          setSetorEmployeeId('')
          setSetorNote('')
          setSetorProofFile(null)
          setSetorProofPreview(null)
          setSetorErrors({})
          setSetorTouched({})
        }
        setIsSetorModalOpen(open)
      }}>
        <DialogContent className="w-[90vw] max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black flex items-center gap-2">
                <Send className="w-5 h-5" />
                Setor Kas ke Owner
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-sm mt-1">
                Input jumlah uang tunai yang kamu setor dan lampirkan bukti fotonya.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {/* Cabang Setoran */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Cabang Toko <span className="text-red-500">*</span>
              </Label>
              <Select
                value={setorBranchId}
                onValueChange={(value) => {
                  setSetorBranchId(value)
                  setSetorTouched(prev => ({ ...prev, branch: true }))
                  if (value) setSetorErrors(prev => ({ ...prev, branch: undefined }))
                }}
              >
                <SelectTrigger className={`bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:border-emerald-500 ${
                  setorErrors.branch ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
                }`}>
                  <SelectValue placeholder="Pilih Cabang Setoran" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {setorErrors.branch && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {setorErrors.branch}
                </p>
              )}
            </div>

            {/* Karyawan Penyetor */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                Nama Karyawan Penyetor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={setorEmployeeId}
                onValueChange={(value) => {
                  setSetorEmployeeId(value)
                  setSetorTouched(prev => ({ ...prev, employee: true }))
                  if (value) setSetorErrors(prev => ({ ...prev, employee: undefined }))
                }}
              >
                <SelectTrigger className={`bg-slate-50 dark:bg-slate-800 border-2 rounded-xl focus:border-emerald-500 ${
                  setorErrors.employee ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
                }`}>
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {setorErrors.employee && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {setorErrors.employee}
                </p>
              )}
            </div>

            {/* Jumlah Setoran */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-500" />
                Jumlah Setoran <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm pointer-events-none transition-colors ${
                  setorErrors.amount ? "text-red-400" : setorRawValue > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                }`}>Rp</span>
                <Input
                  id="setor-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={setorDisplayValue}
                  onChange={handleSetorAmountChange}
                  onBlur={handleSetorAmountBlur}
                  className={`pl-10 text-lg font-bold border-2 rounded-xl bg-slate-50 dark:bg-slate-800 transition-colors ${
                    setorErrors.amount
                      ? "border-red-400 dark:border-red-500 focus:border-red-500 text-red-600 dark:text-red-400"
                      : setorRawValue > 0
                      ? "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400"
                  }`}
                />
              </div>
              {setorErrors.amount && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {setorErrors.amount}
                </p>
              )}
            </div>

            {/* Catatan (opsional) */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Catatan <span className="text-slate-400 font-normal">(opsional)</span>
              </Label>
              <Input
                id="setor-note"
                type="text"
                placeholder="mis. Setoran shift sore..."
                value={setorNote}
                onChange={(e) => setSetorNote(e.target.value)}
                className="border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            {/* Upload Bukti Foto */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Bukti Setoran (Foto) <span className="text-red-500">*</span>
              </Label>
              {!setorProofPreview ? (
                <label
                  htmlFor="setor-proof-input"
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all group ${
                    setorErrors.proof
                      ? "border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/10"
                      : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                    setorErrors.proof ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                  }`}>
                    <ImageIcon className={`w-6 h-6 ${setorErrors.proof ? "text-red-500" : "text-emerald-600"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${setorErrors.proof ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                      Klik untuk upload foto
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP (maks. 5MB)</p>
                  </div>
                  <input
                    id="setor-proof-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Validasi ukuran file max 5MB
                        if (file.size > 5 * 1024 * 1024) {
                          setSetorErrors(prev => ({ ...prev, proof: "Ukuran foto maksimal 5MB" }))
                          return
                        }
                        setSetorProofFile(file)
                        setSetorErrors(prev => ({ ...prev, proof: undefined }))
                        setSetorTouched(prev => ({ ...prev, proof: true }))
                        const reader = new FileReader()
                        reader.onload = (ev) => setSetorProofPreview(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700">
                  <img src={setorProofPreview} alt="Bukti Setoran" className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        setSetorProofFile(null)
                        setSetorProofPreview(null)
                        if (setorTouched.proof) {
                          setSetorErrors(prev => ({ ...prev, proof: "Bukti foto setoran wajib dilampirkan" }))
                        }
                      }}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-emerald-600/90 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Foto terlampir
                    </span>
                  </div>
                </div>
              )}
              {setorErrors.proof && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {setorErrors.proof}
                </p>
              )}
            </div>

            {/* Riwayat Setoran Hari Ini */}
            {todayDepositList.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Riwayat Setoran Hari Ini</p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {todayDepositList.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(d.amount)}</p>
                        <p className="text-[10px] text-slate-400">
                          {d.submitter_name} · {(() => {
                            const date = new Date(d.deposit_date);
                            // Handling data lama (UTC) vs data baru (LocalISO)
                            if (typeof d.deposit_date === "string" && !d.deposit_date.includes("Z") && !d.deposit_date.includes("+") && d.deposit_date.includes("T")) {
                              const testDate = new Date(d.deposit_date + "Z");
                              if (!isNaN(testDate.getTime()) && testDate.getTime() < 1784139000000) {
                                return testDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                              }
                            }
                            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </p>
                      </div>
                      {d.proof_url && (
                        <a href={d.proof_url} target="_blank" rel="noreferrer">
                          <img src={d.proof_url} alt="bukti" className="w-10 h-10 object-cover rounded-lg border border-emerald-200" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700"
                onClick={() => setIsSetorModalOpen(false)}
                disabled={isSubmittingSetor}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-bold shadow-lg gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmitSetor}
                disabled={isSubmittingSetor || setorRawValue <= 0 || !setorProofFile}
              >
                {isSubmittingSetor ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> {setorLoadingMessage || "Menyimpan..."}</>
                ) : (
                  <><Send className="w-4 h-4" /> Setor Sekarang</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
