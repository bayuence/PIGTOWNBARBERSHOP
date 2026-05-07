"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, TrendingUp, Award, Users, Calendar, Trophy, Target, Loader2, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getUsersWithPoints,
  getPointsStatistics,
  getPointTransactions,
  getBranches,
  type UserWithPoints,
  type Point,
  type Branch,
} from "@/lib/supabase"

interface PointTransaction extends Point {
  users?: {
    id: string;
    name: string;
    branch_id: string | null;
    branches: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function PointsSystem() {
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [employees, setEmployees] = useState<UserWithPoints[]>([])
  const [statistics, setStatistics] = useState({
    totalEmployees: 0,
    topPerformer: null as UserWithPoints | null,
    averagePoints: 0,
    totalPoints: 0,
  })
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersResult, statsResult, transactionsResult, branchesResult] = await Promise.all([
        getUsersWithPoints(selectedBranch),
        getPointsStatistics(selectedBranch),
        getPointTransactions(selectedBranch),
        getBranches(),
      ])

      if (usersResult.error) throw new Error(usersResult.error.message)
      if (statsResult.error) throw new Error(statsResult.error.message)
      if (transactionsResult.error) throw new Error(transactionsResult.error.message)
      if (branchesResult.error) throw new Error(branchesResult.error.message)

      setEmployees(usersResult.data)
      setStatistics(statsResult.data)
      setPointTransactions(transactionsResult.data)
      setBranches(branchesResult.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data")
      console.error("Error fetching points data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedBranch])

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
      case 2:
        return <Award className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
      default:
        return <Target className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
    }
  }

  const getPointTypeColor = (type: string) => {
    switch (type) {
      case "earned":
        return "bg-green-100 text-green-800"
      case "bonus":
        return "bg-blue-100 text-blue-800"
      case "redeemed":
        return "bg-orange-100 text-orange-800"
      case "penalty":
        return "bg-red-100 text-red-800"
      case "deducted":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPointTypeText = (type: string | null | undefined) => {
    if (!type) {
      return "Tanpa Kategori";
    }
    switch (type) {
      case "reward":
        return "Hadiah"
      case "penalty":
        return "Penalti"
      case "earned":
        return "Diperoleh"
      case "bonus":
        return "Bonus"
      case "deducted":
        return "Dikurangi"
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); 
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat data sistem poin...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header - Responsif untuk semua perangkat */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sistem Poin</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Leaderboard dan pencapaian semua karyawan</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full md:w-48 text-sm">
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
        </div>
      </div>

      {/* Summary Cards - Responsif untuk semua perangkat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm md:text-base font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{statistics.totalEmployees}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Karyawan aktif</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm md:text-base font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-yellow-600 truncate">
              {statistics.topPerformer?.name?.split(' ')[0] || "-"}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {statistics.topPerformer?.total_points?.toLocaleString() || 0} poin
            </p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm md:text-base font-medium">Rata-rata Poin</CardTitle>
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">{statistics.averagePoints.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Poin per karyawan</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm md:text-base font-medium">Total Poin</CardTitle>
            <Star className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-red-600">{statistics.totalPoints.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Semua karyawan</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4 md:space-y-6">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="leaderboard" className="flex-1 text-sm">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements" className="flex-1 text-sm">Pencapaian</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-sm">Riwayat Poin</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm md:text-base"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredEmployees.map((employee) => (
              <Card
                key={employee.id}
                className={`h-full ${(employee.rank || 0) <= 3 ? "border-2 border-yellow-200 bg-yellow-50/50" : ""}`}
              >
                <CardHeader className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 md:h-14 md:w-14">
                        <AvatarFallback className="bg-primary/10 text-primary text-base md:text-lg">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1">{getRankIcon(employee.rank || 0)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base md:text-lg truncate">{employee.name}</h3>
                      <p className="text-muted-foreground text-xs md:text-sm truncate">{employee.position || "Karyawan"}</p>
                      <p className="text-xs text-muted-foreground truncate">{employee.branches?.name || "Tanpa Cabang"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-5 pt-0">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base font-medium">Total Poin:</span>
                      <span className="font-bold text-primary text-base md:text-lg">
                        {(employee.total_points || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base font-medium">Bulan Ini:</span>
                      <span className="font-bold text-green-600 text-sm md:text-base">
                        +{(employee.monthly_points || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm md:text-base font-medium">Peringkat:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm md:text-base">#{employee.rank || 0}</span>
                      </div>
                    </div>
                    {employee.email && (
                      <div className="text-xs text-muted-foreground truncate" title={employee.email}>
                        Email: {employee.email}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Award className="h-5 w-5 md:h-6 md:w-6" />
                Pencapaian Terbaru
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Daftar karyawan berdasarkan performa poin</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {filteredEmployees.slice(0, 10).map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm md:text-base">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-base md:text-lg truncate">{employee.name}</p>
                        <p className="text-muted-foreground text-xs md:text-sm truncate">{employee.position || "Karyawan"}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-primary text-base md:text-lg">{(employee.total_points || 0).toLocaleString()} poin</p>
                      <p className="text-muted-foreground text-xs md:text-sm">Peringkat #{employee.rank}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                Riwayat Poin Semua Karyawan
              </CardTitle>
              <CardDescription className="text-sm md:text-base">Aktivitas poin terbaru dari semua karyawan</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {pointTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-base md:text-lg truncate">{transaction.users?.name || "Unknown"}</p>
                      <p className="text-muted-foreground text-sm md:text-base truncate">{transaction.description}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString("id-ID")} •{" "}
                        {transaction.users?.branches?.name || "Unknown Branch"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={`text-xs md:text-sm ${getPointTypeColor(transaction.points_type || '')}`}>
                        {getPointTypeText(transaction.points_type)}
                      </Badge>
                      <p
                        className={`font-bold text-base md:text-lg ${transaction.points_type === "penalty" || transaction.points_type === "deducted" ? "text-red-600" : "text-green-600"}`}
                      >
                        {transaction.points_type === "penalty" || transaction.points_type === "deducted" ? "-" : "+"}
                        {transaction.points_earned} poin
                      </p>
                    </div>
                  </div>
                ))}
                {pointTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm md:text-base">Belum ada transaksi poin</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
