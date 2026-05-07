"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Check, X, Clock, DollarSign, TrendingUp } from "lucide-react"

interface KasbonRequest {
  id: string
  user_id: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected" | "paid"
  created_at: string
  approved_at?: string
  approved_by?: string
  notes?: string
  due_date?: string
  paid_amount?: number
  remaining_amount?: number
  user?: {
    name: string
    email: string
    position: string
  }
  approver?: {
    name: string
  }
}

interface User {
  id: string
  name: string
  email: string
  position: string
}

export default function KasbonManagement() {
  const [kasbonRequests, setKasbonRequests] = useState<KasbonRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [rejectingKasbon, setRejectingKasbon] = useState<KasbonRequest | null>(null)
  const [payingKasbon, setPayingKasbon] = useState<KasbonRequest | null>(null)
  const [extendingKasbon, setExtendingKasbon] = useState<KasbonRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full")
  const [newDueDate, setNewDueDate] = useState("")
  const [editingKasbon, setEditingKasbon] = useState<KasbonRequest | null>(null)
  const [formData, setFormData] = useState({
    user_id: "",
    amount: "",
    reason: "",
    status: "pending" as "pending" | "approved" | "rejected" | "paid",
    notes: "",
  })

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    fetchData()
  }, [])

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, position")
        .eq("status", "active")

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Fetch kasbon requests (using snapshot columns: user_name, approved_by_name)
      const { data: kasbonData, error: kasbonError } = await supabase
        .from("kasbon")
        .select("*")
        .order("created_at", { ascending: false })

      if (kasbonError) throw kasbonError
      setKasbonRequests(kasbonData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      if (showLoading) {
        toast({
          title: "Error",
          description: "Gagal memuat data kasbon",
          variant: "destructive",
        })
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectingKasbon) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Silakan isi alasan penolakan",
        variant: "destructive",
      });
      return;
    }

    await handleStatusUpdate(rejectingKasbon.id, "rejected", rejectionReason);
    setIsRejectDialogOpen(false);
    setRejectingKasbon(null);
    setRejectionReason("");
    
    // Refresh tanpa show loading
    await fetchData(false);
  };

  const openRejectDialog = (kasbon: KasbonRequest) => {
    setRejectingKasbon(kasbon);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const openPaymentDialog = (kasbon: KasbonRequest) => {
    setPayingKasbon(kasbon);
    const remaining = kasbon.amount - (kasbon.paid_amount || 0);
    setPaymentAmount(formatInputCurrency(remaining.toString()));
    setPaymentType("full");
    setIsPaymentDialogOpen(true);
  };

  const openExtendDialog = (kasbon: KasbonRequest) => {
    setExtendingKasbon(kasbon);
    setNewDueDate(kasbon.due_date || "");
    setIsExtendDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!payingKasbon) return;

    const amount = Number(parseInputCurrency(paymentAmount));
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Jumlah pembayaran tidak valid",
        variant: "destructive",
      });
      return;
    }

    const remaining = payingKasbon.amount - (payingKasbon.paid_amount || 0);
    if (amount > remaining) {
      toast({
        title: "Error",
        description: "Jumlah pembayaran melebihi sisa kasbon",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPaidAmount = (payingKasbon.paid_amount || 0) + amount;
      const newRemainingAmount = payingKasbon.amount - newPaidAmount;
      const newStatus = newPaidAmount >= payingKasbon.amount ? "paid" : "approved";

      const { error } = await supabase
        .from("kasbon")
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payingKasbon.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Pembayaran ${paymentType === "full" ? "lunas" : "cicilan"} sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount)} berhasil dicatat`,
      });

      setIsPaymentDialogOpen(false);
      setPayingKasbon(null);
      setPaymentAmount("");
      
      // Refresh tanpa show loading
      await fetchData(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran",
        variant: "destructive",
      });
    }
  };

  const handleExtendDueDate = async () => {
    if (!extendingKasbon || !newDueDate) {
      toast({
        title: "Error",
        description: "Silakan pilih tanggal jatuh tempo baru",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("kasbon")
        .update({
          due_date: newDueDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", extendingKasbon.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Jatuh tempo berhasil diperpanjang ke ${new Date(newDueDate).toLocaleDateString("id-ID")}`,
      });

      setIsExtendDialogOpen(false);
      setExtendingKasbon(null);
      setNewDueDate("");
      
      // Refresh tanpa show loading
      await fetchData(false);
    } catch (error) {
      console.error("Error extending due date:", error);
      toast({
        title: "Error",
        description: "Gagal memperpanjang jatuh tempo",
        variant: "destructive",
      });
    }
  };

  // Format number to rupiah format for input
  const formatInputCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    
    // Format with thousand separators
    return new Intl.NumberFormat('id-ID').format(Number(numericValue));
  };

  // Parse rupiah format back to number
  const parseInputCurrency = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected" | "paid", notes?: string) => {
    try {
      // Update kasbon status - user sudah terverifikasi lewat PIN
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      // Tambahkan approved_at untuk status approved atau rejected
      if (status === "approved" || status === "rejected") {
        updateData.approved_at = new Date().toISOString();
      }
      
      // Tambahkan notes jika ada (untuk alasan penolakan)
      if (notes) {
        updateData.notes = notes;
      }

      // Fetch kasbon data untuk update remaining_amount
      const { data: kasbonData } = await supabase
        .from("kasbon")
        .select("amount, paid_amount")
        .eq("id", id)
        .single();
      
      if (kasbonData) {
        updateData.remaining_amount = kasbonData.amount - (kasbonData.paid_amount || 0);
      }

      const { data, error } = await supabase
        .from("kasbon")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Update error:", error);
        throw new Error(error.message || "Gagal mengupdate kasbon");
      }

      if (!data) {
        throw new Error("Kasbon tidak ditemukan");
      }

      const statusText = status === "approved" ? "disetujui" : status === "rejected" ? "ditolak" : "dibayar";
      toast({ title: "Berhasil", description: `Kasbon berhasil ${statusText}` });
      
      // Refresh tanpa show loading
      await fetchData(false);

    } catch (error: any) {
      console.error("Error detail:", error);
      
      let errorMessage = "Gagal mengupdate status kasbon.";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // User sudah terverifikasi lewat PIN, langsung buat kasbon
      const kasbonData: any = {
        user_id: formData.user_id,
        amount: Number(formData.amount),
        reason: formData.reason,
        status: formData.status,
        notes: formData.notes,
      };
      
      // Tambahkan approved_at jika status bukan pending
      if (formData.status !== "pending") {
        kasbonData.approved_at = new Date().toISOString();
      }

      if (editingKasbon) {
        const { data: updateData, error: updateError } = await supabase
          .from("kasbon")
          .update(kasbonData)
          .eq("id", editingKasbon.id)
          .select();

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
        
        toast({ title: "Berhasil", description: "Kasbon berhasil diperbarui" });
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("kasbon")
          .insert([kasbonData])
          .select();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
        
        toast({ title: "Berhasil", description: "Kasbon berhasil ditambahkan" });
      }

      setIsDialogOpen(false);
      setEditingKasbon(null);
      setFormData({ user_id: "", amount: "", reason: "", status: "pending", notes: "" });
      
      // Refresh tanpa show loading
      fetchData(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      
      let errorMessage = "Gagal menyimpan kasbon.";
      
      // Handle specific database errors
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          errorMessage = "Data tidak valid: Pastikan semua referensi data sudah benar";
        } else {
          errorMessage = error.message;
        }
      }
      
      // Log detailed error for debugging
      console.error("Detailed error:", JSON.stringify(error, null, 2));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (kasbon: KasbonRequest) => {
    setEditingKasbon(kasbon)
    setFormData({
      user_id: kasbon.user_id,
      amount: kasbon.amount.toString(),
      reason: kasbon.reason,
      status: kasbon.status,
      notes: kasbon.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kasbon ini?")) return

    try {
      const { error } = await supabase.from("kasbon").delete().eq("id", id)

      if (error) throw error
      toast({ title: "Berhasil", description: "Kasbon berhasil dihapus" })
      
      // Refresh tanpa show loading
      fetchData(false)
    } catch (error) {
      console.error("Error deleting kasbon:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus kasbon",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ user_id: "", amount: "", reason: "", status: "pending", notes: "" })
    setEditingKasbon(null)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      paid: "outline",
    } as const

    const labels = {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak",
      paid: "Dibayar",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const getDueDateStatus = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "paid") return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        status: "overdue",
        days: Math.abs(diffDays),
        text: `Terlambat ${Math.abs(diffDays)} hari`,
        color: "text-red-600 bg-red-50"
      };
    } else if (diffDays === 0) {
      return {
        status: "today",
        days: 0,
        text: "Jatuh tempo hari ini",
        color: "text-orange-600 bg-orange-50"
      };
    } else if (diffDays <= 3) {
      return {
        status: "soon",
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: "text-yellow-600 bg-yellow-50"
      };
    } else {
      return {
        status: "normal",
        days: diffDays,
        text: `${diffDays} hari lagi`,
        color: "text-green-600 bg-green-50"
      };
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const totalPending = kasbonRequests.filter((k) => k.status === "pending").length
  const totalApproved = kasbonRequests.filter((k) => k.status === "approved").length
  const totalAmount = kasbonRequests.filter((k) => k.status === "approved").reduce((sum, k) => sum + k.amount, 0)
  const thisMonthRequests = kasbonRequests.filter(
    (k) => new Date(k.created_at).getMonth() === new Date().getMonth(),
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Management Kasbon</h2>
          <p className="text-muted-foreground">Kelola pengajuan kasbon dari karyawan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kasbon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingKasbon ? "Edit Kasbon" : "Tambah Kasbon"}</DialogTitle>
              <DialogDescription>Kelola pengajuan kasbon karyawan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_id">Karyawan</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Masukkan jumlah kasbon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Alasan</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Jelaskan alasan kasbon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="paid">Dibayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">{editingKasbon ? "Perbarui" : "Tambah"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Menunggu Persetujuan</TabsTrigger>
          <TabsTrigger value="all">Semua Kasbon</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalApproved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthRequests}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kasbon Menunggu Persetujuan</CardTitle>
              <CardDescription>Kasbon yang perlu ditinjau dan disetujui</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kasbonRequests
                    .filter((k) => k.status === "pending")
                    .map((kasbon) => (
                      <TableRow key={kasbon.id}>
                        <TableCell>{new Date(kasbon.created_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>
                          <div className="font-medium">{kasbon.user?.name || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(kasbon.amount)}</TableCell>
                        <TableCell>{kasbon.reason}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(kasbon.id, "approved")}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectDialog(kasbon)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(kasbon)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semua Riwayat Kasbon</CardTitle>
              <CardDescription>Riwayat kasbon yang sudah disetujui, ditolak, dan dibayar dengan informasi jatuh tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Diajukan Oleh</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Dibayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Disetujui Oleh</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kasbonRequests.filter((k) => k.status === "approved" || k.status === "paid" || k.status === "rejected").map((kasbon) => {
                    const dueDateStatus = getDueDateStatus(kasbon.due_date, kasbon.status);
                    return (
                    <TableRow key={kasbon.id}>
                      <TableCell>{new Date(kasbon.created_at).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="font-medium">{kasbon.user?.name || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(kasbon.amount)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(kasbon.paid_amount || 0)}
                          </div>
                          {kasbon.amount > (kasbon.paid_amount || 0) && kasbon.status !== "rejected" && (
                            <div className="text-xs text-gray-500">
                              Sisa: {formatCurrency(kasbon.amount - (kasbon.paid_amount || 0))}
                            </div>
                          )}
                          {(kasbon.paid_amount || 0) > 0 && kasbon.amount > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-green-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${((kasbon.paid_amount || 0) / kasbon.amount) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(kasbon.status)}</TableCell>
                      <TableCell>
                        {kasbon.due_date ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {new Date(kasbon.due_date).toLocaleDateString("id-ID")}
                            </div>
                            {dueDateStatus && (
                              <Badge className={`${dueDateStatus.color} text-xs font-semibold border-0`}>
                                {dueDateStatus.text}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{kasbon.reason}</TableCell>
                      <TableCell>{kasbon.approver?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2 flex-wrap gap-1">
                          {kasbon.status === "approved" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPaymentDialog(kasbon)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Bayar
                              </Button>
                              {kasbon.due_date && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openExtendDialog(kasbon)}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Perpanjang
                                </Button>
                              )}
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleEdit(kasbon)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(kasbon.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Penolakan Kasbon */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <X className="w-5 h-5" />
              Tolak Pengajuan Kasbon
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk pengajuan kasbon dari {rejectingKasbon?.user?.name || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {rejectingKasbon && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Karyawan:</span>
                  <span className="font-medium">{rejectingKasbon.user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium text-red-600">{formatCurrency(rejectingKasbon.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Alasan Pengajuan:</span>
                  <span className="font-medium text-right ml-4">{rejectingKasbon.reason}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-base">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan kenapa kasbon ini ditolak..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-gray-500">
                Alasan penolakan akan dilihat oleh karyawan yang mengajukan
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectingKasbon(null);
                setRejectionReason("");
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              Tolak Kasbon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pembayaran Kasbon */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-blue-600 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pembayaran Kasbon
            </DialogTitle>
            <DialogDescription>
              Proses pembayaran kasbon untuk {payingKasbon?.user?.name || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {payingKasbon && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Karyawan:</span>
                    <span className="font-medium">{payingKasbon.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Kasbon:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(payingKasbon.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sudah Dibayar:</span>
                    <span className="font-medium text-green-600">{formatCurrency(payingKasbon.paid_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600 font-semibold">Sisa:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(payingKasbon.amount - (payingKasbon.paid_amount || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Tipe Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={paymentType === "full" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setPaymentType("full");
                        if (payingKasbon) {
                          const remaining = payingKasbon.amount - (payingKasbon.paid_amount || 0);
                          setPaymentAmount(formatInputCurrency(remaining.toString()));
                        }
                      }}
                    >
                      Lunas
                    </Button>
                    <Button
                      type="button"
                      variant={paymentType === "partial" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => {
                        setPaymentType("partial");
                        setPaymentAmount("");
                      }}
                    >
                      Cicilan
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-amount" className="text-base">
                    Jumlah Pembayaran <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input
                      id="payment-amount"
                      type="text"
                      placeholder="0"
                      value={paymentAmount}
                      onChange={(e) => {
                        const formatted = formatInputCurrency(e.target.value);
                        setPaymentAmount(formatted);
                      }}
                      disabled={paymentType === "full"}
                      className="text-base pl-10"
                    />
                  </div>
                  {paymentType === "partial" && payingKasbon && (
                    <p className="text-xs text-gray-500">
                      Maksimal: {formatCurrency(payingKasbon.amount - (payingKasbon.paid_amount || 0))}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setPayingKasbon(null);
                setPaymentAmount("");
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handlePayment}
              disabled={!paymentAmount || Number(parseInputCurrency(paymentAmount)) <= 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Proses Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Perpanjang Jatuh Tempo */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-purple-600 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Perpanjang Jatuh Tempo
            </DialogTitle>
            <DialogDescription>
              Ubah tanggal jatuh tempo kasbon untuk {extendingKasbon?.user?.name || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {extendingKasbon && (
              <>
                <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Karyawan:</span>
                    <span className="font-medium">{extendingKasbon.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jumlah Kasbon:</span>
                    <span className="font-bold text-purple-600">{formatCurrency(extendingKasbon.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jatuh Tempo Saat Ini:</span>
                    <span className="font-medium">
                      {extendingKasbon.due_date ? new Date(extendingKasbon.due_date).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-due-date" className="text-base">
                    Tanggal Jatuh Tempo Baru <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-due-date"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-base"
                  />
                  <p className="text-xs text-gray-500">
                    Pilih tanggal baru untuk perpanjangan jatuh tempo
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsExtendDialogOpen(false);
                setExtendingKasbon(null);
                setNewDueDate("");
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExtendDueDate}
              disabled={!newDueDate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Perpanjang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
