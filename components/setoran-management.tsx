"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Check, X, Clock, Banknote, Search, Calendar, FileText, CheckCircle2, XCircle, Trash2 } from "lucide-react"

interface CashDeposit {
  id: string
  branch_id: string
  amount: number
  deposit_date: string
  submitted_by: string
  submitter_name: string
  note: string | null
  proof_url: string | null
  status: "pending" | "approved" | "rejected"
  verified_by: string | null
  verified_at: string | null
  reject_reason: string | null
  branches?: {
    name: string
  }
}

export default function SetoranManagement() {
  const { toast } = useToast()
  const [deposits, setDeposits] = useState<CashDeposit[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Approval/Reject Modal States
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState<CashDeposit | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Preview Bukti Setor
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
      setBranches(branchData || [])

      // 2. Fetch cash deposits
      const { data: depositData, error } = await supabase
        .from("cash_deposits")
        .select(`
          *,
          branches:branch_id (
            name
          )
        `)
        .order("deposit_date", { ascending: false })

      if (error) throw error
      setDeposits(depositData || [])
    } catch (err: any) {
      console.error("Error fetching deposits:", err)
      toast({
        title: "Error",
        description: "Gagal mengambil data setoran.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (deposit: CashDeposit) => {
    if (isActionLoading) return
    setIsActionLoading(true)
    try {
      const userStr = localStorage.getItem("user")
      const currentUser = userStr ? JSON.parse(userStr) : null
      const verifiedByUserId = currentUser?.id ? Number(currentUser.id) : null

      const { error } = await supabase
        .from("cash_deposits")
        .update({
          status: "approved",
          verified_by: verifiedByUserId,
          verified_at: new Date().toISOString(),
          reject_reason: null
        })
        .eq("id", deposit.id)

      if (error) throw error

      toast({
        title: "Berhasil",
        description: `Setoran sebesar ${formatRupiah(deposit.amount)} telah disetujui.`,
      })

      fetchData()
    } catch (err: any) {
      console.error("Error approving deposit:", err)
      toast({
        title: "Error",
        description: err.message || "Gagal menyetujui setoran.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDeposit || isActionLoading) return
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penolakan wajib diisi.",
        variant: "destructive",
      })
      return
    }

    setIsActionLoading(true)
    try {
      const userStr = localStorage.getItem("user")
      const currentUser = userStr ? JSON.parse(userStr) : null
      const verifiedByUserId = currentUser?.id ? Number(currentUser.id) : null

      const { error } = await supabase
        .from("cash_deposits")
        .update({
          status: "rejected",
          verified_by: verifiedByUserId,
          verified_at: new Date().toISOString(),
          reject_reason: rejectReason
        })
        .eq("id", selectedDeposit.id)

      if (error) throw error

      toast({
        title: "Berhasil",
        description: `Setoran sebesar ${formatRupiah(selectedDeposit.amount)} telah ditolak.`,
      })

      setIsRejectDialogOpen(false)
      setSelectedDeposit(null)
      setRejectReason("")
      fetchData()
    } catch (err: any) {
      console.error("Error rejecting deposit:", err)
      toast({
        title: "Error",
        description: err.message || "Gagal menolak setoran.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (deposit: CashDeposit) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi setoran sebesar ${formatRupiah(deposit.amount)} dari ${deposit.submitter_name}?`)) {
      return
    }

    setIsActionLoading(true)
    try {
      const { error } = await supabase
        .from("cash_deposits")
        .delete()
        .eq("id", deposit.id)

      if (error) throw error

      toast({
        title: "Berhasil",
        description: "Transaksi setoran telah berhasil dihapus.",
      })

      fetchData()
    } catch (err: any) {
      console.error("Error deleting deposit:", err)
      toast({
        title: "Error",
        description: err.message || "Gagal menghapus transaksi setoran.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-"
    
    // Database 'timestamp without time zone' di-fetch Supabase.
    // Jika data lama berakhiran 'Z' atau mengandung offset (+), biarkan JS mengonversinya.
    // Jika data baru tidak mengandung 'Z', JS akan membacanya langsung sebagai Local Time.
    // Namun untuk data di database yang disimpan tanpa Z tapi sebenarnya waktu UTC, kita tambahkan Z.
    // Di sini kita cek apakah string tanggal mengandung Z atau offset.
    let date = new Date(dateStr)
    
    // Jika data lama terdeteksi (seperti "2026-07-15T17:56:48.534") tanpa info Z/offset,
    // tapi sebenarnya diinput menggunakan .toISOString() (yang merupakan UTC),
    // kita tambahkan 'Z' agar Javascript mengonversinya ke waktu lokal browser dengan benar (+7 jam).
    if (typeof dateStr === "string" && !dateStr.includes("Z") && !dateStr.includes("+") && dateStr.includes("T")) {
      // Cek jika jam di string tersebut di-input sebelum migrasi format localISO kita (misalnya tanggal 15 Juli jam 17:56).
      // Data localISO kita akan menghasilkan jam lokal yang pas (misal jam 00:56 malam tanggal 16).
      // Kita parsing: jika jam tersebut adalah data UTC (jam 17:56 yang kalau dirupiahkan WIB adalah jam 00:56),
      // kita tambahkan 'Z' untuk auto-convert.
      const testDate = new Date(dateStr + "Z")
      // Jika tahun valid, kita gunakan conversion
      if (!isNaN(testDate.getTime())) {
        // Untuk data lama di bawah jam migrasi (UTC ISO String), convert ke local:
        // Di sini kita bisa mendeteksi data lama dengan aman:
        if (new Date(dateStr).getTime() < 1784139000000) { // timestamp threshold migrasi
          date = testDate
        }
      }
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Filter deposits
  const filteredDeposits = deposits.filter((d) => {
    const matchesBranch = filterBranch === "all" || d.branch_id === filterBranch
    const matchesStatus = filterStatus === "all" || d.status === filterStatus
    const matchesSearch =
      d.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.branches?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesBranch && matchesStatus && matchesSearch
  })

  // Metrics
  const totalApproved = deposits
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + d.amount, 0)
  const totalPendingCount = deposits.filter((d) => d.status === "pending").length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kelola Setoran Kas</h2>
        <p className="text-muted-foreground">Verifikasi setoran uang tunai dari karyawan cabang ke Owner</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Total Setoran Diterima
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {formatRupiah(totalApproved)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-slate-900 border-yellow-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-700 dark:text-yellow-400 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              Menunggu Verifikasi
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {totalPendingCount} Transaksi
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Cari nama karyawan atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Diterima</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Jumlah Setoran</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Memuat data setoran...
                    </TableCell>
                  </TableRow>
                ) : filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Tidak ada data setoran ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(d.deposit_date)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                        {d.branches?.name || "Cabang Terhapus"}
                      </TableCell>
                      <TableCell>{d.submitter_name}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(d.amount)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-slate-500">
                        {d.note || "-"}
                        {d.status === "rejected" && d.reject_reason && (
                          <p className="text-red-500 mt-1 font-semibold">Alasan tolak: {d.reject_reason}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.proof_url ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-emerald-600 font-bold flex items-center gap-1"
                            onClick={() => {
                              setPreviewUrl(d.proof_url!)
                              setIsPreviewOpen(true)
                            }}
                          >
                            Lihat Foto
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Tidak ada foto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            d.status === "approved"
                              ? "default"
                              : d.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {d.status === "approved"
                            ? "Diterima"
                            : d.status === "rejected"
                            ? "Ditolak"
                            : "Menunggu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {d.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-white hover:bg-red-600 border-red-200"
                                onClick={() => {
                                  setSelectedDeposit(d)
                                  setRejectReason("")
                                  setIsRejectDialogOpen(true)
                                }}
                                disabled={isActionLoading}
                              >
                                <X className="w-3.5 h-3.5 mr-1" /> Tolak
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleApprove(d)}
                                disabled={isActionLoading}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Terima
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleDelete(d)}
                            disabled={isActionLoading}
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tolak Setoran Kas</DialogTitle>
            <DialogDescription>
              Silakan tulis alasan penolakan setoran sebesar{" "}
              <span className="font-bold text-black dark:text-white">
                {selectedDeposit ? formatRupiah(selectedDeposit.amount) : ""}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Alasan Penolakan</Label>
              <Textarea
                id="reject-reason"
                placeholder="Tulis alasan mengapa setoran ditolak..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isActionLoading}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActionLoading}>
              Tolak Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Photo Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg rounded-2xl overflow-hidden p-0 border-0">
          <div className="relative bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
            <img src={previewUrl} alt="Bukti Setoran" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            <Button
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 h-8 w-8"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
