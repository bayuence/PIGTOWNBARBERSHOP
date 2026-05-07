"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Building2, RefreshCw, BarChart3, Activity, Users, Receipt, AlertCircle, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, PieChart, Pie } from "recharts"
import { supabase, getApprovedExpenses } from "@/lib/supabase"

// Warna modern untuk chart
const CHART_COLORS = {
  revenue: ['#6366f1', '#4f46e5'],
  transactions: ['#10b981', '#059669'],
  expenses: ['#ef4444', '#dc2626'],
  netProfit: ['#8b5cf6', '#7c3aed'],
  branches: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
}

interface OverviewAndAnalyticsProps {
  onRefreshData: () => void;
  realTimeEnabled: boolean;
}

interface EmployeePerformance {
  id: string;
  name: string;
  position: string;
  totalTransactions: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  attendanceDays: number;
  totalWorkHours: number;
  totalWorkMinutes: number;
  totalWorkSeconds: number;
}

export function OverviewAndAnalytics({ onRefreshData, realTimeEnabled }: OverviewAndAnalyticsProps) {
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [approvedExpenses, setApprovedExpenses] = useState<any[]>([])
  const [branchPerformance, setBranchPerformance] = useState<any[]>([])
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [animationKey, setAnimationKey] = useState(0)

  // Fungsi format rupiah lengkap dengan titik dan koma
  const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Setup real-time updates
  useEffect(() => {
    fetchDashboardData()

    if (realTimeEnabled) {
      const transactionsChannel = supabase
        .channel('overview-transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
          console.log('Real-time: Transaction changed, refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      const expensesChannel = supabase
        .channel('overview-expenses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
          console.log('Real-time: Expense changed, refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      const commissionsChannel = supabase
        .channel('overview-commissions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, () => {
          console.log('Real-time: Commission changed, refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      const attendanceChannel = supabase
        .channel('overview-attendance')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          console.log('Real-time: Attendance changed, refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      const transactionItemsChannel = supabase
        .channel('overview-transaction-items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_items' }, () => {
          console.log('Real-time: Transaction items changed (commission updated), refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      const commissionRulesChannel = supabase
        .channel('overview-commission-rules')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_rules' }, () => {
          console.log('Real-time: Commission rules changed, refreshing dashboard...')
          fetchDashboardData()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(transactionsChannel)
        supabase.removeChannel(expensesChannel)
        supabase.removeChannel(commissionsChannel)
        supabase.removeChannel(attendanceChannel)
        supabase.removeChannel(transactionItemsChannel)
        supabase.removeChannel(commissionRulesChannel)
      }
    }
  }, [realTimeEnabled])

  const fetchApprovedExpenses = async () => {
    try {
      const { data, error } = await getApprovedExpenses();
      if (error) return [];
      
      return (data || []).map((expense: any) => ({
        id: expense.id,
        branch_id: expense.branch_id,
        category: expense.category,
        description: expense.description,
        amount: expense.amount || 0,
        status: expense.status,
        expense_date: expense.expense_date || expense.created_at,
        notes: expense.notes,
        rejection_reason: expense.rejection_reason,
        created_at: expense.created_at,
        branch_name: expense.branches?.name || "Semua Cabang"
      }));
    } catch (error) {
      return [];
    }
  };

  const analyzeExpenseCategories = (expenses: any[]) => {
    const categoryMap = new Map<string, number>();
    expenses.forEach(expense => {
      const currentTotal = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, currentTotal + expense.amount);
    });
    return Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching dashboard data from database...')
      
      const approvedExpensesData = await fetchApprovedExpenses();
      setApprovedExpenses(approvedExpensesData);
      setExpenseCategories(analyzeExpenseCategories(approvedExpensesData));
      console.log('✅ Expenses loaded:', approvedExpensesData.length, 'items')

      const [transactionsRes, usersRes, branchesRes, pointsRes] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").eq("status", "active").order("name"),
        supabase.from("branches").select("*").eq("status", "active").order("name"),
        supabase.from("points").select("*").order("created_at", { ascending: false })
      ])

      if (transactionsRes.error) console.error('Transactions error:', transactionsRes.error)
      if (usersRes.error) console.error('Users error:', usersRes.error)
      if (branchesRes.error) console.error('Branches error:', branchesRes.error)

      const transactions = transactionsRes.data || []
      const users = usersRes.data || []
      const branches = branchesRes.data || []
      
      console.log('✅ Data loaded - Transactions:', transactions.length, '| Users:', users.length, '| Branches:', branches.length)

      const getTransactionAmount = (transaction: any) => {
        return transaction.final_amount || transaction.total_amount || transaction.subtotal || 0
      }

      const isCompletedTransaction = (transaction: any) => {
        return transaction.payment_status === "completed"
      }

      const completedTransactions = transactions.filter(isCompletedTransaction)
      const totalRevenue = completedTransactions.reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0)
      const totalExpenses = approvedExpensesData.reduce((sum: number, expense: any) => sum + expense.amount, 0)

      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      const monthlyTransactions = completedTransactions.filter((t: any) => {
        const date = new Date(t.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })

      const monthlyRevenue = monthlyTransactions.reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0)
      const monthlyExpenses = approvedExpensesData.filter((expense: any) => {
        const date = new Date(expense.expense_date || expense.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).reduce((sum: number, expense: any) => sum + expense.amount, 0)

      // Hitung branch performance
      const branchPerf = branches.map((branch: any) => {
        const branchTransactions = completedTransactions.filter((t: any) => t.branch_id === branch.id)
        const branchRevenue = branchTransactions.reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0)
        const branchExpenses = approvedExpensesData
          .filter((expense: any) => expense.branch_id === branch.id)
          .reduce((sum: number, expense: any) => sum + expense.amount, 0)
        
        const netProfit = branchRevenue - branchExpenses
        
        return {
          name: branch.name,
          revenue: branchRevenue,
          expense: branchExpenses,
          profit: Math.abs(netProfit) // Pastikan selalu positif untuk tampilan
        }
      }).sort((a: any, b: any) => b.revenue - a.revenue)

      setBranchPerformance(branchPerf); // ✅ Sekarang sudah didefinisikan

      const netProfit = totalRevenue - totalExpenses
      const monthlyNetProfit = monthlyRevenue - monthlyExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      // Data untuk grafik garis 7 hari terakhir
      const revenueChartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        
        const dayTransactions = completedTransactions.filter((t: any) => {
          const transactionDate = new Date(t.created_at)
          return transactionDate.toISOString().split('T')[0] === dateStr
        })
        
        const dayRevenue = dayTransactions.reduce((sum: number, t: any) => sum + getTransactionAmount(t), 0)
        const dayExpenses = approvedExpensesData
          .filter((expense: any) => {
            const expenseDate = new Date(expense.expense_date || expense.created_at)
            return expenseDate.toISOString().split('T')[0] === dateStr
          })
          .reduce((sum: number, expense: any) => sum + expense.amount, 0)
        
        const dayNetProfit = dayRevenue - dayExpenses
        
        return {
          date: date.toLocaleDateString("id-ID", { day: '2-digit', month: 'short' }),
          revenue: dayRevenue,
          expenses: dayExpenses,
          netProfit: Math.abs(dayNetProfit) // Pastikan selalu positif untuk tampilan grafik
        }
      })

      const stats = {
        totalRevenue,
        monthlyRevenue,
        totalTransactions: completedTransactions.length,
        monthlyTransactions: monthlyTransactions.length,
        totalExpenses,
        monthlyExpenses,
        netProfit,
        monthlyNetProfit,
        profitMargin
      }

      console.log('📊 Dashboard Stats:', {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
        transactions: completedTransactions.length,
        branches: branchPerf.length
      })

      setDashboardStats(stats)
      setRevenueData(revenueChartData)
      setAnimationKey(prev => prev + 1)

      // Fetch Employee Performance
      console.log('👥 Fetching employee performance...')
      await fetchEmployeePerformance(transactions, approvedExpensesData)
      
      console.log('✅ Dashboard data fetch completed successfully!')

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  };

  const fetchEmployeePerformance = async (transactions: any[], expenses: any[]) => {
    try {
      // Fetch all employees with more detailed info
      const { data: employees, error: employeesError } = await supabase
        .from("users")
        .select("id, name, position, branch_id")
        .eq("status", "active")
        .order("name")

      if (employeesError) {
        console.error('Error fetching employees:', employeesError)
        return
      }

      if (!employees || employees.length === 0) {
        console.log('No active employees found')
        setEmployeePerformance([])
        return
      }

      // Fetch attendance - PENTING: gunakan user_id, bukan employee_id
      // Ambil data lengkap termasuk check_in_time, check_out_time, total_hours
      let attendance: any[] = []
      try {
        // Query 1: Coba dengan status filter
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("*")

        if (attendanceError) {
          console.error('❌ Attendance fetch failed:', attendanceError)
          console.log('⚠️ Trying alternative query...')
        } else {
          attendance = attendanceData || []
          console.log('✅ Attendance loaded:', attendance.length, 'total records')
          
          // Debug: tampilkan sample data
          if (attendance.length > 0) {
            console.log('📋 Sample attendance record:', {
              columns: Object.keys(attendance[0]),
              sample: attendance[0]
            })
            
            // Group by user_id untuk debug
            const userCounts = attendance.reduce((acc: any, record: any) => {
              const userId = record.user_id
              acc[userId] = (acc[userId] || 0) + 1
              return acc
            }, {})
            console.log('👥 Attendance by user_id:', userCounts)
          }
        }
      } catch (err) {
        console.error('⚠️ Could not fetch attendance:', err)
      }

      // Get current month range for filtering
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Fetch transaction items untuk komisi (gunakan barber_id, bukan employee_id)
      // PENTING: Ambil semua commission_status untuk tracking
      const { data: transactionItems, error: itemsError } = await supabase
        .from("transaction_items")
        .select("barber_id, commission_amount, commission_status, created_at")

      if (itemsError) {
        console.log('⚠️ Transaction items error:', itemsError.message)
      }

      const allTransactionItems = transactionItems || []
      
      // Log breakdown commission status
      const commissionBreakdown = {
        total: allTransactionItems.length,
        credited: allTransactionItems.filter(i => i.commission_status === 'credited').length,
        pending: allTransactionItems.filter(i => i.commission_status === 'pending').length,
        no_commission: allTransactionItems.filter(i => i.commission_status === 'no_commission').length
      }
      console.log('✅ Transaction items loaded:', commissionBreakdown)

      // Debug: Log all employee IDs untuk compare dengan attendance
      console.log('👥 Total Employees:', employees.length, '| Sample:', employees.slice(0, 3).map(e => ({ id: e.id, name: e.name })))

      // Calculate performance for each employee
      const performanceData: EmployeePerformance[] = employees.map(emp => {
        // PENTING: Gunakan server_id untuk transaksi (karyawan yang melayani)
        const empTransactions = transactions.filter(t => 
          t.server_id === emp.id && 
          t.payment_status === "completed"
        )
        const totalTransactions = empTransactions.length
        
        // Calculate total revenue from employee's transactions
        const totalRevenue = empTransactions.reduce((sum, t) => {
          const amount = t.final_amount || t.total_amount || t.subtotal || 0
          return sum + amount
        }, 0)

        // Calculate total commission dari transaction_items (gunakan barber_id)
        // Hitung commission yang sudah credited (dibayar)
        const empCommissionItemsCredited = allTransactionItems.filter(item => 
          item.barber_id === emp.id && 
          item.commission_status === "credited"
        )
        const totalCommission = empCommissionItemsCredited.reduce((sum, item) => 
          sum + (item.commission_amount || 0), 0
        )

        // Hitung commission yang masih pending (belum dibayar)
        const empCommissionItemsPending = allTransactionItems.filter(item => 
          item.barber_id === emp.id && 
          item.commission_status === "pending"
        )
        const pendingCommission = empCommissionItemsPending.reduce((sum, item) => 
          sum + (item.commission_amount || 0), 0
        )

        // Count unique attendance days - PENTING: gunakan user_id, bukan employee_id
        const empAttendance = attendance.filter(a => a.user_id === emp.id)
        
        console.log(`🔍 Checking attendance for ${emp.name} (${emp.id}):`, {
          totalRecords: empAttendance.length,
          records: empAttendance.map(a => ({
            date: a.date,
            check_in: a.check_in_time,
            check_out: a.check_out_time,
            status: a.status
          }))
        })
        
        // Get unique dates to avoid counting multiple check-ins on same day
        const uniqueDates = new Set(
          empAttendance.map(a => {
            const date = a.date || a.check_in_time
            return date ? new Date(date).toISOString().split('T')[0] : null
          }).filter(Boolean)
        )
        const attendanceDays = uniqueDates.size

        // Calculate total work hours, minutes, seconds
        let totalSeconds = 0
        empAttendance.forEach(a => {
          if (a.check_in_time && a.check_out_time) {
            const checkIn = new Date(a.check_in_time)
            const checkOut = new Date(a.check_out_time)
            const diffMs = checkOut.getTime() - checkIn.getTime()
            const diffSeconds = Math.floor(diffMs / 1000)
            
            // Kurangi break duration jika ada (dalam menit)
            const breakSeconds = (a.break_duration || 0) * 60
            totalSeconds += Math.max(0, diffSeconds - breakSeconds)
          } else if (a.total_hours) {
            // Jika ada total_hours langsung dari database
            totalSeconds += a.total_hours * 3600
          }
        })

        const totalWorkHours = Math.floor(totalSeconds / 3600)
        const totalWorkMinutes = Math.floor((totalSeconds % 3600) / 60)
        const totalWorkSeconds = totalSeconds % 60

        // Debug log untuk employee dengan transaksi atau kehadiran
        if (totalTransactions > 0 || totalRevenue > 0 || totalCommission > 0 || pendingCommission > 0 || attendanceDays > 0) {
          console.log(`👤 ${emp.name}:`, {
            transactions: totalTransactions,
            revenue: totalRevenue,
            commissionCredited: totalCommission,
            commissionPending: pendingCommission,
            attendance: {
              days: attendanceDays,
              hours: totalWorkHours,
              minutes: totalWorkMinutes,
              seconds: totalWorkSeconds,
              records: empAttendance.length
            },
            commissionItems: {
              credited: empCommissionItemsCredited.length,
              pending: empCommissionItemsPending.length
            }
          })
        }

        return {
          id: emp.id,
          name: emp.name,
          position: emp.position || 'Staff',
          totalTransactions,
          totalRevenue,
          totalCommission,
          pendingCommission,
          attendanceDays,
          totalWorkHours,
          totalWorkMinutes,
          totalWorkSeconds
        }
      })

      // Sort by total revenue (descending) - highest performer first
      performanceData.sort((a, b) => {
        if (b.totalRevenue !== a.totalRevenue) {
          return b.totalRevenue - a.totalRevenue
        }
        if (b.totalTransactions !== a.totalTransactions) {
          return b.totalTransactions - a.totalTransactions
        }
        return b.attendanceDays - a.attendanceDays
      })

      // Summary log
      const activeEmployees = performanceData.filter(e => e.totalTransactions > 0 || e.totalRevenue > 0)
      const totalAttendanceDays = performanceData.reduce((sum, e) => sum + e.attendanceDays, 0)
      const totalWorkHours = performanceData.reduce((sum, e) => sum + e.totalWorkHours, 0)
      
      console.log('📊 Employee Performance Summary:', {
        total: performanceData.length,
        withTransactions: activeEmployees.length,
        totalTransactions: performanceData.reduce((sum, e) => sum + e.totalTransactions, 0),
        totalRevenue: performanceData.reduce((sum, e) => sum + e.totalRevenue, 0),
        totalCommissionCredited: performanceData.reduce((sum, e) => sum + e.totalCommission, 0),
        totalCommissionPending: performanceData.reduce((sum, e) => sum + e.pendingCommission, 0),
        totalAttendanceDays,
        totalWorkHours: `${totalWorkHours} hours`
      })

      setEmployeePerformance(performanceData)

    } catch (error) {
      console.error('Error fetching employee performance:', error)
      setEmployeePerformance([])
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Overview & Analytics</h2>
            <p className="text-muted-foreground">Memuat data real-time...</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchDashboardData(); onRefreshData(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pantau performa bisnis Anda secara real-time
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { fetchDashboardData(); onRefreshData(); }} 
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards - 4 Cards dengan Info Jelas */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue Card */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Pendapatan
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatRupiah(dashboardStats.totalRevenue)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {dashboardStats.totalTransactions} transaksi
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Pengeluaran
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatRupiah(dashboardStats.totalExpenses)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    Operasional
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit Card */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Net Profit
                  </p>
                  <p className={`text-2xl font-bold ${dashboardStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(dashboardStats.netProfit)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Margin: {dashboardStats.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${dashboardStats.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} flex items-center justify-center`}>
                  {dashboardStats.netProfit >= 0 ? (
                    <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Card */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Pendapatan Bulan Ini
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatRupiah(dashboardStats.monthlyRevenue)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dashboardStats.monthlyTransactions} transaksi
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Charts - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Line Chart - GRAFIK GARIS YANG JELAS */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Tren Pendapatan & Pengeluaran (7 Hari)
            </CardTitle>
            <CardDescription>
              Grafik garis menampilkan perbandingan harian yang mudah dipahami
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => formatRupiah(value)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Pendapatan"
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Pengeluaran"
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netProfit" 
                    name="Net Profit"
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data transaksi</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Performance Bar Chart - GRAFIK BATANG YANG JELAS */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-500" />
              Performa per Cabang
            </CardTitle>
            <CardDescription>
              Perbandingan pendapatan, pengeluaran, dan profit setiap cabang
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => formatRupiah(value)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar dataKey="revenue" name="Pendapatan" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data cabang</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table - Detail lengkap */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-500" />
            Performa Cabang Detail
          </CardTitle>
          <CardDescription>
            Analisis lengkap kinerja setiap cabang - transaksi, pendapatan, pengeluaran, profit, dan efisiensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {branchPerformance.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="text-left p-3 font-semibold whitespace-nowrap">Ranking</th>
                        <th className="text-left p-3 font-semibold whitespace-nowrap">Nama Cabang</th>
                        <th className="text-center p-3 font-semibold whitespace-nowrap">Total Transaksi</th>
                        <th className="text-right p-3 font-semibold whitespace-nowrap">Total Pendapatan</th>
                        <th className="text-right p-3 font-semibold whitespace-nowrap">Total Pengeluaran</th>
                        <th className="text-right p-3 font-semibold whitespace-nowrap">Net Profit</th>
                        <th className="text-center p-3 font-semibold whitespace-nowrap">Profit Margin</th>
                        <th className="text-right p-3 font-semibold whitespace-nowrap">Avg/Transaksi</th>
                        <th className="text-center p-3 font-semibold whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {branchPerformance.map((branch, index) => {
                        const profitMargin = branch.revenue > 0 
                          ? ((branch.revenue - branch.expense) / branch.revenue * 100).toFixed(1)
                          : '0';
                        const avgPerTransaction = branch.revenue > 0 && branch.revenue > 0
                          ? branch.revenue / Math.max(1, Math.round(branch.revenue / 50000)) // estimasi jumlah transaksi
                          : 0;
                        const netProfit = branch.revenue - branch.expense;
                        const isProfitable = netProfit > 0;
                        
                        return (
                          <tr 
                            key={branch.name}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="p-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-slate-400' : 
                                index === 2 ? 'bg-orange-600' : 
                                'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {branch.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Cabang {index + 1}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {Math.round(branch.revenue / 50000)}
                                </span>
                                <span className="text-xs text-slate-500">transaksi</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {formatRupiah(branch.revenue)}
                                </span>
                                <span className="text-xs text-slate-500">pendapatan</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {formatRupiah(branch.expense)}
                                </span>
                                <span className="text-xs text-slate-500">pengeluaran</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-bold text-lg ${
                                  isProfitable 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {formatRupiah(netProfit)}
                                </span>
                                <span className="text-xs text-slate-500">profit</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                                parseFloat(profitMargin) >= 30 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : parseFloat(profitMargin) >= 15
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : parseFloat(profitMargin) > 0
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                <span className="font-bold text-sm">{profitMargin}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {formatRupiah(avgPerTransaction)}
                                </span>
                                <span className="text-xs text-slate-500">rata-rata</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {isProfitable ? (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <ArrowUpRight className="h-3 w-3" />
                                  <span className="font-semibold text-xs">Profitable</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  <ArrowDownRight className="h-3 w-3" />
                                  <span className="font-semibold text-xs">Loss</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Total Cabang
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {branchPerformance.length}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Cabang aktif
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-semibold text-green-800 dark:text-green-300">
                      Total Pendapatan
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatRupiah(branchPerformance.reduce((sum, b) => sum + b.revenue, 0))}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Dari semua cabang
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                      Total Pengeluaran
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatRupiah(branchPerformance.reduce((sum, b) => sum + b.expense, 0))}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Dari semua cabang
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                      Net Profit Total
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatRupiah(branchPerformance.reduce((sum, b) => sum + (b.revenue - b.expense), 0))}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Profit keseluruhan
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-3 border-t">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keterangan Profit Margin:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Sangat Baik (≥30%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Baik (15-29%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Cukup (1-14%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Rugi (≤0%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Belum Ada Data Cabang
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Data akan muncul setelah ada transaksi di cabang
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Performance - FULL WIDTH DI BAWAH */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
              Performa Karyawan Detail
            </CardTitle>
            <CardDescription>
              Analisis lengkap kinerja setiap karyawan - transaksi, komisi, kehadiran, dan produktivitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employeePerformance.length > 0 ? (
              <div className="space-y-4">
                {/* Performance Table */}
                <div className="border rounded-lg overflow-hidden relative">
                  {/* Gradient indicator kanan */}
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none z-[5]"></div>
                  
                  <div 
                    className="overflow-x-auto overflow-y-auto max-h-[400px] table-scroll-container"
                  >
                    <table className="w-full text-sm" style={{ minWidth: '1400px' }}>
                      <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="text-left p-3 font-semibold whitespace-nowrap sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 border-r border-slate-300 dark:border-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Karyawan</th>
                          <th className="text-center p-3 font-semibold whitespace-nowrap">Transaksi</th>
                          <th className="text-right p-3 font-semibold whitespace-nowrap">Total Penjualan</th>
                          <th className="text-right p-3 font-semibold whitespace-nowrap">Komisi Dibayar</th>
                          <th className="text-right p-3 font-semibold whitespace-nowrap">Komisi Pending</th>
                          <th className="text-center p-3 font-semibold min-w-[160px]">
                            <div className="whitespace-nowrap">Kehadiran</div>
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5 whitespace-nowrap">(Hari + Total Jam Kerja)</div>
                          </th>
                          <th className="text-right p-3 font-semibold whitespace-nowrap">Avg/Transaksi</th>
                          <th className="text-center p-3 font-semibold whitespace-nowrap">Produktivitas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {employeePerformance.map((emp, index) => {
                          const productivity = emp.attendanceDays > 0 
                            ? (emp.totalTransactions / emp.attendanceDays).toFixed(1) 
                            : '0';
                          const avgTransaction = emp.totalTransactions > 0 
                            ? emp.totalRevenue / emp.totalTransactions 
                            : 0;
                          
                          return (
                            <tr 
                              key={emp.id} 
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 ${
                                    index === 0 ? 'bg-yellow-500' : 
                                    index === 1 ? 'bg-slate-400' : 
                                    index === 2 ? 'bg-orange-600' : 
                                    'bg-blue-500'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="min-w-[120px]">
                                    <p className="font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                      {emp.name}
                                    </p>
                                    <p className="text-xs text-slate-500 whitespace-nowrap">
                                      {emp.position}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {emp.totalTransactions}
                                  </span>
                                  <span className="text-xs text-slate-500">transaksi</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {formatRupiah(emp.totalRevenue)}
                                  </span>
                                  <span className="text-xs text-slate-500">penjualan</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    {formatRupiah(emp.totalCommission)}
                                  </span>
                                  <span className="text-xs text-slate-500">dibayar</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  {emp.pendingCommission > 0 ? (
                                    <>
                                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {formatRupiah(emp.pendingCommission)}
                                      </span>
                                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        pending
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-slate-400">
                                        {formatRupiah(0)}
                                      </span>
                                      <span className="text-xs text-slate-400">-</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                {emp.attendanceDays > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <div className="space-y-1">
                                      {/* Hari Hadir */}
                                      <div className="flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                        <span className="font-bold text-blue-700 dark:text-blue-300 text-base">
                                          {emp.attendanceDays}
                                        </span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400">hari</span>
                                      </div>
                                      {/* Total Jam Kerja */}
                                      <div className="bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                        <div className="flex items-center justify-center gap-1 text-xs font-mono">
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {emp.totalWorkHours}
                                          </span>
                                          <span className="text-slate-500 text-[10px]">jam</span>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {emp.totalWorkMinutes}
                                          </span>
                                          <span className="text-slate-500 text-[10px]">menit</span>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {emp.totalWorkSeconds}
                                          </span>
                                          <span className="text-slate-500 text-[10px]">detik</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span className="text-slate-400 text-sm">-</span>
                                    <span className="text-xs text-slate-400">belum hadir</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                                    {formatRupiah(avgTransaction)}
                                  </span>
                                  <span className="text-xs text-slate-500">rata-rata</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex flex-col items-center">
                                  {emp.totalTransactions === 0 ? (
                                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                      Belum Ada
                                    </div>
                                  ) : (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      parseFloat(productivity) >= 5 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : parseFloat(productivity) >= 3 
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {productivity}
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-500 mt-1">
                                    {emp.totalTransactions === 0 ? 'data' : 'trx/hari'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance Indicators Legend */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Produktivitas Tinggi (≥5 transaksi/hari)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Produktivitas Sedang (3-4 transaksi/hari)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Produktivitas Rendah (&lt;3 transaksi/hari)
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Komisi Pending
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Komisi yang masih pending akan otomatis update setelah diatur di menu "Atur Komisi" atau menu "Transaksi". Data akan langsung ter-update secara real-time.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            Kehadiran Detail
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            Menampilkan jumlah hari hadir + total jam kerja lengkap (jam, menit, detik). Dihitung dari check-in hingga check-out dikurangi waktu istirahat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Users className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Belum Ada Data Performa Karyawan
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Data akan muncul setelah ada transaksi yang diselesaikan oleh karyawan
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold mb-2">
                      📋 Yang akan ditampilkan:
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• Total transaksi per karyawan</li>
                      <li>• Total penjualan yang dihasilkan</li>
                      <li>• Komisi yang diterima</li>
                      <li>• Kehadiran dan produktivitas</li>
                      <li>• Rata-rata nilai transaksi</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
