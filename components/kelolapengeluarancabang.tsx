"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingDown,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  Zap,
  Wrench,
  ShoppingBag,
  Users,
  Car,
  FileText,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Trash2 ,
} from "lucide-react"
import {
  getAllExpensesWithDetails,
  updateExpenseStatus,
  getBranches,
  type Branch,
  getExpenseStatisticsByBranch,
  deleteExpenseRequest,
  setupGlobalEventsListener,
  broadcastTransactionEvent,
} from "@/lib/supabase"

interface Expense {
  id: string
  branch_id?: string
  category: string
  description: string
  amount: number
  status: "pending" | "approved" | "rejected" | "paid"
  expense_date: string
  receipt_url?: string
  notes?: string
  rejection_reason?: string
  created_at: string
  updated_at?: string
  branches?: { id: string; name: string }
}

export function KelolaPengeluaranCabang() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    paidAmount: 0
  })

  const categories = [
    { id: "utilities", name: "Utilitas", icon: Zap, color: "bg-yellow-100 text-yellow-800" },
    { id: "equipment", name: "Peralatan", icon: Wrench, color: "bg-blue-100 text-blue-800" },
    { id: "supplies", name: "Supplies", icon: ShoppingBag, color: "bg-green-100 text-green-800" },
    { id: "salary", name: "Gaji", icon: Users, color: "bg-red-100 text-red-800" },
    { id: "transportation", name: "Transportasi", icon: Car, color: "bg-orange-100 text-orange-800" },
    { id: "marketing", name: "Marketing", icon: FileText, color: "bg-rose-100 text-rose-800" },
    { id: "maintenance", name: "Maintenance", icon: Wrench, color: "bg-gray-100 text-gray-800" },
  ]

  useEffect(() => {
    loadData()
    
    const globalChannel = setupGlobalEventsListener((event, payload) => {
      if (event === 'expense_deleted' || event === 'expense_updated') {
        console.log('Expense event received:', event, payload)
        loadData()
      }
    })

    return () => {
      supabase.removeChannel(globalChannel)
    }
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, statusFilter, branchFilter])

  useEffect(() => {
    const channel = supabase
      .channel('expenses-management')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'expenses' 
        }, 
        (payload) => {
          console.log('🔄 Real-time update in management:', payload)
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [expensesResult, branchesResult, statsResult] = await Promise.all([
        getAllExpensesWithDetails(),
        getBranches(),
        getExpenseStatisticsByBranch()
      ])

      if (expensesResult.data) {
        setExpenses(expensesResult.data)
      }

      if (branchesResult.data) {
        setBranches(branchesResult.data)
      }

      setStats(statsResult)

    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterExpenses = () => {
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(expense => expense.status === statusFilter)
    }

    if (branchFilter !== "all") {
      filtered = filtered.filter(expense => expense.branch_id === branchFilter)
    }

    setFilteredExpenses(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "rejected": return "bg-red-100 text-red-800 hover:bg-red-100"
      case "paid": return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      case "paid": return <DollarSign className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Disetujui"
      case "pending": return "Menunggu"
      case "rejected": return "Ditolak"
      case "paid": return "Lunas"
      default: return "Unknown"
    }
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId) || categories[0]
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? "Tanggal tidak valid" : date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    } catch {
      return "Tanggal tidak valid"
    }
  }

  const handleApprove = async (expenseId: string) => {
    try {
      await updateExpenseStatus(expenseId, "approved")
      await loadData()
      setIsApproveDialogOpen(false)
      await broadcastTransactionEvent('expense_updated', { expenseId })
    } catch (error) {
      console.error("Error approving expense:", error)
    }
  }

  const handleReject = async (expenseId: string) => {
    try {
      await updateExpenseStatus(expenseId, "rejected", rejectReason)
      await loadData()
      setIsRejectDialogOpen(false)
      setRejectReason("")
      await broadcastTransactionEvent('expense_updated', { expenseId })
    } catch (error) {
      console.error("Error rejecting expense:", error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpenseRequest(expenseId)
      await loadData()
      await broadcastTransactionEvent('expense_deleted', { expenseId })
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsDetailDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kelola Pengajuan Pengeluaran</h1>
          <p className="text-muted-foreground">Kelola dan tinjau pengajuan pengeluaran dari semua cabang</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Semua pengajuan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">{formatPrice(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Pengajuan disetujui</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Pengajuan ditolak</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari pengajuan..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Daftar Pengajuan</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Tidak ada pengajuan</h3>
                <p className="text-gray-500">Tidak ditemukan pengajuan yang sesuai dengan filter</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const categoryInfo = getCategoryInfo(expense.category)
                const branchName = expense.branch_id ? branches.find(b => b.id === expense.branch_id)?.name : "Semua Cabang"
                return (
                  <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <categoryInfo.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{expense.description}</h3>
                                <p className="text-sm text-muted-foreground">{expense.notes}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">{formatPrice(expense.amount)}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(expense.expense_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <Building2 className="h-3 w-3 text-gray-600" />
                                <span className="text-gray-700">{branchName}</span>
                              </div>
                              <Badge className={categoryInfo.color}>{categoryInfo.name}</Badge>
                              <Badge className={`${getStatusColor(expense.status)} flex items-center gap-1`}>
                                {getStatusIcon(expense.status)}
                                {getStatusText(expense.status)}
                              </Badge>
                            </div>
                            {expense.status === "rejected" && expense.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">
                                  <strong>Alasan Penolakan:</strong> {expense.rejection_reason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {expense.status === "pending" && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => { setSelectedExpense(expense); setIsApproveDialogOpen(true) }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => { setSelectedExpense(expense); setIsRejectDialogOpen(true) }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryExpenses = expenses.filter(e => e.category === category.id)
                    const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
                    return (
                      <div key={category.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{categoryExpenses.length} pengajuan</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(categoryTotal)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pengajuan per Cabang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branches.map((branch) => {
                    const branchExpenses = expenses.filter(e => e.branch_id === branch.id)
                    const branchTotal = branchExpenses.reduce((sum, e) => sum + e.amount, 0)
                    return (
                      <div key={branch.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{branch.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{branchExpenses.length} pengajuan</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(branchTotal)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Kategori</Label>
                  <p className="font-medium">{getCategoryInfo(selectedExpense.category).name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cabang</Label>
                  <p className="font-medium">
                    {selectedExpense.branch_id ? branches.find(b => b.id === selectedExpense.branch_id)?.name : "Semua Cabang"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jumlah</Label>
                  <p className="font-medium text-blue-600">{formatPrice(selectedExpense.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedExpense.status)}>
                    {getStatusText(selectedExpense.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Pengajuan</Label>
                  <p className="font-medium">{formatDate(selectedExpense.expense_date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Dibuat</Label>
                  <p className="font-medium">{formatDate(selectedExpense.created_at)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Deskripsi</Label>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              {selectedExpense.status === "rejected" && selectedExpense.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <Label className="text-muted-foreground">Alasan Penolakan</Label>
                  <p className="font-medium text-red-700">{selectedExpense.rejection_reason}</p>
                </div>
              )}
              {selectedExpense.notes && (
                <div>
                  <Label className="text-muted-foreground">Catatan</Label>
                  <p className="font-medium">{selectedExpense.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pengajuan</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menyetujui pengajuan ini?</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-2">
              <p className="font-medium">{selectedExpense.description}</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(selectedExpense.amount)}</p>
              <p className="text-sm text-muted-foreground">
                {selectedExpense.branch_id ? branches.find(b => b.id === selectedExpense.branch_id)?.name : "Semua Cabang"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={() => selectedExpense && handleApprove(selectedExpense.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan</DialogTitle>
            <DialogDescription>Berikan alasan penolakan pengajuan ini</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">{selectedExpense.description}</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(selectedExpense.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedExpense.branch_id ? branches.find(b => b.id === selectedExpense.branch_id)?.name : "Semua Cabang"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Alasan Penolakan</Label>
                <Textarea 
                  id="rejectReason" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)} 
                  placeholder="Masukkan alasan penolakan..." 
                  required 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={() => selectedExpense && handleReject(selectedExpense.id)} 
              variant="destructive"
              disabled={!rejectReason.trim()}
            >
              Tolak Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
