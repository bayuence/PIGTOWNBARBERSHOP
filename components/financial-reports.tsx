"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Building2, Download, BarChart3, PieChartIcon } from "lucide-react"

export function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedBranch, setSelectedBranch] = useState("all")

  // Sample data - in real app this would come from API
  const monthlyRevenue = [
    { month: "Jan", revenue: 45000000, expenses: 28000000, profit: 17000000 },
    { month: "Feb", revenue: 52000000, expenses: 31000000, profit: 21000000 },
    { month: "Mar", revenue: 48000000, expenses: 29000000, profit: 19000000 },
    { month: "Apr", revenue: 58000000, expenses: 33000000, profit: 25000000 },
    { month: "May", revenue: 62000000, expenses: 35000000, profit: 27000000 },
    { month: "Jun", revenue: 55000000, expenses: 32000000, profit: 23000000 },
  ]

  const branchPerformance = [
    { branch: "Sudirman", revenue: 18500000, expenses: 11200000, profit: 7300000 },
    { branch: "Kemang", revenue: 15800000, expenses: 9500000, profit: 6300000 },
    { branch: "Senayan", revenue: 21200000, expenses: 12800000, profit: 8400000 },
    { branch: "Kelapa Gading", revenue: 12300000, expenses: 8100000, profit: 4200000 },
  ]

  const expenseBreakdown = [
    { name: "Gaji Karyawan", value: 25000000, color: "#E53E3E" },
    { name: "Sewa Tempat", value: 8000000, color: "#DD6B20" },
    { name: "Utilitas", value: 3500000, color: "#D69E2E" },
    { name: "Supplies", value: 2800000, color: "#38A169" },
    { name: "Peralatan", value: 1200000, color: "#3182CE" },
    { name: "Lainnya", value: 1500000, color: "#805AD5" },
  ]

  const serviceRevenue = [
    { service: "Potong Rambut", revenue: 28500000, percentage: 45 },
    { service: "Cukur Jenggot", revenue: 15200000, percentage: 24 },
    { service: "Styling", revenue: 12800000, percentage: 20 },
    { service: "Keramas", revenue: 7000000, percentage: 11 },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const currentMonthData = monthlyRevenue[monthlyRevenue.length - 1]
  const previousMonthData = monthlyRevenue[monthlyRevenue.length - 2]
  const revenueGrowth = ((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100
  const profitGrowth = ((currentMonthData.profit - previousMonthData.profit) / previousMonthData.profit) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis keuangan dan performa bisnis</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="quarter">Kuartal Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              <SelectItem value="sudirman">Cabang Sudirman</SelectItem>
              <SelectItem value="kemang">Cabang Kemang</SelectItem>
              <SelectItem value="senayan">Cabang Senayan</SelectItem>
              <SelectItem value="kelapa-gading">Cabang Kelapa Gading</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(currentMonthData.revenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />+{revenueGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(currentMonthData.expenses)}</div>
            <p className="text-xs text-muted-foreground">
              {((currentMonthData.expenses / currentMonthData.revenue) * 100).toFixed(1)}% dari pendapatan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keuntungan Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatPrice(currentMonthData.profit)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />+{profitGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Keuntungan</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {((currentMonthData.profit / currentMonthData.revenue) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Margin keuntungan bersih</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Reports */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Per Cabang</TabsTrigger>
          <TabsTrigger value="services">Per Layanan</TabsTrigger>
          <TabsTrigger value="expenses">Analisis Pengeluaran</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tren Pendapatan & Keuntungan
                </CardTitle>
                <CardDescription>Perbandingan pendapatan dan keuntungan 6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Bar dataKey="revenue" fill="#E53E3E" name="Pendapatan" />
                    <Bar dataKey="profit" fill="#38A169" name="Keuntungan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tren Pertumbuhan
                </CardTitle>
                <CardDescription>Pertumbuhan pendapatan bulanan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#E53E3E"
                      strokeWidth={3}
                      name="Pendapatan"
                      dot={{ fill: "#E53E3E" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#38A169"
                      strokeWidth={3}
                      name="Keuntungan"
                      dot={{ fill: "#38A169" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Performa Per Cabang
                </CardTitle>
                <CardDescription>Pendapatan dan keuntungan per cabang bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branch" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Bar dataKey="revenue" fill="#E53E3E" name="Pendapatan" />
                    <Bar dataKey="profit" fill="#38A169" name="Keuntungan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking Cabang</CardTitle>
                <CardDescription>Berdasarkan keuntungan bulan ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {branchPerformance
                    .sort((a, b) => b.profit - a.profit)
                    .map((branch, index) => (
                      <div key={branch.branch} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">Cabang {branch.branch}</p>
                            <p className="text-sm text-muted-foreground">
                              Margin: {((branch.profit / branch.revenue) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatPrice(branch.profit)}</p>
                          <p className="text-sm text-muted-foreground">{formatPrice(branch.revenue)} revenue</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Kontribusi Pendapatan per Layanan
                </CardTitle>
                <CardDescription>Distribusi pendapatan berdasarkan jenis layanan</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceRevenue}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#E53E3E"
                      dataKey="revenue"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {serviceRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Pendapatan Layanan</CardTitle>
                <CardDescription>Breakdown pendapatan per jenis layanan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceRevenue.map((service, index) => (
                    <div key={service.service} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{service.service}</span>
                        <span className="font-semibold">{formatPrice(service.revenue)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${service.percentage}%` }} />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{service.percentage}% dari total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Breakdown Pengeluaran
                </CardTitle>
                <CardDescription>Distribusi pengeluaran berdasarkan kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatPrice(value)}`}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analisis Pengeluaran</CardTitle>
                <CardDescription>Detail pengeluaran per kategori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((expense, index) => {
                    const percentage = (expense.value / expenseBreakdown.reduce((sum, e) => sum + e.value, 0)) * 100
                    return (
                      <div key={expense.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: expense.color }} />
                          <div>
                            <p className="font-medium">{expense.name}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% dari total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">{formatPrice(expense.value)}</p>
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
    </div>
  )
}
