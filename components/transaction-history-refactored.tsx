/**
 * ========================================
 * TRANSACTION HISTORY - REFACTORED VERSION
 * ========================================
 * 
 * This is a refactored version using custom hooks
 * Demonstrates clean code principles:
 * - Separation of concerns
 * - Reusable logic via hooks
 * - Cleaner component structure
 * - Better maintainability
 */

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Eye, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// ✅ Import custom hooks
import { useTransactions, useBranches, useRealtimeSubscription } from "@/hooks"

export function TransactionHistoryRefactored() {
  const { toast } = useToast()

  // ✅ State management - simplified
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateFilter, setDateFilter] = useState("this_month")

  // ✅ Use custom hooks for data fetching
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions 
  } = useTransactions({
    branchId: filterBranch === "all" ? undefined : filterBranch,
    limit: 100
  })

  const { 
    branches, 
    loading: branchesLoading 
  } = useBranches()

  // ✅ Real-time subscription using custom hook
  useRealtimeSubscription({
    table: 'transactions',
    event: '*',
    callback: (payload) => {
      console.log('Transaction changed:', payload)
      refetchTransactions()
    }
  })

  // ✅ Computed values using useMemo
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = !searchTerm || 
        transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesBranch = filterBranch === "all" || transaction.branch_id === filterBranch
      const matchesStatus = filterStatus === "all" || transaction.payment_status === filterStatus
      
      return matchesSearch && matchesBranch && matchesStatus
    })
  }, [transactions, searchTerm, filterBranch, filterStatus])

  const stats = useMemo(() => {
    const completed = filteredTransactions.filter(t => t.payment_status === "completed")
    const totalRevenue = completed.reduce((sum, t) => sum + (t.total_amount || 0), 0)
    
    return {
      total: filteredTransactions.length,
      completed: completed.length,
      revenue: totalRevenue
    }
  }, [filteredTransactions])

  // ✅ Helper functions
  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      refunded: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }

  // ✅ Loading state
  if (transactionsLoading || branchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-red-600" />
          <p className="text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  // ✅ Error state
  if (transactionsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {transactionsError.message}</p>
          <Button onClick={refetchTransactions}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-sm text-gray-600">Kelola dan pantau semua transaksi</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refetchTransactions}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Transaksi Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.revenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Branch Filter */}
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Cabang" />
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

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refund</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="this_week">Minggu Ini</SelectItem>
                <SelectItem value="this_month">Bulan Ini</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">No. Transaksi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Waktu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Pelanggan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Cabang</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {transaction.transaction_number}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatTime(transaction.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {transaction.customer_name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {transaction.branch_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(transaction.total_amount || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getStatusColor(transaction.payment_status || "")}>
                          {transaction.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
