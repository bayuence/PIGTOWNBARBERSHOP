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
import {
  Plus,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import CurrencyInput from "react-currency-input-field"

interface BonusPenaltyTransaction {
  id: string
  user_id: string
  transaction_id?: string
  amount: number // Changed from points_earned to amount
  category: string // Changed from points_type to category
  description: string
  status: "pending" | "approved" | "rejected"
  approved_by?: string
  approved_at?: string
  created_at: string
  user?: {
    name: string
    email: string
    position: string
  }
}

interface User {
  id: string
  name: string
  email: string
  position: string
  total_bonus?: number
  total_penalty?: number
  net_amount?: number
}


export default function PointsManagement() {
  const [transactions, setTransactions] = useState<BonusPenaltyTransaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<BonusPenaltyTransaction | null>(null)
  const [formData, setFormData] = useState({
    user_id: "",
    category: "",
    custom_amount: "",
    description: "",
  })

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    fetchData()
  }, [])

  // Fungsi fetchData yang baru dan lebih cepat
  const fetchData = async () => {
    try {
      setLoading(true);

      // Query users langsung tanpa RPC function
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, position, status")
        .eq("status", "active")
        .order("name")

      if (usersError) throw usersError;
      
      // Map ke format yang dibutuhkan
      const usersWithTotals = (usersData || []).map(user => ({
        ...user,
        total_bonus: 0,
        total_penalty: 0,
        total_points: 0
      }))
      
      setUsers(usersWithTotals || []);

      // Fetch points (using snapshot column: user_name)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("points")
        .select("*")
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      const mappedTransactions = (transactionsData || []).map((t) => ({
        id: t.id,
        user_id: t.user_id,
        transaction_id: t.transaction_id,
        amount: t.points_earned,
        category: t.points_type,
        description: t.description,
        status: "approved" as const,
        created_at: t.created_at,
        user_name: t.user_name, // Use snapshot column
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      let errorMessage = "Gagal memuat data. Terjadi kesalahan yang tidak diketahui.";

      // Cek jika error adalah objek dan punya properti 'message' (ini umum untuk error Supabase)
      if (error && typeof error === 'object' && 'message' in error) {
        // Kita ubah error.message menjadi string untuk ditampilkan
        errorMessage = String(error.message);
      }
      // Cadangan jika error-nya ternyata hanya teks biasa
      else if (typeof error === 'string') {
        errorMessage = error;
      }

      // PENTING: Trik ini memaksa console untuk menampilkan seluruh isi objek error
      console.error("Detail Error Sebenarnya:", JSON.stringify(error, null, 2));

      toast({
        title: "Error",
        description: errorMessage, // Tampilkan pesan yang lebih berguna ke pengguna
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Silakan pilih karyawan terlebih dahulu.",
        variant: "destructive",
      });
      return; // Hentikan fungsi jika karyawan kosong
    }

    if (!formData.category) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Silakan pilih kategori bonus/penalty.",
        variant: "destructive",
      });
      return; // Hentikan fungsi jika kategori kosong
    }

    try {
      let amount = Math.abs(Number(formData.custom_amount) || 0) // Ambil nilai absolut (selalu positif)

      if (formData.category === "penalty") {
        amount = amount * -1 // Jika penalty, jadikan negatif
      }

      const needsApproval = Math.abs(amount) >= 300000

      const transactionData = {
        user_id: formData.user_id,
        points_earned: amount,
        points_type: formData.category,
        description: formData.description,
      }

      if (editingTransaction) {
        const { error } = await supabase.from("points").update(transactionData).eq("id", editingTransaction.id)

        if (error) throw error
        toast({ title: "Berhasil", description: "Transaksi berhasil diperbarui" })
      } else {
        const { error } = await supabase.from("points").insert([transactionData])

        if (error) throw error
        toast({
          title: "Berhasil",
          description: needsApproval
            ? "Transaksi berhasil ditambahkan dan menunggu approval"
            : "Transaksi berhasil ditambahkan",
        })
      }

      setIsDialogOpen(false)
      setEditingTransaction(null)
      setFormData({ user_id: "", category: "", custom_amount: "", description: "" })
      fetchData()
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan transaksi",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (transaction: BonusPenaltyTransaction) => {
    setEditingTransaction(transaction)
    setFormData({
      user_id: transaction.user_id,
      category: transaction.category,
      custom_amount: transaction.amount.toString(),
      description: transaction.description,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return

    try {
      const { error } = await supabase.from("points").delete().eq("id", id)

      if (error) throw error
      toast({ title: "Berhasil", description: "Transaksi berhasil dihapus" })
      fetchData()
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({ user_id: "", category: "", custom_amount: "", description: "" })
    setEditingTransaction(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Bonus & Penalty Management</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Kelola bonus gaji dan potongan gaji karyawan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto text-sm">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Tambah Bonus/Penalty</span>
              <span className="xs:hidden">Tambah</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">{editingTransaction ? "Edit Bonus/Penalty" : "Tambah Bonus/Penalty"}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">Berikan bonus atau penalty yang akan mempengaruhi gaji karyawan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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
                        {user.name} (Net: Rp {(user.net_amount || 0).toLocaleString("id-ID")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">🎁 Reward</SelectItem>
                    <SelectItem value="penalty">⚠️ Penalty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom_amount">Jumlah (Rp)</Label>
                <CurrencyInput
                  id="custom_amount"
                  name="custom_amount"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Masukkan jumlah, contoh: 50.000"
                  value={formData.custom_amount}
                  onValueChange={(value) => {
                    setFormData({ ...formData, custom_amount: value || "" });
                  }}
                  prefix="Rp "
                  groupSeparator="."
                  decimalSeparator=","
                  decimalsLimit={0}
                />
              </div>

              <div>
                <Label htmlFor="description">Alasan Detail</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan alasan pemberian bonus/penalty secara detail"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">{editingTransaction ? "Perbarui" : "Tambah"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="salary-impact">Impact Gaji</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards - Mobile Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium">Total Karyawan</CardTitle>
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-xl md:text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium line-clamp-1">Total Bonus</CardTitle>
                <Award className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-sm md:text-2xl font-bold text-green-600 truncate">
                  Rp{" "}
                  {transactions
                    .filter((t) => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString("id-ID")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium line-clamp-1">Total Penalty</CardTitle>
                <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="text-sm md:text-2xl font-bold text-red-600 truncate">
                  Rp{" "}
                  {Math.abs(
                    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
                  ).toLocaleString("id-ID")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">Transaksi Bulan Ini</CardTitle>
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter((t) => new Date(t.created_at).getMonth() === new Date().getMonth()).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Bonus & Penalty</CardTitle>
              <CardDescription>Semua transaksi bonus dan penalty karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.user_name}</div>
                          <div className="text-sm text-muted-foreground">-</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.amount < 0 ? "destructive" : "default"}>
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount > 0 ? "+" : ""}Rp {Math.abs(transaction.amount).toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "approved"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {transaction.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {transaction.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {transaction.status}
                        </Badge>

                      </TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="w-4 h-4" />
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

        <TabsContent value="salary-impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact Terhadap Gaji</CardTitle>
              <CardDescription>Total bonus dan penalty yang akan mempengaruhi gaji karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Total Bonus</TableHead>
                    <TableHead>Total Penalty</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .sort((a, b) => (b.net_amount || 0) - (a.net_amount || 0))
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.position || "Karyawan"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            +Rp {(user.total_bonus || 0).toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            -Rp {(user.total_penalty || 0).toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold text-lg ${(user.net_amount || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {(user.net_amount || 0) >= 0 ? "+" : ""}Rp {(user.net_amount || 0).toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(user.net_amount || 0) >= 0 ? "default" : "destructive"}>
                            <DollarSign className="w-3 h-3 mr-1" />
                            {(user.net_amount || 0) >= 0 ? "Bonus" : "Penalty"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
