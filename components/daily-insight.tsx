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
  const [setorAmount, setSetorAmount] = useState("")
  const [setorNote, setSetorNote] = useState("")
  const [setorProofFile, setSetorProofFile] = useState<File | null>(null)
  const [setorProofPreview, setSetorProofPreview] = useState<string | null>(null)
  const [isSubmittingSetor, setIsSubmittingSetor] = useState(false)
  const [depositList, setDepositList] = useState<any[]>([])

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

  // Fetch report data
  const fetchDeposits = async (branchId: string) => {
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
      setDepositList(data || [])
    } catch (err) {
      console.error("Error fetching deposits:", err)
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
      fetchDeposits(selectedBranch)
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

    return {
      totalRevenue,
      qrisTotal,
      cashTotal,
      transferTotal,
      totalExpenses,
      totalKasbon,
      netProfit
    }
  }, [transactions, expenses, kasbonList])

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
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>{currentBranchName}</span>
            {isOwnerOrManager && <Badge variant="secondary">Akses Manajemen</Badge>}
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 dark:from-red-400 dark:via-rose-400 dark:to-orange-400 bg-clip-text text-transparent">
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-md">
        {/* Date presets selection */}
        <div className="col-span-1 md:col-span-4 space-y-2">
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
          <div className="col-span-1 md:col-span-4 grid grid-cols-2 gap-2">
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
          <div className="col-span-1 md:col-span-4 space-y-2 md:col-start-9">
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
          <div className="col-span-1 md:col-span-4 space-y-2 md:col-start-9 flex flex-col justify-end">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Cabang Anda:</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentBranchName}</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white">
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
            <CardTitle className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white">
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
            <CardTitle className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white">
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
            <CardTitle className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white">
              {formatRupiah(totalCommissions)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 flex flex-col justify-center min-h-[50px]">
            <span className="text-[11px] leading-tight text-slate-600 dark:text-slate-400">
              Total komisi yang dihasilkan oleh tim barber pada periode ini.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Breakdown Section (Expenses, Kasbon & Barber performance side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
    </div>
  )
}
