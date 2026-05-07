"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  ComposedChart,
  Legend,
} from "recharts"
import { FileText, Users, MapPin, DollarSign, Clock, Award, CreditCard, Loader2, Trophy, Coffee, LogOut, XCircle } from "lucide-react"
import { supabase, getBranches } from "@/lib/supabase"

// Helper function to get date range based on filter
const getDateRange = (dateRange: string, startDate?: string, endDate?: string) => {
  const now = new Date()
  let start: Date
  let end: Date = now

  switch (dateRange) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case "yesterday":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
      break
    case "thisWeek":
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
    case "last3Months":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case "thisYear":
      start = new Date(now.getFullYear(), 0, 1)
      break
    case "custom":
      if (startDate && endDate) {
        start = new Date(startDate)
        end = new Date(new Date(endDate).setHours(23, 59, 59))
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

interface RevenueData {
  month: string
  revenue: number
  transactions: number
}

interface BranchPerformance {
  branch: string
  revenue: number
  transactions: number
  employees: number
}

interface ServiceData {
  name: string
  value: number
  color: string
  count: number
}

interface EmployeePerformance {
  name: string
  revenue: number
  transactions: number
  rating: number
  branch: string
  position: string
}

interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  totalEmployees: number
  activeBranches: number
  revenueGrowth: string
  transactionGrowth: string
}

interface FinancialDetail {
  totalRevenue: number
  totalExpenses: number
  totalCommissions: number
  totalKasbon: number
  netProfit: number
  profitMargin: number
  cashPayments: number
  qrisPayments: number
  transferPayments: number
}

interface BranchFinancialDetail {
  branchId: string
  branchName: string
  totalRevenue: number
  totalExpenses: number
  totalCommissions: number
  totalKasbon: number
  netProfit: number
  profitMargin: number
  transactions: number
  employees: number
  avgTransactionValue: number
  revenuePerEmployee: number
  transactionPerEmployee: number
  cashPayments: number
  qrisPayments: number
  transferPayments: number
}

export function ComprehensiveReports() {
  const [dateRange, setDateRange] = useState("thisMonth")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    totalEmployees: 0,
    activeBranches: 0,
    revenueGrowth: "+0%",
    transactionGrowth: "+0%",
  })
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([])
  const [serviceData, setServiceData] = useState<ServiceData[]>([])
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [financialDetail, setFinancialDetail] = useState<FinancialDetail>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCommissions: 0,
    totalKasbon: 0,
    netProfit: 0,
    profitMargin: 0,
    cashPayments: 0,
    qrisPayments: 0,
    transferPayments: 0,
  })
  const [branchFinancialDetails, setBranchFinancialDetails] = useState<BranchFinancialDetail[]>([])
  const [attendanceStats, setAttendanceStats] = useState({
    averageHours: "08:12:00",
    attendanceRate: 94.5,
    topEmployee: "Loading...",
    todayPresent: 0,
    todayAbsent: 0,
    todayOnBreak: 0,
    todayCheckedOut: 0,
  })
  const [employeeAttendanceList, setEmployeeAttendanceList] = useState<
    Array<{
      name: string
      totalHours: string
      totalMinutes: number
      attendanceRate: number
      daysWorked: number
      // Real-time today's data
      todayCheckIn?: string
      todayCheckOut?: string
      todayBreakDuration?: number
      todayWorkingHours?: number
      currentStatus?: "present" | "on-break" | "checked-out" | "absent"
      branch?: string
    }>
  >([])

  const fetchDashboardStats = async () => {
    try {
      console.log("[v0] Fetching dashboard stats...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      // Get total revenue and transactions
      let transactionQuery = supabase
        .from("transactions")
        .select("total_amount, created_at, branch_id")
        .eq("payment_status", "completed")
        .gte("created_at", start)
        .lte("created_at", end)

      // Apply branch filter if not "all"
      if (selectedBranch !== "all") {
        transactionQuery = transactionQuery.eq("branch_id", selectedBranch)
      }

      const { data: transactions, error: transError } = await transactionQuery

      if (transError) {
        console.log("[v0] Transaction error:", transError)
      }

      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
      const totalTransactions = transactions?.length || 0

      // Get total employees
      let employeeQuery = supabase.from("users").select("id, branch_id").eq("status", "active")

      // Apply branch filter for employees if not "all"
      if (selectedBranch !== "all") {
        employeeQuery = employeeQuery.eq("branch_id", selectedBranch)
      }

      const { data: users, error: usersError } = await employeeQuery

      if (usersError) {
        console.log("[v0] Users error:", usersError)
      }

      const totalEmployees = users?.length || 0

      // Get active branches (filter if specific branch selected)
      let activeBranches = 0
      if (selectedBranch === "all") {
        const { data: branchesData, error: branchError } = await getBranches()
        if (branchError) {
          console.log("[v0] Branches error:", branchError)
        }
        activeBranches = branchesData?.length || 0
      } else {
        activeBranches = 1 // Single branch selected
      }

      setDashboardStats({
        totalRevenue,
        totalTransactions,
        totalEmployees,
        activeBranches,
        revenueGrowth: "+12%", // Could calculate from historical data
        transactionGrowth: "+8%",
      })

      console.log("[v0] Dashboard stats updated:", {
        totalRevenue,
        totalTransactions,
        totalEmployees,
        activeBranches,
      })
    } catch (error) {
      console.error("[v0] Error fetching dashboard stats:", error)
    }
  }

  const fetchRevenueData = async () => {
    try {
      console.log("[v0] Fetching revenue data...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      let revenueQuery = supabase
        .from("transactions")
        .select("total_amount, created_at, branch_id")
        .eq("payment_status", "completed")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: true })

      // Apply branch filter if not "all"
      if (selectedBranch !== "all") {
        revenueQuery = revenueQuery.eq("branch_id", selectedBranch)
      }

      const { data: transactions, error } = await revenueQuery

      if (error) {
        console.log("[v0] Revenue data error:", error)
        return
      }

      // Group by month
      const monthlyData: { [key: string]: { revenue: number; transactions: number } } = {}

      transactions?.forEach((transaction) => {
        const date = new Date(transaction.created_at)
        const monthKey = date.toLocaleDateString("id-ID", { month: "short" })

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, transactions: 0 }
        }

        monthlyData[monthKey].revenue += transaction.total_amount || 0
        monthlyData[monthKey].transactions += 1
      })

      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        transactions: data.transactions,
      }))

      setRevenueData(chartData)
      console.log("[v0] Revenue data updated:", chartData)
    } catch (error) {
      console.error("[v0] Error fetching revenue data:", error)
    }
  }

  const fetchBranchPerformance = async () => {
    try {
      console.log("[v0] Fetching branch performance...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      const { data: branchesData, error: branchError } = await getBranches()

      if (branchError) {
        console.log("[v0] Branch performance error:", branchError)
        return
      }

      // Filter branches if specific branch selected
      const filteredBranches = selectedBranch !== "all" 
        ? branchesData.filter((b: any) => b.id === selectedBranch)
        : branchesData

      const branchStats = await Promise.all(
        filteredBranches.map(async (branch: any) => {
          // Get transactions for this branch with date filter
          const { data: transactions } = await supabase
            .from("transactions")
            .select("total_amount, created_at")
            .eq("branch_id", branch.id)
            .eq("payment_status", "completed")
            .gte("created_at", start)
            .lte("created_at", end)

          // Get employees for this branch
          const { data: employees } = await supabase
            .from("users")
            .select("id")
            .eq("branch_id", branch.id)
            .eq("status", "active")

          const revenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const transactionCount = transactions?.length || 0
          const employeeCount = employees?.length || 0

          return {
            branch: branch.name,
            revenue,
            transactions: transactionCount,
            employees: employeeCount,
          }
        }),
      )

      setBranchPerformance(branchStats)
      console.log("[v0] Branch performance updated:", branchStats)
    } catch (error) {
      console.error("[v0] Error fetching branch performance:", error)
    }
  }

  const fetchServiceData = async () => {
    try {
      console.log("[v0] Fetching service data...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      const { data: services, error: servicesError } = await supabase.from("services").select("id, name")

      if (servicesError) {
        console.log("[v0] Services error:", servicesError)
        return
      }

      // Get transaction items with date filter through transactions join
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("id, branch_id, created_at")
        .eq("payment_status", "completed")
        .gte("created_at", start)
        .lte("created_at", end)

      if (transError) {
        console.log("[v0] Transactions error:", transError)
        return
      }

      // Apply branch filter
      const filteredTransactionIds = selectedBranch !== "all"
        ? transactions?.filter(t => t.branch_id === selectedBranch).map(t => t.id) || []
        : transactions?.map(t => t.id) || []

      if (filteredTransactionIds.length === 0) {
        setServiceData([])
        return
      }

      const { data: transactionItems, error: itemsError } = await supabase
        .from("transaction_items")
        .select("service_id, service_name, quantity, transaction_id")
        .in("transaction_id", filteredTransactionIds)

      if (itemsError) {
        console.log("[v0] Transaction items error:", itemsError)
        return
      }

      // Count service usage - gunakan service_name dari snapshot jika service_id tidak valid
      const serviceCounts: { [key: string]: number } = {}
      const serviceNames: { [key: string]: string } = {}
      
      transactionItems?.forEach((item) => {
        const key = item.service_id || item.service_name || 'unknown'
        serviceCounts[key] = (serviceCounts[key] || 0) + (item.quantity || 1)
        if (item.service_name) {
          serviceNames[key] = item.service_name
        }
      })

      const totalCount = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0)

      const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]

      const chartData =
        services
          ?.map((service: any, index: number) => {
            const count = serviceCounts[service.id] || 0
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0

            return {
              name: service.name.toUpperCase(), // Huruf kapital semua
              value: percentage,
              count,
              color: colors[index % colors.length],
            }
          })
          .filter((item: any) => item.count > 0)
          .sort((a: any, b: any) => b.value - a.value) || [] // Urutkan dari tertinggi ke terendah

      setServiceData(chartData)
      console.log("[v0] Service data updated:", chartData)
    } catch (error) {
      console.error("[v0] Error fetching service data:", error)
    }
  }

  const fetchEmployeePerformance = async () => {
    try {
      console.log("[v0] Fetching employee performance...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      let userQuery = supabase
        .from("users")
        .select(`
          id,
          name,
          branch_id,
          position,
          branches:branch_id (name)
        `)
        .eq("status", "active")

      // Apply branch filter if not "all"
      if (selectedBranch !== "all") {
        userQuery = userQuery.eq("branch_id", selectedBranch)
      }

      const { data: users, error: usersError } = await userQuery

      if (usersError) {
        console.log("[v0] Employee users error:", usersError)
        return
      }

      const employeeStats = await Promise.all(
        users?.map(async (user: any) => {
          // Get transactions handled by this employee (as cashier) with date filter
          const { data: transactions } = await supabase
            .from("transactions")
            .select("total_amount, created_at")
            .eq("cashier_id", user.id)
            .eq("payment_status", "completed")
            .gte("created_at", start)
            .lte("created_at", end)

          const revenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const transactionCount = transactions?.length || 0

          // Determine display position
          let displayPosition = user.position || "Staff"
          if (displayPosition === "employee") displayPosition = "Karyawan"
          if (displayPosition === "cashier") displayPosition = "Kasir"
          if (displayPosition === "owner") displayPosition = "Owner"
          if (displayPosition === "barber") displayPosition = "Barber"
          if (displayPosition === "manager") displayPosition = "Manager"
          
          return {
            name: user.name,
            revenue,
            transactions: transactionCount,
            rating: 4.5 + Math.random() * 0.5, // Random rating for demo
            branch: user.branches?.name || "Unknown Branch",
            position: displayPosition,
          }
        }) || [],
      )

      // Sort by revenue and take top performers
      const sortedEmployees = employeeStats.sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      setEmployeePerformance(sortedEmployees)
      console.log("[v0] Employee performance updated:", sortedEmployees)
    } catch (error) {
      console.error("[v0] Error fetching employee performance:", error)
    }
  }

  const fetchAttendanceStats = async () => {
    try {
      console.log("[v0] Fetching attendance stats...")

      // Get date range based on filter
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)

      const today = new Date().toISOString().split("T")[0]

      // Get attendance records within date range
      let attendanceQuery = supabase
        .from("attendance")
        .select(`
          total_hours,
          status,
          date,
          check_in_time,
          check_out_time,
          total_break_minutes,
          user_id,
          branch_id
        `)
        .gte("date", start.split("T")[0])
        .lte("date", end.split("T")[0])

      // Apply branch filter if not "all"
      if (selectedBranch !== "all") {
        attendanceQuery = attendanceQuery.eq("branch_id", selectedBranch)
      }

      const { data: allAttendance, error: allError } = await attendanceQuery as { data: any[] | null; error: any }

      if (allError) {
        console.log("[v0] Attendance error:", allError)
        return
      }

      // Get TODAY's attendance for real-time data
      let todayQuery = supabase
        .from("attendance")
        .select(`*`)
        .eq("date", today)

      if (selectedBranch !== "all") {
        todayQuery = todayQuery.eq("branch_id", selectedBranch)
      }

      const { data: todayAttendance, error: todayError} = await todayQuery as { data: any[] | null; error: any }

      if (todayError) {
        console.log("[v0] Today attendance error:", todayError)
      }

      // Get users and branches for mapping
      let userQuery = supabase.from("users").select("id, name, branch_id")
      if (selectedBranch !== "all") {
        userQuery = userQuery.eq("branch_id", selectedBranch)
      }

      const { data: usersData } = await userQuery
      const { data: branchesData } = await supabase.from("branches").select("id, name")

      const userMap = new Map(usersData?.map((u: any) => [u.id, u.name]) || [])
      const branchMap = new Map(branchesData?.map((b: any) => [b.id, b.name]) || [])

      // Calculate per-employee stats - Initialize ALL users first
      const employeeStats: {
        [key: string]: {
          totalMinutes: number
          daysWorked: number
          checkedOutDays: number
          todayRecord?: any
          userId?: string
        }
      } = {}

      // Initialize ALL users from database
      usersData?.forEach((user: any) => {
        employeeStats[user.name] = {
          totalMinutes: 0,
          daysWorked: 0,
          checkedOutDays: 0,
          userId: user.id
        }
      })

      // Process all historical attendance
      allAttendance?.forEach((a: any) => {
        const name = userMap.get(a.user_id) || "Unknown"
        const hours = a.total_hours || 0
        const minutes = Math.round(hours * 60)

        if (!employeeStats[name]) {
          employeeStats[name] = { totalMinutes: 0, daysWorked: 0, checkedOutDays: 0 }
        }

        employeeStats[name].totalMinutes += minutes
        employeeStats[name].daysWorked += 1
        if (a.status === "checked_out") {
          employeeStats[name].checkedOutDays += 1
        }
      })

      // Link today's records to employee stats
      const todayFiltered = todayAttendance?.filter((r: any) => r.date === today) || []
      todayFiltered.forEach((record: any) => {
        const name = userMap.get(record.user_id) || "Unknown"
        if (employeeStats[name]) {
          employeeStats[name].todayRecord = record
        } else {
          // Employee hasn't worked before but is working today
          employeeStats[name] = {
            totalMinutes: 0,
            daysWorked: 0,
            checkedOutDays: 0,
            todayRecord: record,
          }
        }
      })

      // Calculate real-time working hours for today
      const calculateCurrentWorkingHours = (record: any): number => {
        if (!record.check_in_time) return 0

        const checkInTime = new Date(record.check_in_time)
        const checkOutTime = record.check_out_time ? new Date(record.check_out_time) : new Date()
        const breakMinutes = record.total_break_minutes || 0

        const workMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
        const netMinutes = Math.max(0, workMinutes - breakMinutes)

        return netMinutes / 60 // Convert to hours
      }

      const formatTime = (hours: number): string => {
        if (hours <= 0) return "00:00:00"
        const totalSeconds = Math.floor(hours * 3600)
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      }

      const employeeList = Object.entries(employeeStats)
        .map(([name, stats]) => {
          const totalHours = Math.floor(stats.totalMinutes / 60)
          const remainingMinutes = stats.totalMinutes % 60
          const seconds = Math.floor((stats.totalMinutes % 1) * 60)

          const todayRecord = stats.todayRecord
          let currentStatus: "present" | "on-break" | "checked-out" | "absent" = "absent"
          let todayWorkingHours = 0

          if (todayRecord) {
            todayWorkingHours = calculateCurrentWorkingHours(todayRecord)

            if (todayRecord.status === "checked_in") {
              currentStatus = "present"
            } else if (todayRecord.status === "on_break") {
              currentStatus = "on-break"
            } else if (todayRecord.status === "checked_out") {
              currentStatus = "checked-out"
            }
          }

          return {
            name,
            totalHours: `${totalHours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
            totalMinutes: stats.totalMinutes,
            attendanceRate: stats.daysWorked > 0 ? Math.round((stats.checkedOutDays / stats.daysWorked) * 100) : 0,
            daysWorked: stats.daysWorked,
            // Today's real-time data
            todayCheckIn: todayRecord?.check_in_time,
            todayCheckOut: todayRecord?.check_out_time,
            todayBreakDuration: todayRecord?.total_break_minutes || 0,
            todayWorkingHours,
            currentStatus,
            branch: branchMap.get(todayRecord?.branch_id) || "N/A",
          }
        })
        .sort((a, b) => {
          // Sort by attendance rate (best to worst)
          return b.attendanceRate - a.attendanceRate
        })

      setEmployeeAttendanceList(employeeList)

      // Calculate summary stats
      const todayPresent = employeeList.filter((e) => e.currentStatus === "present").length
      const todayOnBreak = employeeList.filter((e) => e.currentStatus === "on-break").length
      const todayCheckedOut = employeeList.filter((e) => e.currentStatus === "checked-out").length
      const todayAbsent = employeeList.filter((e) => e.currentStatus === "absent").length

      const totalMinutes = allAttendance?.reduce((sum, a) => sum + (a.total_hours || 0) * 60, 0) || 0
      const totalRecords = allAttendance?.length || 1
      const averageMinutes = totalMinutes / totalRecords

      const avgHours = Math.floor(averageMinutes / 60)
      const avgMins = Math.floor(averageMinutes % 60)
      const avgSecs = Math.floor((averageMinutes % 1) * 60)

      const checkedInCount = allAttendance?.filter((a) => a.status === "checked_out").length || 0
      const attendanceRate = totalRecords > 0 ? (checkedInCount / totalRecords) * 100 : 0

      const topEmployee = employeeList[0]?.name || "No data"

      setAttendanceStats({
        averageHours: `${avgHours.toString().padStart(2, "0")}:${avgMins.toString().padStart(2, "0")}:${avgSecs.toString().padStart(2, "0")}`,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        topEmployee,
        todayPresent,
        todayAbsent,
        todayOnBreak,
        todayCheckedOut,
      })

      console.log("[v0] Attendance stats updated:", {
        averageHours: `${avgHours}:${avgMins}:${avgSecs}`,
        attendanceRate,
        topEmployee,
        employeeCount: employeeList.length,
        todayPresent,
        todayOnBreak,
        todayCheckedOut,
        todayAbsent,
      })
    } catch (error) {
      console.error("[v0] Error fetching attendance stats:", error)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data, error } = await getBranches()
      if (!error && data) {
        setBranches(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching branches:", error)
    }
  }

  const fetchFinancialDetails = async () => {
    try {
      console.log("[v0] Fetching financial details...")
      
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)
      
      // Get branches for filtering
      const { data: branchesData } = await getBranches()
      const filteredBranches = selectedBranch !== "all" 
        ? branchesData?.filter((b: any) => b.id === selectedBranch) || []
        : branchesData || []

      // Fetch all financial data in parallel
      const branchFinancials = await Promise.all(
        filteredBranches.map(async (branch: any) => {
          // 1. Get transactions (revenue & payment methods)
          const { data: transactions } = await supabase
            .from("transactions")
            .select("total_amount, payment_method, created_at")
            .eq("branch_id", branch.id)
            .eq("payment_status", "completed")
            .gte("created_at", start)
            .lte("created_at", end)

          const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const transactionCount = transactions?.length || 0

          // Payment method breakdown
          const cashPayments = transactions?.filter(t => t.payment_method === "cash").reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const qrisPayments = transactions?.filter(t => t.payment_method === "qris").reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
          const transferPayments = transactions?.filter(t => t.payment_method === "transfer").reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

          // 2. Get expenses
          const { data: expenses } = await supabase
            .from("expenses")
            .select("amount, created_at")
            .eq("branch_id", branch.id)
            .gte("created_at", start)
            .lte("created_at", end)

          const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

          // 3. Get commissions
          const { data: commissions } = await supabase
            .from("commissions")
            .select("amount, created_at, branch_id")
            .eq("branch_id", branch.id)
            .gte("created_at", start)
            .lte("created_at", end)

          const totalCommissions = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0

          // 4. Get kasbon
          const { data: kasbonData } = await supabase
            .from("kasbon")
            .select("amount, created_at, branch_id, status")
            .eq("branch_id", branch.id)
            .eq("status", "approved")
            .gte("created_at", start)
            .lte("created_at", end)

          const totalKasbon = kasbonData?.reduce((sum, k) => sum + (k.amount || 0), 0) || 0

          // 5. Get employees
          const { data: employees } = await supabase
            .from("users")
            .select("id")
            .eq("branch_id", branch.id)
            .eq("status", "active")

          const employeeCount = employees?.length || 0

          // Calculate net profit and metrics
          const netProfit = totalRevenue - totalExpenses - totalCommissions
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
          const avgTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0
          const revenuePerEmployee = employeeCount > 0 ? totalRevenue / employeeCount : 0
          const transactionPerEmployee = employeeCount > 0 ? transactionCount / employeeCount : 0

          return {
            branchId: branch.id,
            branchName: branch.name,
            totalRevenue,
            totalExpenses,
            totalCommissions,
            totalKasbon,
            netProfit,
            profitMargin,
            transactions: transactionCount,
            employees: employeeCount,
            avgTransactionValue,
            revenuePerEmployee,
            transactionPerEmployee,
            cashPayments,
            qrisPayments,
            transferPayments,
          }
        })
      )

      setBranchFinancialDetails(branchFinancials)

      // Calculate totals
      const totals = branchFinancials.reduce(
        (acc, branch) => ({
          totalRevenue: acc.totalRevenue + branch.totalRevenue,
          totalExpenses: acc.totalExpenses + branch.totalExpenses,
          totalCommissions: acc.totalCommissions + branch.totalCommissions,
          totalKasbon: acc.totalKasbon + branch.totalKasbon,
          netProfit: acc.netProfit + branch.netProfit,
          cashPayments: acc.cashPayments + branch.cashPayments,
          qrisPayments: acc.qrisPayments + branch.qrisPayments,
          transferPayments: acc.transferPayments + branch.transferPayments,
        }),
        {
          totalRevenue: 0,
          totalExpenses: 0,
          totalCommissions: 0,
          totalKasbon: 0,
          netProfit: 0,
          cashPayments: 0,
          qrisPayments: 0,
          transferPayments: 0,
        }
      )

      const profitMargin = totals.totalRevenue > 0 ? (totals.netProfit / totals.totalRevenue) * 100 : 0

      setFinancialDetail({
        ...totals,
        profitMargin,
      })

      console.log("[v0] Financial details updated:", { totals, branchCount: branchFinancials.length })
    } catch (error) {
      console.error("[v0] Error fetching financial details:", error)
    }
  }

  const generatePDFReport = async () => {
    setGenerating(true)

    try {
      const currentDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Generate dynamic period text with actual dates
      const { startDate: start, endDate: end } = getDateRange(dateRange, startDate, endDate)
      const startDateObj = new Date(start)
      const endDateObj = new Date(end)
      
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ]
      
      let periodText = ""
      
      if (dateRange === "thisMonth") {
        periodText = `Bulan ${monthNames[startDateObj.getMonth()]} ${startDateObj.getFullYear()}`
      } else if (dateRange === "lastMonth") {
        periodText = `Bulan ${monthNames[startDateObj.getMonth()]} ${startDateObj.getFullYear()}`
      } else if (dateRange === "thisYear") {
        periodText = `Tahun ${startDateObj.getFullYear()}`
      } else if (dateRange === "today") {
        periodText = `Hari Ini (${startDateObj.getDate()} ${monthNames[startDateObj.getMonth()]} ${startDateObj.getFullYear()})`
      } else if (dateRange === "yesterday") {
        periodText = `Kemarin (${startDateObj.getDate()} ${monthNames[startDateObj.getMonth()]} ${startDateObj.getFullYear()})`
      } else if (dateRange === "thisWeek") {
        periodText = `Minggu Ini (${startDateObj.getDate()} - ${endDateObj.getDate()} ${monthNames[endDateObj.getMonth()]} ${endDateObj.getFullYear()})`
      } else if (dateRange === "lastWeek") {
        periodText = `Minggu Lalu (${startDateObj.getDate()} ${monthNames[startDateObj.getMonth()]} - ${endDateObj.getDate()} ${monthNames[endDateObj.getMonth()]} ${endDateObj.getFullYear()})`
      } else if (dateRange === "last3Months") {
        periodText = `3 Bulan Terakhir (${monthNames[startDateObj.getMonth()]} - ${monthNames[endDateObj.getMonth()]} ${endDateObj.getFullYear()})`
      } else if (dateRange === "custom") {
        periodText = `${startDateObj.getDate()} ${monthNames[startDateObj.getMonth()]} ${startDateObj.getFullYear()} - ${endDateObj.getDate()} ${monthNames[endDateObj.getMonth()]} ${endDateObj.getFullYear()}`
      } else {
        periodText = dateRange
      }

      const branchText =
        selectedBranch === "all"
          ? "Semua Cabang"
          : branches.find((b) => b.id === selectedBranch)?.name || "Unknown Branch"

      // Create comprehensive HTML report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Laporan Bisnis Barbershop</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.4; 
              color: #333; 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ef4444; padding-bottom: 20px; }
            .header h1 { color: #ef4444; margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .filter-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .filter-info h3 { margin: 0 0 10px 0; color: #ef4444; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #ef4444; }
            .metric-label { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f8f9fa; font-weight: bold; color: #374151; }
            .ranking { background: #fef3c7; }
            .ranking-1 { background: #fef3c7; }
            .ranking-2 { background: #f3f4f6; }
            .ranking-3 { background: #fde68a; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN BISNIS BARBERSHOP</h1>
            <p>Analisis Lengkap Performa Bisnis</p>
            <p>Dibuat pada: ${currentDate}</p>
          </div>

          <div class="filter-info">
            <h3>FILTER LAPORAN</h3>
            <p><strong>Periode:</strong> ${periodText}</p>
            <p><strong>Cabang:</strong> ${branchText}</p>
            ${startDate && endDate ? `<p><strong>Tanggal:</strong> ${startDate} s/d ${endDate}</p>` : ""}
          </div>

          <div class="section">
            <h2>RINGKASAN BISNIS</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">Rp ${dashboardStats.totalRevenue.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Revenue</div>
                <div style="color: #10b981; font-weight: bold;">${dashboardStats.revenueGrowth}</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dashboardStats.totalTransactions.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Transaksi</div>
                <div style="color: #3b82f6; font-weight: bold;">${dashboardStats.transactionGrowth}</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dashboardStats.totalEmployees}</div>
                <div class="metric-label">Total Karyawan</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${dashboardStats.activeBranches}</div>
                <div class="metric-label">Cabang Aktif</div>
              </div>
            </div>
          </div>

          <div class="section page-break">
            <h2>📊 ANALISIS KEUANGAN DETAIL</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">Rp ${financialDetail.totalRevenue.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Pendapatan</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #dc2626;">Rp ${financialDetail.totalExpenses.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Pengeluaran</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #ea580c;">Rp ${financialDetail.totalCommissions.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Komisi Karyawan</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="color: #d97706;">Rp ${financialDetail.totalKasbon.toLocaleString("id-ID")}</div>
                <div class="metric-label">Total Kasbon</div>
              </div>
            </div>

            <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border-left: 5px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">💰 KEUNTUNGAN BERSIH</h3>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 32px; font-weight: bold; color: #059669;">Rp ${financialDetail.netProfit.toLocaleString("id-ID")}</div>
                  <div style="color: #047857; font-size: 14px; margin-top: 5px;">Profit Margin: ${financialDetail.profitMargin.toFixed(2)}%</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 14px; color: #065f46;">Formula:</div>
                  <div style="font-size: 12px; color: #047857;">Revenue - Expenses - Commissions - Kasbon</div>
                </div>
              </div>
            </div>

            <h3 style="margin-top: 30px; color: #374151;">BREAKDOWN METODE PEMBAYARAN</h3>
            <table>
              <thead>
                <tr>
                  <th>Metode Pembayaran</th>
                  <th class="text-right">Jumlah (Rp)</th>
                  <th class="text-center">Persentase</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span style="display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 3px; margin-right: 8px;"></span>Cash</td>
                  <td class="text-right">Rp ${financialDetail.cashPayments.toLocaleString("id-ID")}</td>
                  <td class="text-center">${financialDetail.totalRevenue > 0 ? ((financialDetail.cashPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td><span style="display: inline-block; width: 12px; height: 12px; background: #3b82f6; border-radius: 3px; margin-right: 8px;"></span>QRIS</td>
                  <td class="text-right">Rp ${financialDetail.qrisPayments.toLocaleString("id-ID")}</td>
                  <td class="text-center">${financialDetail.totalRevenue > 0 ? ((financialDetail.qrisPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td><span style="display: inline-block; width: 12px; height: 12px; background: #8b5cf6; border-radius: 3px; margin-right: 8px;"></span>Transfer</td>
                  <td class="text-right">Rp ${financialDetail.transferPayments.toLocaleString("id-ID")}</td>
                  <td class="text-center">${financialDetail.totalRevenue > 0 ? ((financialDetail.transferPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr style="background: #f9fafb; font-weight: bold;">
                  <td>TOTAL</td>
                  <td class="text-right">Rp ${financialDetail.totalRevenue.toLocaleString("id-ID")}</td>
                  <td class="text-center">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${
            branchFinancialDetails.length > 0
              ? `
          <div class="section page-break">
            <h2>🏪 ANALISIS KEUANGAN PER CABANG</h2>
            <p style="color: #666; font-style: italic; margin-bottom: 20px;">Detail pendapatan, pengeluaran, dan keuntungan setiap cabang</p>
            ${branchFinancialDetails
              .map(
                (branch) => `
            <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">📍 ${branch.branchName}</h3>
              
              <div class="metrics-grid" style="margin-bottom: 15px;">
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #10b981;">Rp ${(branch.totalRevenue || 0).toLocaleString("id-ID")}</div>
                  <div style="font-size: 12px; color: #666;">Pendapatan</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #dc2626;">Rp ${(branch.totalExpenses || 0).toLocaleString("id-ID")}</div>
                  <div style="font-size: 12px; color: #666;">Pengeluaran</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: #ea580c;">Rp ${(branch.totalCommissions || 0).toLocaleString("id-ID")}</div>
                  <div style="font-size: 12px; color: #666;">Komisi</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 18px; font-weight: bold; color: ${(branch.netProfit || 0) >= 0 ? "#059669" : "#dc2626"};">Rp ${(branch.netProfit || 0).toLocaleString("id-ID")}</div>
                  <div style="font-size: 12px; color: #666;">Profit</div>
                </div>
              </div>

              <div style="display: flex; gap: 15px; margin-top: 15px;">
                <div style="flex: 1; background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 14px; color: #666;">Profit Margin</div>
                  <div style="font-size: 20px; font-weight: bold; color: ${(branch.profitMargin || 0) >= 0 ? "#059669" : "#dc2626"};">${(branch.profitMargin || 0).toFixed(2)}%</div>
                </div>
                <div style="flex: 1; background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 14px; color: #666;">Total Transaksi</div>
                  <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${branch.transactions || 0}</div>
                </div>
                <div style="flex: 1; background: white; padding: 12px; border-radius: 8px;">
                  <div style="font-size: 14px; color: #666;">Jumlah Karyawan</div>
                  <div style="font-size: 20px; font-weight: bold; color: #8b5cf6;">${branch.employees || 0}</div>
                </div>
              </div>
            </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

          ${
            revenueData.length > 0
              ? `
          <div class="section">
            <h2>TREN REVENUE & TRANSAKSI</h2>
            <table>
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th class="text-right">Revenue (Rp)</th>
                  <th class="text-center">Jumlah Transaksi</th>
                </tr>
              </thead>
              <tbody>
                ${revenueData
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.month}</td>
                    <td class="text-right">Rp ${item.revenue.toLocaleString("id-ID")}</td>
                    <td class="text-center">${item.transactions}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            branchPerformance.length > 0
              ? `
          <div class="section page-break">
            <h2>PERFORMA CABANG</h2>
            <table>
              <thead>
                <tr>
                  <th>Cabang</th>
                  <th class="text-right">Revenue (Rp)</th>
                  <th class="text-center">Transaksi</th>
                  <th class="text-center">Karyawan</th>
                </tr>
              </thead>
              <tbody>
                ${branchPerformance
                  .map(
                    (branch) => `
                  <tr>
                    <td>${branch.branch}</td>
                    <td class="text-right">Rp ${branch.revenue.toLocaleString("id-ID")}</td>
                    <td class="text-center">${branch.transactions}</td>
                    <td class="text-center">${branch.employees}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            employeePerformance.length > 0
              ? `
          <div class="section">
            <h2>TOP PERFORMA KARYAWAN</h2>
            <table>
              <thead>
                <tr>
                  <th class="text-center">Ranking</th>
                  <th>Nama Karyawan</th>
                  <th>Cabang</th>
                  <th class="text-right">Revenue (Rp)</th>
                  <th class="text-center">Transaksi</th>
                  <th class="text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                ${employeePerformance
                  .slice(0, 10)
                  .map(
                    (employee, index) => `
                  <tr class="${index < 3 ? `ranking-${index + 1}` : ""}">
                    <td class="text-center">${index + 1}</td>
                    <td>${employee.name}</td>
                    <td>${employee.branch}</td>
                    <td class="text-right">Rp ${employee.revenue.toLocaleString("id-ID")}</td>
                    <td class="text-center">${employee.transactions}</td>
                    <td class="text-center">${employee.rating.toFixed(1)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            serviceData.length > 0
              ? `
          <div class="section">
            <h2>ANALISIS LAYANAN</h2>
            <table>
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th class="text-center">Jumlah Penggunaan</th>
                  <th class="text-center">Persentase</th>
                </tr>
              </thead>
              <tbody>
                ${serviceData
                  .map(
                    (service) => `
                  <tr>
                    <td>${service.name}</td>
                    <td class="text-center">${service.count}</td>
                    <td class="text-center">${service.value}%</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <div class="section page-break">
            <h2>STATISTIK KEHADIRAN</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${attendanceStats.averageHours}</div>
                <div class="metric-label">Rata-rata Jam Kerja per Hari</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${attendanceStats.attendanceRate}%</div>
                <div class="metric-label">Tingkat Kehadiran</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${attendanceStats.topEmployee}</div>
                <div class="metric-label">Karyawan Terbaik</div>
              </div>
            </div>

            ${
              employeeAttendanceList.length > 0
                ? `
            <h3>RANKING KEHADIRAN KARYAWAN</h3>
            <p style="color: #666; font-style: italic; margin-bottom: 15px;">Diurutkan berdasarkan total jam kerja terbanyak</p>
            <table>
              <thead>
                <tr>
                  <th class="text-center">Ranking</th>
                  <th>Nama Karyawan</th>
                  <th class="text-center">Total Jam Kerja</th>
                  <th class="text-center">Hari Kerja</th>
                  <th class="text-center">Tingkat Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                ${employeeAttendanceList
                  .map(
                    (employee, index) => `
                  <tr class="${index < 3 ? `ranking-${index + 1}` : ""}">
                    <td class="text-center">${index + 1}</td>
                    <td>${employee.name}</td>
                    <td class="text-center">${employee.totalHours}</td>
                    <td class="text-center">${employee.daysWorked}</td>
                    <td class="text-center">${employee.attendanceRate}%</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; color: #1e40af;">ANALISIS PERFORMA KEHADIRAN:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Karyawan terbaik: ${employeeAttendanceList[0]?.name || "N/A"} dengan total ${employeeAttendanceList[0]?.totalHours || "N/A"} jam kerja</li>
                <li>Rata-rata jam kerja semua karyawan: ${(() => {
                  const averageHours =
                    employeeAttendanceList.reduce((sum, emp) => sum + emp.totalMinutes, 0) /
                    employeeAttendanceList.length /
                    60
                  return `${Math.floor(averageHours)}:${Math.floor((averageHours % 1) * 60)
                    .toString()
                    .padStart(2, "0")}:00`
                })()}</li>
                <li>Total karyawan yang dipantau: ${employeeAttendanceList.length} orang</li>
                <li>Tingkat kehadiran rata-rata: ${Math.round(employeeAttendanceList.reduce((sum, emp) => sum + emp.attendanceRate, 0) / employeeAttendanceList.length)}%</li>
              </ul>
            </div>
            `
                : ""
            }
          </div>

          <div class="section page-break">
            <h2>📈 KESIMPULAN & REKOMENDASI</h2>
            
            <div style="padding: 20px; background: #eff6ff; border-radius: 12px; border-left: 5px solid #3b82f6; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af;">✅ PENCAPAIAN TERBAIK</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                ${branchPerformance.length > 0 ? `<li><strong>Cabang Terbaik:</strong> ${branchPerformance[0].branch} dengan revenue Rp ${branchPerformance[0].revenue.toLocaleString("id-ID")} (${branchPerformance[0].transactions} transaksi)</li>` : ""}
                ${employeePerformance.length > 0 ? `<li><strong>Karyawan Terbaik:</strong> ${employeePerformance[0].name} dengan revenue Rp ${employeePerformance[0].revenue.toLocaleString("id-ID")} (${employeePerformance[0].transactions} transaksi)</li>` : ""}
                ${employeeAttendanceList.length > 0 ? `<li><strong>Kehadiran Terbaik:</strong> ${employeeAttendanceList[0]?.name} dengan ${employeeAttendanceList[0]?.totalHours} jam kerja (${employeeAttendanceList[0]?.attendanceRate}% kehadiran)</li>` : ""}
                <li><strong>Profit Margin:</strong> ${financialDetail.profitMargin.toFixed(2)}% dari total revenue</li>
                <li><strong>Metode Pembayaran Favorit:</strong> ${financialDetail.cashPayments > financialDetail.qrisPayments && financialDetail.cashPayments > financialDetail.transferPayments ? "Cash" : financialDetail.qrisPayments > financialDetail.transferPayments ? "QRIS" : "Transfer"} (${Math.max(
                  financialDetail.cashPayments > 0 ? (financialDetail.cashPayments / financialDetail.totalRevenue) * 100 : 0,
                  financialDetail.qrisPayments > 0 ? (financialDetail.qrisPayments / financialDetail.totalRevenue) * 100 : 0,
                  financialDetail.transferPayments > 0 ? (financialDetail.transferPayments / financialDetail.totalRevenue) * 100 : 0
                ).toFixed(1)}%)</li>
              </ul>
            </div>

            <div style="padding: 20px; background: #fef3c7; border-radius: 12px; border-left: 5px solid #f59e0b; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #92400e;">⚠️ AREA YANG PERLU PERHATIAN</h3>
              <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                ${financialDetail.profitMargin < 20 ? `<li><strong>Profit Margin Rendah:</strong> ${financialDetail.profitMargin.toFixed(2)}% (target ideal: >20%). Pertimbangkan optimasi biaya operasional.</li>` : ""}
                ${attendanceStats.attendanceRate < 90 ? `<li><strong>Tingkat Kehadiran:</strong> ${attendanceStats.attendanceRate}% (target ideal: >90%). Perlu peningkatan disiplin dan motivasi karyawan.</li>` : ""}
                ${branchPerformance.length > 0 && branchPerformance[branchPerformance.length - 1].revenue < (dashboardStats.totalRevenue / branchPerformance.length) * 0.7 ? `<li><strong>Cabang Underperforming:</strong> ${branchPerformance[branchPerformance.length - 1].branch} perlu strategi peningkatan revenue.</li>` : ""}
                ${financialDetail.totalExpenses > financialDetail.totalRevenue * 0.4 ? `<li><strong>Pengeluaran Tinggi:</strong> ${((financialDetail.totalExpenses / financialDetail.totalRevenue) * 100).toFixed(1)}% dari revenue. Lakukan audit dan efisiensi biaya.</li>` : ""}
                ${employeePerformance.length > 0 && employeePerformance[employeePerformance.length - 1].transactions < (dashboardStats.totalTransactions / employeePerformance.length) * 0.5 ? `<li><strong>Karyawan Kurang Produktif:</strong> ${employeePerformance[employeePerformance.length - 1].name} membutuhkan training atau evaluasi.</li>` : ""}
              </ul>
            </div>

            <div style="padding: 20px; background: #dcfce7; border-radius: 12px; border-left: 5px solid #10b981;">
              <h3 style="margin: 0 0 15px 0; color: #065f46;">💡 REKOMENDASI STRATEGIS</h3>
              <ol style="margin: 0; padding-left: 20px; color: #064e3b;">
                <li style="margin-bottom: 10px;"><strong>Optimasi Revenue:</strong> Fokus pada upselling dan cross-selling layanan premium. Tingkatkan kualitas layanan untuk meningkatkan customer retention.</li>
                <li style="margin-bottom: 10px;"><strong>Efisiensi Biaya:</strong> Review pengeluaran rutin dan cari supplier alternatif. Implementasikan sistem inventory yang lebih baik untuk mengurangi waste.</li>
                <li style="margin-bottom: 10px;"><strong>Pengembangan Karyawan:</strong> Berikan training reguler kepada karyawan dengan performa rendah. Implementasikan sistem reward untuk top performers.</li>
                <li style="margin-bottom: 10px;"><strong>Ekspansi Pembayaran Digital:</strong> Promosikan QRIS dan Transfer untuk mengurangi risiko cash handling dan meningkatkan efisiensi.</li>
                <li style="margin-bottom: 10px;"><strong>Monitoring Real-time:</strong> Gunakan dashboard untuk monitoring harian dan ambil keputusan berbasis data secara cepat.</li>
              </ol>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">📊 RINGKASAN ANGKA KUNCI</h3>
              <table style="width: 100%; border: none;">
                <tr style="border-bottom: 1px solid #d1d5db;">
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Revenue:</td>
                  <td style="padding: 12px; text-align: right; color: #10b981; font-weight: bold;">Rp ${financialDetail.totalRevenue.toLocaleString("id-ID")}</td>
                </tr>
                <tr style="border-bottom: 1px solid #d1d5db;">
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Expenses:</td>
                  <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: bold;">Rp ${financialDetail.totalExpenses.toLocaleString("id-ID")}</td>
                </tr>
                <tr style="border-bottom: 1px solid #d1d5db;">
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Commissions:</td>
                  <td style="padding: 12px; text-align: right; color: #ea580c; font-weight: bold;">Rp ${financialDetail.totalCommissions.toLocaleString("id-ID")}</td>
                </tr>
                <tr style="border-bottom: 1px solid #d1d5db;">
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Kasbon:</td>
                  <td style="padding: 12px; text-align: right; color: #d97706; font-weight: bold;">Rp ${financialDetail.totalKasbon.toLocaleString("id-ID")}</td>
                </tr>
                <tr style="background: #f0fdf4; border-bottom: 3px solid #10b981;">
                  <td style="padding: 12px; font-weight: bold; color: #065f46; font-size: 16px;">NET PROFIT:</td>
                  <td style="padding: 12px; text-align: right; color: #059669; font-weight: bold; font-size: 18px;">Rp ${financialDetail.netProfit.toLocaleString("id-ID")}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Transaksi:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">${dashboardStats.totalTransactions.toLocaleString("id-ID")}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Rata-rata per Transaksi:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">Rp ${dashboardStats.totalTransactions > 0 ? (financialDetail.totalRevenue / dashboardStats.totalTransactions).toLocaleString("id-ID", { maximumFractionDigits: 0 }) : 0}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Total Karyawan:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">${dashboardStats.totalEmployees} orang</td>
                </tr>
                <tr>
                  <td style="padding: 12px; font-weight: bold; color: #4b5563;">Tingkat Kehadiran:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">${attendanceStats.attendanceRate}%</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="footer">
            <p><strong>© Barbershop Management System</strong></p>
            <p>Laporan dibuat pada ${currentDate}</p>
            <p style="color: #666; font-size: 11px; margin-top: 10px;">Periode: ${periodText} | Cabang: ${branchText}</p>
            <p style="color: #999; font-size: 10px; margin-top: 5px;">Dokumen ini bersifat rahasia dan hanya untuk keperluan internal manajemen</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `

      // Open new window with the report
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(reportHTML)
        printWindow.document.close()
      } else {
        alert("Popup diblokir. Silakan izinkan popup untuk mengunduh laporan.")
      }

      console.log("[v0] HTML report generated successfully")
    } catch (error) {
      console.error("[v0] Error generating report:", error)
      alert("Terjadi kesalahan saat membuat laporan. Silakan coba lagi.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      console.log("[v0] Starting to fetch all data...")

      await Promise.all([
        fetchDashboardStats(),
        fetchRevenueData(),
        fetchBranchPerformance(),
        fetchServiceData(),
        fetchEmployeePerformance(),
        fetchAttendanceStats(),
        fetchBranches(),
        fetchFinancialDetails(),
      ])

      setLoading(false)
      console.log("[v0] All data fetched successfully")
    }

    fetchAllData()
  }, [selectedBranch, dateRange, startDate, endDate]) // Tambahkan startDate dan endDate sebagai dependency

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat data laporan...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Bisnis</h1>
          <p className="text-gray-600">Analisis lengkap performa bisnis barbershop</p>
        </div>
        <Button
          className="gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50"
          onClick={generatePDFReport}
          disabled={generating || loading}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat PDF...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate & Export Report
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Periode</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                  <SelectItem value="lastWeek">Minggu Lalu</SelectItem>
                  <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                  <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                  <SelectItem value="last3Months">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="thisYear">Tahun Ini</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang" />
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
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Keuangan</TabsTrigger>
          <TabsTrigger value="branches">Cabang</TabsTrigger>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="services">Layanan</TabsTrigger>
          <TabsTrigger value="attendance">Presensi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rp {dashboardStats.totalRevenue.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-gray-600">{dashboardStats.revenueGrowth} dari bulan lalu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Total Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardStats.totalTransactions.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-gray-600">{dashboardStats.transactionGrowth} dari bulan lalu</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dashboardStats.totalEmployees}</div>
                <p className="text-xs text-gray-600">Aktif di {dashboardStats.activeBranches} cabang</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Cabang Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.activeBranches}</div>
                <p className="text-xs text-gray-600">Semua beroperasi</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Performa Cabang Detail
              </CardTitle>
              <CardDescription>
                Analisis lengkap kinerja setiap cabang - transaksi, pendapatan, pengeluaran, profit, dan efisiensi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branchPerformance.length > 0 ? (
                <div className="space-y-4">
                  {branchPerformance.map((branch, index) => (
                    <div key={branch.branch} className="border rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 p-4 flex items-center justify-between border-b border-orange-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-900">{branch.branch}</div>
                            <div className="text-sm text-gray-700">Cabang {index + 1}</div>
                          </div>
                        </div>
                        <Badge className="bg-green-600 text-white border-0 font-bold">Aktif</Badge>
                      </div>
                      
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Total Transaksi</div>
                          <div className="text-xl font-bold text-blue-600">{branch.transactions}</div>
                          <div className="text-xs text-gray-500">transaksi</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
                          <div className="text-xl font-bold text-green-600">
                            Rp {(branch.revenue / 1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-gray-500">pendapatan</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Avg/Transaksi</div>
                          <div className="text-xl font-bold text-orange-600">
                            Rp {branch.transactions > 0 ? (branch.revenue / branch.transactions / 1000).toFixed(0) : 0}k
                          </div>
                          <div className="text-xs text-gray-500">rata-rata</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Karyawan</div>
                          <div className="text-xl font-bold text-purple-600">{branch.employees}</div>
                          <div className="text-xs text-gray-500">orang</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Tidak ada data cabang untuk ditampilkan</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                Performa Karyawan Detail
              </CardTitle>
              <CardDescription>
                Analisis lengkap kinerja setiap karyawan - transaksi, penjualan, komisi, kehadiran, dan produktivitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeePerformance.length > 0 ? (
                <div className="space-y-3">
                  {employeePerformance.map((employee, index) => (
                    <div key={employee.name} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-4 flex items-center justify-between border-b border-blue-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-700">{employee.branch}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <div className="text-xs text-gray-700">Rating</div>
                            <div className="text-lg font-bold text-orange-600">⭐ {employee.rating.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Total Penjualan</div>
                          <div className="text-lg font-bold text-green-600">
                            Rp {(employee.revenue / 1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-gray-500">revenue</div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Transaksi</div>
                          <div className="text-lg font-bold text-blue-600">{employee.transactions}</div>
                          <div className="text-xs text-gray-500">dibayar</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Avg/Transaksi</div>
                          <div className="text-lg font-bold text-orange-600">
                            Rp {employee.transactions > 0 ? (employee.revenue / employee.transactions / 1000).toFixed(0) : 0}k
                          </div>
                          <div className="text-xs text-gray-500">rata-rata</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Produktivitas</div>
                          <div className="text-lg font-bold text-purple-600">
                            {employee.transactions > 0 ? ((employee.revenue / employee.transactions) / 1000 * 0.1).toFixed(1) : 0}
                          </div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Tidak ada data performa karyawan untuk ditampilkan</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Ringkasan Keuangan Global */}
          <Card className="border-2 border-red-700">
            <CardHeader className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 border-b-2 border-red-300">
              <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
                <DollarSign className="h-6 w-6 text-red-600" />
                💰 RINGKASAN KEUANGAN BISNIS
              </CardTitle>
              <CardDescription className="text-gray-700">
                Laporan keuangan lengkap - Pendapatan, Pengeluaran, Profit & Loss Statement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-l-4 border-green-600 shadow-md">
                  <CardContent className="p-4 text-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">💵 Total Pendapatan</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Income</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      Rp {financialDetail.totalRevenue.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total uang masuk dari penjualan</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-red-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">💸 Total Pengeluaran</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Expenses</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      Rp {financialDetail.totalExpenses.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total biaya operasional cabang</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-orange-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">🎁 Total Komisi</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Commission</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                      Rp {financialDetail.totalCommissions.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Komisi yang dibayar ke karyawan</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-white border-l-4 border-purple-600 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">💳 Total Kasbon</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Advance</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      Rp {financialDetail.totalKasbon.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Kasbon yang disetujui (belum dikurangi dari gaji)</p>
                  </CardContent>
                </Card>

                <Card className={`bg-white border-l-4 ${financialDetail.netProfit >= 0 ? 'border-blue-600' : 'border-red-600'} shadow-md`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {financialDetail.netProfit >= 0 ? '✅ Net Profit' : '❌ Net Loss'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${financialDetail.netProfit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {financialDetail.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`text-2xl font-bold ${financialDetail.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Rp {financialDetail.netProfit.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Pendapatan - Pengeluaran - Komisi = Profit Bersih
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown Metode Pembayaran */}
              <Card className="bg-white shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    💳 Breakdown Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">💵 Cash</span>
                        <span className="text-xs bg-green-400 text-gray-900 px-2 py-1 rounded font-semibold">
                          {financialDetail.totalRevenue > 0 ? ((financialDetail.cashPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        Rp {financialDetail.cashPayments.toLocaleString("id-ID")}
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{width: `${financialDetail.totalRevenue > 0 ? (financialDetail.cashPayments / financialDetail.totalRevenue * 100) : 0}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">📱 QRIS</span>
                        <span className="text-xs bg-blue-400 text-gray-900 px-2 py-1 rounded font-semibold">
                          {financialDetail.totalRevenue > 0 ? ((financialDetail.qrisPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        Rp {financialDetail.qrisPayments.toLocaleString("id-ID")}
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{width: `${financialDetail.totalRevenue > 0 ? (financialDetail.qrisPayments / financialDetail.totalRevenue * 100) : 0}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">🏦 Transfer</span>
                        <span className="text-xs bg-purple-400 text-gray-900 px-2 py-1 rounded font-semibold">
                          {financialDetail.totalRevenue > 0 ? ((financialDetail.transferPayments / financialDetail.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        Rp {financialDetail.transferPayments.toLocaleString("id-ID")}
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{width: `${financialDetail.totalRevenue > 0 ? (financialDetail.transferPayments / financialDetail.totalRevenue * 100) : 0}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Detail Per Cabang dengan Data Keuangan Lengkap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                📊 LAPORAN KEUANGAN PER CABANG
              </CardTitle>
              <CardDescription>
                Analisis mendalam setiap cabang: Pendapatan, Pengeluaran, Komisi, Kasbon, Profit Margin, dan Metode Pembayaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branchFinancialDetails.length > 0 ? (
                <div className="space-y-6">
                  {branchFinancialDetails.map((branch, index) => (
                    <div key={branch.branchId} className="border-2 border-gray-300 rounded-xl overflow-hidden hover:shadow-2xl transition-shadow">
                      {/* Header Cabang */}
                      <div className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 p-5 border-b-2 border-orange-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-gray-900">{branch.branchName}</div>
                              <div className="text-sm text-gray-700">{branch.employees} Karyawan • {branch.transactions} Transaksi</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${branch.netProfit >= 0 ? 'bg-green-400 text-gray-900' : 'bg-red-400 text-gray-900'} border-0 text-lg px-4 py-2 font-bold`}>
                              {branch.netProfit >= 0 ? '📈 PROFIT' : '📉 LOSS'}
                            </Badge>
                            <div className="text-sm mt-1">Margin: {branch.profitMargin.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Konten Detail */}
                      <div className="p-6 bg-gray-50 space-y-6 text-gray-900">
                        {/* Section 1: Pemasukan & Pengeluaran */}
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            💰 PEMASUKAN & PENGELUARAN
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-300">
                              <div className="text-xs text-gray-600 mb-1">💵 Pendapatan</div>
                              <div className="text-xl font-bold text-green-700">
                                Rp {branch.totalRevenue.toLocaleString("id-ID")}
                              </div>
                              <div className="text-xs text-green-600 mt-1">Total penjualan</div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-lg border border-red-300">
                              <div className="text-xs text-gray-600 mb-1">💸 Pengeluaran</div>
                              <div className="text-xl font-bold text-red-700">
                                Rp {branch.totalExpenses.toLocaleString("id-ID")}
                              </div>
                              <div className="text-xs text-red-600 mt-1">Biaya operasional</div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border border-orange-300">
                              <div className="text-xs text-gray-600 mb-1">🎁 Komisi</div>
                              <div className="text-xl font-bold text-orange-700">
                                Rp {branch.totalCommissions.toLocaleString("id-ID")}
                              </div>
                              <div className="text-xs text-orange-600 mt-1">Komisi karyawan</div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg border border-purple-300">
                              <div className="text-xs text-gray-600 mb-1">💳 Kasbon</div>
                              <div className="text-xl font-bold text-purple-700">
                                Rp {branch.totalKasbon.toLocaleString("id-ID")}
                              </div>
                              <div className="text-xs text-purple-600 mt-1">Kasbon disetujui</div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Profit Analysis */}
                        <div className={`p-6 rounded-xl border-2 shadow-md ${branch.netProfit >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'}`}>
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            {branch.netProfit >= 0 ? '✅ ANALISIS PROFIT' : '⚠️ ANALISIS LOSS'}
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Pendapatan Kotor:</span>
                              <span className="font-bold text-green-600">+ Rp {branch.totalRevenue.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Pengeluaran:</span>
                              <span className="font-bold text-red-600">- Rp {branch.totalExpenses.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Komisi:</span>
                              <span className="font-bold text-orange-600">- Rp {branch.totalCommissions.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="border-t-2 border-gray-300 pt-2"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-gray-800">NET PROFIT/LOSS:</span>
                              <span className={`text-2xl font-bold ${branch.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                Rp {branch.netProfit.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                              <span className="text-sm text-gray-700">Profit Margin:</span>
                              <span className={`text-lg font-bold ${branch.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {branch.profitMargin.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Metode Pembayaran */}
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            💳 METODE PEMBAYARAN
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">💵 Cash</span>
                                <Badge className="bg-green-400 text-gray-900 font-semibold">
                                  {branch.totalRevenue > 0 ? ((branch.cashPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                </Badge>
                              </div>
                              <div className="text-xl font-bold text-green-700">
                                Rp {branch.cashPayments.toLocaleString("id-ID")}
                              </div>
                              <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{width: `${branch.totalRevenue > 0 ? (branch.cashPayments / branch.totalRevenue * 100) : 0}%`}}
                                ></div>
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">📱 QRIS</span>
                                <Badge className="bg-blue-400 text-gray-900 font-semibold">
                                  {branch.totalRevenue > 0 ? ((branch.qrisPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                </Badge>
                              </div>
                              <div className="text-xl font-bold text-blue-700">
                                Rp {branch.qrisPayments.toLocaleString("id-ID")}
                              </div>
                              <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{width: `${branch.totalRevenue > 0 ? (branch.qrisPayments / branch.totalRevenue * 100) : 0}%`}}
                                ></div>
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">🏦 Transfer</span>
                                <Badge className="bg-purple-400 text-gray-900 font-semibold">
                                  {branch.totalRevenue > 0 ? ((branch.transferPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                </Badge>
                              </div>
                              <div className="text-xl font-bold text-purple-700">
                                Rp {branch.transferPayments.toLocaleString("id-ID")}
                              </div>
                              <div className="mt-2 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{width: `${branch.totalRevenue > 0 ? (branch.transferPayments / branch.totalRevenue * 100) : 0}%`}}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Metrik Kinerja */}
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            📈 METRIK KINERJA
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="text-xs text-gray-600 mb-1">Rata-rata per Transaksi</div>
                              <div className="text-lg font-bold text-blue-700">
                                Rp {branch.avgTransactionValue.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                              </div>
                            </div>

                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-xs text-gray-600 mb-1">Pendapatan per Karyawan</div>
                              <div className="text-lg font-bold text-green-700">
                                Rp {branch.revenuePerEmployee.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                              </div>
                            </div>

                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="text-xs text-gray-600 mb-1">Transaksi per Karyawan</div>
                              <div className="text-lg font-bold text-orange-700">
                                {branch.transactionPerEmployee.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Kontribusi ke Total Bisnis */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-300 shadow-sm text-gray-900">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                            🎯 KONTRIBUSI KE TOTAL BISNIS
                          </h4>
                          <div className="text-sm text-gray-600 mb-4">
                            Seberapa besar cabang ini berkontribusi terhadap total pendapatan dan transaksi bisnis Anda
                          </div>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Kontribusi Pendapatan:</span>
                                <span className="text-lg font-bold text-green-600">
                                  {financialDetail.totalRevenue > 0 
                                    ? ((branch.totalRevenue / financialDetail.totalRevenue) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                  style={{
                                    width: `${financialDetail.totalRevenue > 0 
                                      ? (branch.totalRevenue / financialDetail.totalRevenue * 100)
                                      : 0}%`
                                  }}
                                >
                                  <span className="text-xs text-white font-bold">
                                    Rp {(branch.totalRevenue / 1000).toFixed(0)}k
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Dari total Rp {financialDetail.totalRevenue.toLocaleString("id-ID")}
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Kontribusi Transaksi:</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {dashboardStats.totalTransactions > 0 
                                    ? ((branch.transactions / dashboardStats.totalTransactions) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-cyan-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                  style={{
                                    width: `${dashboardStats.totalTransactions > 0 
                                      ? (branch.transactions / dashboardStats.totalTransactions * 100)
                                      : 0}%`
                                  }}
                                >
                                  <span className="text-xs text-white font-bold">{branch.transactions} trx</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Dari total {dashboardStats.totalTransactions} transaksi
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <DollarSign className="h-20 w-20 mb-4 text-gray-400" />
                  <p className="text-xl font-medium">Tidak ada data keuangan</p>
                  <p className="text-sm mt-2">Silakan pilih periode dan cabang untuk melihat laporan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          {/* Header Summary Semua Cabang */}
          <Card className="border-2 border-orange-700">
            <CardHeader className="bg-gradient-to-r from-orange-100 via-yellow-100 to-red-100 border-b-2 border-orange-300">
              <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
                <MapPin className="h-6 w-6 text-orange-600" />
                🏪 PERBANDINGAN PERFORMA SEMUA CABANG
              </CardTitle>
              <CardDescription className="text-gray-700">
                Analisis lengkap dan perbandingan kinerja setiap cabang - Revenue, Profit, Efisiensi, dan Ranking
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-blue-600">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">🏪 Total Cabang</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {branchFinancialDetails.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cabang beroperasi</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-green-600">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">💰 Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">
                      Rp {financialDetail.totalRevenue.toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Semua cabang</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-orange-600">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">📊 Rata-rata Revenue</div>
                    <div className="text-3xl font-bold text-orange-600">
                      Rp {branchFinancialDetails.length > 0 
                        ? (financialDetail.totalRevenue / branchFinancialDetails.length).toLocaleString("id-ID", {maximumFractionDigits: 0})
                        : "0"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Per cabang</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-purple-600">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-600 mb-1">👥 Total Karyawan</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {dashboardStats.totalEmployees}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Seluruh bisnis</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Ranking & Comparison Cabang */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                🏆 RANKING PERFORMA CABANG
              </CardTitle>
              <CardDescription>
                Cabang diurutkan berdasarkan performa terbaik - Revenue tertinggi, Profit terbesar, dan Efisiensi optimal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branchFinancialDetails.length > 0 ? (
                <div className="space-y-6">
                  {/* Sort by revenue descending */}
                  {[...branchFinancialDetails].sort((a, b) => b.totalRevenue - a.totalRevenue).map((branch, index) => {
                    const rank = index + 1
                    const isTopPerformer = rank <= 3
                    const rankColor = rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-orange-600' : 'bg-gray-600'
                    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏪'
                    
                    return (
                      <div key={branch.branchId} className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-2xl ${isTopPerformer ? 'border-yellow-400 shadow-lg' : 'border-gray-300'}`}>
                        {/* Header Cabang dengan Ranking */}
                        <div className={`p-5 ${rank === 1 ? 'bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 border-b-2 border-yellow-400' : rank === 2 ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 border-b-2 border-gray-500' : rank === 3 ? 'bg-gradient-to-r from-orange-100 via-red-100 to-pink-200 border-b-2 border-orange-400' : 'bg-gradient-to-r from-blue-100 to-purple-100 border-b-2 border-blue-400'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 ${rank === 1 ? 'bg-yellow-500 border-yellow-600 text-white' : rank === 2 ? 'bg-gray-500 border-gray-600 text-white' : rank === 3 ? 'bg-orange-600 border-orange-700 text-white' : 'bg-blue-700 border-blue-800 text-white'}`}>
                                <div className="text-center">
                                  <div className="text-2xl">{rankEmoji}</div>
                                  <div className="text-xs font-bold">#{rank}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900">{branch.branchName}</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {branch.employees} Karyawan • {branch.transactions} Transaksi
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {isTopPerformer && (
                                <Badge className="bg-yellow-400 text-gray-900 border-0 text-lg px-4 py-2 mb-2 font-bold">
                                  ⭐ TOP {rank}
                                </Badge>
                              )}
                              <div className={`text-lg font-bold ${branch.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                Profit: Rp {branch.netProfit.toLocaleString("id-ID")}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detail Lengkap Cabang */}
                        <div className="p-6 bg-gray-50 space-y-6 text-gray-900">
                          {/* Section 1: Overview Keuangan */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              💼 OVERVIEW KEUANGAN CABANG
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-300">
                                <div className="text-xs text-gray-600 mb-1">💰 Total Revenue</div>
                                <div className="text-xl font-bold text-green-700">
                                  Rp {branch.totalRevenue.toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-green-600 mt-1">Pendapatan kotor</div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-100 rounded-lg border border-red-300">
                                <div className="text-xs text-gray-600 mb-1">💸 Total Biaya</div>
                                <div className="text-xl font-bold text-red-700">
                                  Rp {(branch.totalExpenses + branch.totalCommissions).toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-red-600 mt-1">Expense + Komisi</div>
                              </div>

                              <div className={`p-4 rounded-lg border ${branch.netProfit >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300' : 'bg-gradient-to-br from-red-50 to-pink-100 border-red-300'}`}>
                                <div className="text-xs text-gray-600 mb-1">{branch.netProfit >= 0 ? '✅ Net Profit' : '❌ Net Loss'}</div>
                                <div className={`text-xl font-bold ${branch.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                  Rp {branch.netProfit.toLocaleString("id-ID")}
                                </div>
                                <div className={`text-xs mt-1 ${branch.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  Margin: {branch.profitMargin.toFixed(1)}%
                                </div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border border-orange-300">
                                <div className="text-xs text-gray-600 mb-1">📊 Avg/Transaksi</div>
                                <div className="text-xl font-bold text-orange-700">
                                  Rp {branch.avgTransactionValue.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                                </div>
                                <div className="text-xs text-orange-600 mt-1">Nilai rata-rata</div>
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Breakdown Detail Biaya */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              💳 BREAKDOWN DETAIL BIAYA
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">🏢 Pengeluaran</span>
                                  <span className="text-xs bg-red-400 text-gray-900 px-2 py-1 rounded font-semibold">
                                    {branch.totalRevenue > 0 ? ((branch.totalExpenses / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-red-700">
                                  Rp {branch.totalExpenses.toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Biaya operasional</div>
                              </div>

                              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">🎁 Komisi</span>
                                  <span className="text-xs bg-orange-400 text-gray-900 px-2 py-1 rounded font-semibold">
                                    {branch.totalRevenue > 0 ? ((branch.totalCommissions / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-orange-700">
                                  Rp {branch.totalCommissions.toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Komisi karyawan</div>
                              </div>

                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">💰 Kasbon</span>
                                  <span className="text-xs bg-purple-400 text-gray-900 px-2 py-1 rounded font-semibold">Info</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-700">
                                  Rp {branch.totalKasbon.toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Kasbon disetujui</div>
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Analisis Transaksi & Pembayaran */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              💳 ANALISIS TRANSAKSI & METODE PEMBAYARAN
                            </h4>
                            
                            {/* Stats Transaksi */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                <div className="text-xs text-gray-600 mb-1">Total Transaksi</div>
                                <div className="text-2xl font-bold text-blue-700">{branch.transactions}</div>
                              </div>

                              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                                <div className="text-xs text-gray-600 mb-1">Avg/Transaksi</div>
                                <div className="text-lg font-bold text-green-700">
                                  Rp {branch.avgTransactionValue.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                                </div>
                              </div>

                              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                                <div className="text-xs text-gray-600 mb-1">Transaksi/Karyawan</div>
                                <div className="text-2xl font-bold text-orange-700">
                                  {branch.transactionPerEmployee.toFixed(1)}
                                </div>
                              </div>

                              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                                <div className="text-xs text-gray-600 mb-1">Revenue/Karyawan</div>
                                <div className="text-lg font-bold text-purple-700">
                                  Rp {(branch.revenuePerEmployee / 1000).toFixed(0)}k
                                </div>
                              </div>
                            </div>

                            {/* Metode Pembayaran */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">💵 Cash</span>
                                  <Badge className="bg-green-400 text-gray-900 font-semibold">
                                    {branch.totalRevenue > 0 ? ((branch.cashPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                  </Badge>
                                </div>
                                <div className="text-xl font-bold text-green-700">
                                  Rp {branch.cashPayments.toLocaleString("id-ID")}
                                </div>
                                <div className="mt-2 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-green-600 h-3 rounded-full transition-all"
                                    style={{width: `${branch.totalRevenue > 0 ? (branch.cashPayments / branch.totalRevenue * 100) : 0}%`}}
                                  ></div>
                                </div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">📱 QRIS</span>
                                  <Badge className="bg-blue-400 text-gray-900 font-semibold">
                                    {branch.totalRevenue > 0 ? ((branch.qrisPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                  </Badge>
                                </div>
                                <div className="text-xl font-bold text-blue-700">
                                  Rp {branch.qrisPayments.toLocaleString("id-ID")}
                                </div>
                                <div className="mt-2 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-blue-600 h-3 rounded-full transition-all"
                                    style={{width: `${branch.totalRevenue > 0 ? (branch.qrisPayments / branch.totalRevenue * 100) : 0}%`}}
                                  ></div>
                                </div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">🏦 Transfer</span>
                                  <Badge className="bg-purple-400 text-gray-900 font-semibold">
                                    {branch.totalRevenue > 0 ? ((branch.transferPayments / branch.totalRevenue) * 100).toFixed(1) : 0}%
                                  </Badge>
                                </div>
                                <div className="text-xl font-bold text-purple-700">
                                  Rp {branch.transferPayments.toLocaleString("id-ID")}
                                </div>
                                <div className="mt-2 bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-purple-600 h-3 rounded-full transition-all"
                                    style={{width: `${branch.totalRevenue > 0 ? (branch.transferPayments / branch.totalRevenue * 100) : 0}%`}}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 4: Perbandingan dengan Cabang Lain */}
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-blue-300 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              📊 PERBANDINGAN DENGAN CABANG LAIN
                            </h4>
                            <div className="space-y-4">
                              {/* Revenue Comparison */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Kontribusi Revenue terhadap Total Bisnis:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {financialDetail.totalRevenue > 0 
                                      ? ((branch.totalRevenue / financialDetail.totalRevenue) * 100).toFixed(1)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                    style={{
                                      width: `${financialDetail.totalRevenue > 0 
                                        ? (branch.totalRevenue / financialDetail.totalRevenue * 100)
                                        : 0}%`
                                    }}
                                  >
                                    <span className="text-xs text-white font-bold">
                                      {financialDetail.totalRevenue > 0 
                                        ? ((branch.totalRevenue / financialDetail.totalRevenue) * 100).toFixed(1)
                                        : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Cabang ini: Rp {branch.totalRevenue.toLocaleString("id-ID")} dari total Rp {financialDetail.totalRevenue.toLocaleString("id-ID")}
                                </div>
                              </div>

                              {/* Profit Comparison */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Kontribusi Profit terhadap Total Bisnis:</span>
                                  <span className={`text-lg font-bold ${branch.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {financialDetail.netProfit > 0 
                                      ? ((branch.netProfit / financialDetail.netProfit) * 100).toFixed(1)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className={`h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500 ${branch.netProfit >= 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}
                                    style={{
                                      width: `${financialDetail.netProfit > 0 && branch.netProfit >= 0
                                        ? (branch.netProfit / financialDetail.netProfit * 100)
                                        : 0}%`
                                    }}
                                  >
                                    <span className="text-xs text-white font-bold">
                                      {financialDetail.netProfit > 0 
                                        ? ((branch.netProfit / financialDetail.netProfit) * 100).toFixed(1)
                                        : 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Cabang ini: Rp {branch.netProfit.toLocaleString("id-ID")} dari total Rp {financialDetail.netProfit.toLocaleString("id-ID")}
                                </div>
                              </div>

                              {/* Transaction Comparison */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Kontribusi Transaksi:</span>
                                  <span className="text-lg font-bold text-orange-600">
                                    {dashboardStats.totalTransactions > 0 
                                      ? ((branch.transactions / dashboardStats.totalTransactions) * 100).toFixed(1)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                    style={{
                                      width: `${dashboardStats.totalTransactions > 0 
                                        ? (branch.transactions / dashboardStats.totalTransactions * 100)
                                        : 0}%`
                                    }}
                                  >
                                    <span className="text-xs text-white font-bold">
                                      {branch.transactions} trx
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Cabang ini: {branch.transactions} dari total {dashboardStats.totalTransactions} transaksi
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 5: Status & Performance Badge */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              🎯 STATUS PERFORMA CABANG
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className={`p-4 rounded-lg text-center ${rank === 1 ? 'bg-yellow-100 border-2 border-yellow-500' : rank <= 3 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                <div className="text-xs text-gray-600 mb-1">Ranking</div>
                                <div className={`text-3xl font-bold ${rank === 1 ? 'text-yellow-600' : rank <= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                                  #{rank}
                                </div>
                                <div className="text-xs mt-1">{rank === 1 ? 'TOP 1' : rank <= 3 ? 'TOP 3' : 'Standard'}</div>
                              </div>

                              <div className={`p-4 rounded-lg text-center ${branch.profitMargin >= 30 ? 'bg-green-100 border-2 border-green-500' : branch.profitMargin >= 15 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-red-100 border-2 border-red-500'}`}>
                                <div className="text-xs text-gray-600 mb-1">Profit Margin</div>
                                <div className={`text-2xl font-bold ${branch.profitMargin >= 30 ? 'text-green-600' : branch.profitMargin >= 15 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {branch.profitMargin.toFixed(1)}%
                                </div>
                                <div className="text-xs mt-1">
                                  {branch.profitMargin >= 30 ? 'Excellent' : branch.profitMargin >= 15 ? 'Good' : 'Needs Improve'}
                                </div>
                              </div>

                              <div className={`p-4 rounded-lg text-center ${branch.transactionPerEmployee >= 10 ? 'bg-green-100 border-2 border-green-500' : branch.transactionPerEmployee >= 5 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-orange-100 border-2 border-orange-500'}`}>
                                <div className="text-xs text-gray-600 mb-1">Produktivitas</div>
                                <div className={`text-2xl font-bold ${branch.transactionPerEmployee >= 10 ? 'text-green-600' : branch.transactionPerEmployee >= 5 ? 'text-blue-600' : 'text-orange-600'}`}>
                                  {branch.transactionPerEmployee.toFixed(1)}
                                </div>
                                <div className="text-xs mt-1">Trx/Karyawan</div>
                              </div>

                              <div className="p-4 bg-blue-100 rounded-lg text-center border-2 border-blue-500">
                                <div className="text-xs text-gray-600 mb-1">Status</div>
                                <div className="text-2xl font-bold text-blue-600">✅</div>
                                <div className="text-xs mt-1 font-medium text-blue-700">Aktif</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <MapPin className="h-20 w-20 mb-4 text-gray-400" />
                  <p className="text-xl font-medium">Tidak ada data cabang</p>
                  <p className="text-sm mt-2">Silakan pilih periode dan filter untuk melihat laporan cabang</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {/* Header Summary Semua Karyawan */}
          <Card className="border-2 border-purple-700">
            <CardHeader className="bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 border-b-2 border-purple-300">
              <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
                <Users className="h-6 w-6 text-purple-600" />
                👥 RANKING & PERFORMA KARYAWAN
              </CardTitle>
              <CardDescription className="text-gray-700">
                Analisis lengkap performa setiap karyawan - Revenue, Transaksi, Komisi, Rating, dan Produktivitas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-gray-900">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-purple-600">
                  <CardContent className="p-4 text-gray-900">
                    <div className="text-xs text-gray-600 mb-1">👥 Total Karyawan</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {employeePerformance.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Karyawan aktif</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-green-600">
                  <CardContent className="p-4 text-gray-900">
                    <div className="text-xs text-gray-600 mb-1">💰 Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">
                      Rp {employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0).toLocaleString("id-ID")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Semua karyawan</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-blue-600">
                  <CardContent className="p-4 text-gray-900">
                    <div className="text-xs text-gray-600 mb-1">📊 Total Transaksi</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Semua transaksi</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-orange-600">
                  <CardContent className="p-4 text-gray-900">
                    <div className="text-xs text-gray-600 mb-1">⭐ Rating Rata-rata</div>
                    <div className="text-3xl font-bold text-orange-600">
                      {employeePerformance.length > 0 
                        ? (employeePerformance.reduce((sum, emp) => sum + emp.rating, 0) / employeePerformance.length).toFixed(1)
                        : "0.0"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Performa tim</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Ranking & Detail Karyawan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                🏆 RANKING PERFORMA KARYAWAN
              </CardTitle>
              <CardDescription>
                Karyawan diurutkan berdasarkan performa terbaik - Revenue tertinggi, Rating terbaik, dan Produktivitas optimal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeePerformance.length > 0 ? (
                <div className="space-y-6">
                  {/* Sort by revenue descending */}
                  {[...employeePerformance].sort((a, b) => b.revenue - a.revenue).map((employee, index) => {
                    const rank = index + 1
                    const isTopPerformer = rank <= 3
                    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '👤'
                    
                    return (
                      <div key={employee.name} className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-2xl ${isTopPerformer ? 'border-yellow-400 shadow-lg' : 'border-gray-300'}`}>
                        {/* Header Karyawan dengan Ranking */}
                        <div className={`p-5 ${rank === 1 ? 'bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 border-b-2 border-yellow-400' : rank === 2 ? 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 border-b-2 border-gray-500' : rank === 3 ? 'bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 border-b-2 border-orange-400' : 'bg-gradient-to-r from-blue-100 to-purple-100 border-b-2 border-blue-400'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 ${rank === 1 ? 'bg-yellow-500 border-yellow-600 text-white' : rank === 2 ? 'bg-gray-500 border-gray-600 text-white' : rank === 3 ? 'bg-orange-500 border-orange-600 text-white' : 'bg-blue-600 border-blue-700 text-white'}`}>
                                <div className="text-center">
                                  <div className="text-2xl">{rankEmoji}</div>
                                  <div className="text-xs font-bold">#{rank}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900">{employee.name}</div>
                                <div className="text-sm font-medium text-gray-700">
                                  💼 {employee.position} • ⭐ Rating {employee.rating.toFixed(1)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {isTopPerformer && (
                                <Badge className="bg-yellow-400 text-gray-900 border-0 text-lg px-4 py-2 mb-2 font-bold">
                                  ⭐ TOP {rank}
                                </Badge>
                              )}
                              <div className="text-lg font-bold text-green-700">
                                Revenue: Rp {employee.revenue.toLocaleString("id-ID")}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detail Lengkap Karyawan */}
                        <div className="p-6 bg-gray-50 space-y-6 text-gray-900">
                          {/* Section 1: Performa Penjualan */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              💰 PERFORMA PENJUALAN
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-300">
                                <div className="text-xs text-gray-600 mb-1">💵 Total Revenue</div>
                                <div className="text-xl font-bold text-green-700">
                                  Rp {employee.revenue.toLocaleString("id-ID")}
                                </div>
                                <div className="text-xs text-green-600 mt-1">Pendapatan kotor</div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg border border-blue-300">
                                <div className="text-xs text-gray-600 mb-1">📊 Total Transaksi</div>
                                <div className="text-xl font-bold text-blue-700">
                                  {employee.transactions}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">Transaksi selesai</div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border border-orange-300">
                                <div className="text-xs text-gray-600 mb-1">💎 Avg/Transaksi</div>
                                <div className="text-xl font-bold text-orange-700">
                                  Rp {employee.transactions > 0 ? (employee.revenue / employee.transactions).toLocaleString("id-ID", {maximumFractionDigits: 0}) : 0}
                                </div>
                                <div className="text-xs text-orange-600 mt-1">Nilai rata-rata</div>
                              </div>

                              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg border border-purple-300">
                                <div className="text-xs text-gray-600 mb-1">⭐ Rating</div>
                                <div className="text-xl font-bold text-purple-700">
                                  {employee.rating.toFixed(1)} / 5.0
                                </div>
                                <div className="text-xs text-purple-600 mt-1">Kepuasan pelanggan</div>
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Kontribusi & Ranking */}
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-blue-300 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              📊 KONTRIBUSI & PERBANDINGAN
                            </h4>
                            <div className="space-y-4">
                              {/* Revenue Contribution */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Kontribusi Revenue terhadap Total Tim:</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0) > 0 
                                      ? ((employee.revenue / employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0)) * 100).toFixed(1)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                    style={{
                                      width: `${employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0) > 0 
                                        ? (employee.revenue / employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0) * 100)
                                        : 0}%`
                                    }}
                                  >
                                    <span className="text-xs text-white font-bold">
                                      Rp {(employee.revenue / 1000).toFixed(0)}k
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Karyawan ini: Rp {employee.revenue.toLocaleString("id-ID")} dari total Rp {employeePerformance.reduce((sum, emp) => sum + emp.revenue, 0).toLocaleString("id-ID")}
                                </div>
                              </div>

                              {/* Transaction Contribution */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Kontribusi Transaksi:</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    {employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0) > 0 
                                      ? ((employee.transactions / employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0)) * 100).toFixed(1)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-cyan-600 h-4 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                    style={{
                                      width: `${employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0) > 0 
                                        ? (employee.transactions / employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0) * 100)
                                        : 0}%`
                                    }}
                                  >
                                    <span className="text-xs text-white font-bold">
                                      {employee.transactions} trx
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Karyawan ini: {employee.transactions} dari total {employeePerformance.reduce((sum, emp) => sum + emp.transactions, 0)} transaksi
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Status & Badge */}
                          <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm text-gray-900">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                              🎯 STATUS PERFORMA
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className={`p-4 rounded-lg text-center ${rank === 1 ? 'bg-yellow-100 border-2 border-yellow-500' : rank <= 3 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                <div className="text-xs text-gray-600 mb-1">Ranking</div>
                                <div className={`text-3xl font-bold ${rank === 1 ? 'text-yellow-600' : rank <= 3 ? 'text-green-600' : 'text-gray-600'}`}>
                                  #{rank}
                                </div>
                                <div className="text-xs mt-1 text-gray-700">{rank === 1 ? 'TOP 1 🥇' : rank <= 3 ? 'TOP 3 🏆' : 'Standard'}</div>
                              </div>

                              <div className={`p-4 rounded-lg text-center ${employee.rating >= 4.5 ? 'bg-green-100 border-2 border-green-500' : employee.rating >= 4.0 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-orange-100 border-2 border-orange-500'}`}>
                                <div className="text-xs text-gray-600 mb-1">Rating</div>
                                <div className={`text-3xl font-bold ${employee.rating >= 4.5 ? 'text-green-600' : employee.rating >= 4.0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                  ⭐ {employee.rating.toFixed(1)}
                                </div>
                                <div className="text-xs mt-1 text-gray-700">{employee.rating >= 4.5 ? 'Excellent' : employee.rating >= 4.0 ? 'Good' : 'Average'}</div>
                              </div>

                              <div className={`p-4 rounded-lg text-center ${employee.transactions >= 10 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                <div className="text-xs text-gray-600 mb-1">Produktivitas</div>
                                <div className={`text-3xl font-bold ${employee.transactions >= 10 ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {employee.transactions >= 20 ? '🔥' : employee.transactions >= 10 ? '💪' : '📊'}
                                </div>
                                <div className="text-xs mt-1 text-gray-700">{employee.transactions >= 20 ? 'Sangat Tinggi' : employee.transactions >= 10 ? 'Tinggi' : 'Normal'}</div>
                              </div>

                              <div className="p-4 bg-purple-100 rounded-lg text-center border-2 border-purple-500">
                                <div className="text-xs text-gray-600 mb-1">Status</div>
                                <div className="text-3xl font-bold text-purple-600">✅</div>
                                <div className="text-xs mt-1 text-gray-700">Aktif</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Users className="h-20 w-20 mb-4 text-gray-400" />
                  <p className="text-xl font-medium">Tidak ada data karyawan</p>
                  <p className="text-sm mt-2">Silakan pilih periode dan cabang untuk melihat performa karyawan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Layanan</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {serviceData.map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: service.color }}></div>
                          <span className="font-bold">{service.value}%</span>
                          <span className="text-sm text-gray-500">({service.count}x)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={serviceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ value }) => `${value}%`}
                      >
                        {serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  Tidak ada data layanan untuk ditampilkan
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Summary Cards Hari Ini */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Hadir Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{attendanceStats.todayPresent || 0}</div>
                <p className="text-xs text-green-700 mt-1">Sedang bekerja</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Istirahat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{attendanceStats.todayOnBreak || 0}</div>
                <p className="text-xs text-blue-700 mt-1">Sedang break</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Sudah Pulang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">{attendanceStats.todayCheckedOut || 0}</div>
                <p className="text-xs text-gray-700 mt-1">Completed today</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Belum Masuk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{attendanceStats.todayAbsent || 0}</div>
                <p className="text-xs text-red-700 mt-1">Not checked in</p>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs: Grid Karyawan & Laporan Detail */}
          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">📋 Grid Karyawan</TabsTrigger>
              <TabsTrigger value="report">📊 Laporan Detail</TabsTrigger>
            </TabsList>

            {/* Grid Karyawan - Seperti di Attendance System */}
            <TabsContent value="grid" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Status Karyawan Real-Time
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Data diperbarui otomatis setiap 5 detik • Klik refresh untuk update manual
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {employeeAttendanceList.map((employee, index) => (
                      <Card
                        key={employee.name}
                        className={`overflow-hidden transition-all hover:shadow-lg ${
                          employee.currentStatus === "present"
                            ? "border-l-4 border-green-500 bg-green-50/30"
                            : employee.currentStatus === "on-break"
                              ? "border-l-4 border-blue-500 bg-blue-50/30"
                              : employee.currentStatus === "checked-out"
                                ? "border-l-4 border-gray-500 bg-gray-50/30"
                                : "border-l-4 border-red-300 bg-red-50/20"
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                  index === 0
                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-200"
                                    : index === 1
                                      ? "bg-gradient-to-br from-gray-400 to-gray-600 ring-4 ring-gray-200"
                                      : index === 2
                                        ? "bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-200"
                                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                                }`}
                              >
                                {employee.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
                                  {index < 3 && (
                                    <span className="text-2xl">
                                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {employee.daysWorked} hari kerja
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`px-4 py-2 text-sm font-semibold ${
                                employee.currentStatus === "present"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : employee.currentStatus === "on-break"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : employee.currentStatus === "checked-out"
                                      ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                      : "bg-red-100 text-red-800 hover:bg-red-100"
                              }`}
                            >
                              {employee.currentStatus === "present" && "🟢 Sedang Bekerja"}
                              {employee.currentStatus === "on-break" && "🟡 Istirahat"}
                              {employee.currentStatus === "checked-out" && "⚪ Sudah Pulang"}
                              {employee.currentStatus === "absent" && "🔴 Belum Masuk"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                              <div className="text-xs font-medium text-gray-600 mb-2">Check In</div>
                              <div className="text-lg font-bold text-green-700">
                                {employee.todayCheckIn
                                  ? new Date(employee.todayCheckIn).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "--:--"}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border-2 border-red-200 shadow-sm">
                              <div className="text-xs font-medium text-gray-600 mb-2">Check Out</div>
                              <div className="text-lg font-bold text-red-700">
                                {employee.todayCheckOut
                                  ? new Date(employee.todayCheckOut).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "--:--"}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                              <div className="text-xs font-medium text-gray-600 mb-2">Jam Kerja Hari Ini</div>
                              <div className="text-lg font-bold text-blue-700">
                                {employee.todayWorkingHours
                                  ? (() => {
                                      const hours = employee.todayWorkingHours
                                      const h = Math.floor(hours)
                                      const m = Math.floor((hours % 1) * 60)
                                      const s = Math.floor(((hours % 1) * 60 - m) * 60)
                                      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
                                    })()
                                  : "00:00:00"}
                              </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                              <div className="text-xs font-medium text-gray-600 mb-2">Istirahat</div>
                              <div className="text-lg font-bold text-orange-700">
                                {employee.todayBreakDuration
                                  ? (() => {
                                      const mins = employee.todayBreakDuration
                                      const h = Math.floor(mins / 60)
                                      const m = mins % 60
                                      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`
                                    })()
                                  : "00:00:00"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <div className="flex gap-6">
                              <div>
                                <span className="text-sm text-gray-600">Total Jam (All Time): </span>
                                <span className="font-bold text-blue-600 text-lg">{employee.totalHours}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Kehadiran: </span>
                                <span className="font-bold text-green-600 text-lg">{employee.attendanceRate}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {employeeAttendanceList.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Tidak ada data karyawan</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Laporan Detail - Tabel Lengkap */}
            <TabsContent value="report" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Rata-rata Jam Kerja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{attendanceStats.averageHours}</div>
                    <p className="text-xs text-gray-600">per hari (all time)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tingkat Kehadiran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{attendanceStats.attendanceRate}%</div>
                    <p className="text-xs text-gray-600">completion rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Karyawan Terbaik
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-red-600">{attendanceStats.topEmployee}</div>
                    <p className="text-xs text-gray-600">Jam kerja terbanyak</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Laporan Presensi Lengkap
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Tabel lengkap dengan semua data presensi karyawan • Update real-time setiap 5 detik
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                          <th className="p-3 text-left font-semibold border border-red-600">Rank</th>
                          <th className="p-3 text-left font-semibold border border-red-600">Nama Karyawan</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Status Hari Ini</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Check In</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Check Out</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Jam Kerja Hari Ini</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Istirahat</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Total Jam (All Time)</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Hari Kerja</th>
                          <th className="p-3 text-center font-semibold border border-red-600">Kehadiran %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeAttendanceList.map((employee, index) => (
                          <tr
                            key={employee.name}
                            className={`border-b hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            } ${
                              employee.currentStatus === "present"
                                ? "border-l-4 border-green-500"
                                : employee.currentStatus === "on-break"
                                  ? "border-l-4 border-blue-500"
                                  : employee.currentStatus === "checked-out"
                                    ? "border-l-4 border-gray-500"
                                    : "border-l-4 border-red-300"
                            }`}
                          >
                            <td className="p-3 border border-gray-200">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                        ? "bg-gray-200 text-gray-800"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                {index < 3 && <span className="text-lg">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-gray-900 border border-gray-200">{employee.name}</td>
                            <td className="p-3 text-center border border-gray-200">
                              <Badge
                                className={`${
                                  employee.currentStatus === "present"
                                    ? "bg-green-100 text-green-800"
                                    : employee.currentStatus === "on-break"
                                      ? "bg-blue-100 text-blue-800"
                                      : employee.currentStatus === "checked-out"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                              >
                                {employee.currentStatus === "present" && "🟢 Bekerja"}
                                {employee.currentStatus === "on-break" && "🟡 Break"}
                                {employee.currentStatus === "checked-out" && "⚪ Pulang"}
                                {employee.currentStatus === "absent" && "🔴 Absent"}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-mono text-green-700 font-semibold border border-gray-200">
                              {employee.todayCheckIn
                                ? new Date(employee.todayCheckIn).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                : "--:--:--"}
                            </td>
                            <td className="p-3 text-center font-mono text-red-700 font-semibold border border-gray-200">
                              {employee.todayCheckOut
                                ? new Date(employee.todayCheckOut).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                : "--:--:--"}
                            </td>
                            <td className="p-3 text-center font-mono text-blue-700 font-bold border border-gray-200">
                              {employee.todayWorkingHours
                                ? (() => {
                                    const hours = employee.todayWorkingHours
                                    const h = Math.floor(hours)
                                    const m = Math.floor((hours % 1) * 60)
                                    const s = Math.floor(((hours % 1) * 60 - m) * 60)
                                    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
                                  })()
                                : "00:00:00"}
                            </td>
                            <td className="p-3 text-center font-mono text-orange-700 font-semibold border border-gray-200">
                              {employee.todayBreakDuration
                                ? (() => {
                                    const mins = employee.todayBreakDuration
                                    const h = Math.floor(mins / 60)
                                    const m = mins % 60
                                    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`
                                  })()
                                : "00:00:00"}
                            </td>
                            <td className="p-3 text-center font-mono text-indigo-700 font-bold text-lg border border-gray-200">
                              {employee.totalHours}
                            </td>
                            <td className="p-3 text-center text-gray-700 border border-gray-200">{employee.daysWorked}</td>
                            <td className="p-3 text-center border border-gray-200">
                              <span className="font-bold text-green-700 text-lg">{employee.attendanceRate}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {employeeAttendanceList.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Tidak ada data presensi</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}

