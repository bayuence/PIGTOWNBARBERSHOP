/**
 * Employee Statistics Cards Component
 * 
 * Displays summary statistics for employee management.
 * Shows total employees, salary, absent today, and on-leave count.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, UserX, Calendar } from "lucide-react"
import { formatRupiah } from "@/lib/utils/employee-helpers"
import type { Employee } from "@/components/employees/types"

/**
 * Props for EmployeeStatsCards component
 */
export interface EmployeeStatsCardsProps {
  /** Total number of employees */
  totalEmployees: number
  /** Number of active employees */
  activeEmployees: number
  /** Total salary amount */
  totalSalary: number
  /** Number of employees absent today */
  absentToday: number
  /** List of absent employees */
  absentEmployees: Employee[]
  /** Number of employees on leave */
  onLeaveCount: number
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Statistics Cards
 * 
 * Displays 4 summary cards with key employee metrics.
 * 
 * @param props - Component props
 * @returns Statistics cards component
 * 
 * @example
 * <EmployeeStatsCards
 *   totalEmployees={50}
 *   activeEmployees={45}
 *   totalSalary={150000000}
 *   absentToday={2}
 *   absentEmployees={[...]}
 *   onLeaveCount={3}
 * />
 */
export function EmployeeStatsCards({
  totalEmployees,
  activeEmployees,
  totalSalary,
  absentToday,
  absentEmployees,
  onLeaveCount,
  loading = false
}: EmployeeStatsCardsProps) {
  /**
   * Format absent employees names for display
   */
  const formatAbsentNames = () => {
    if (absentEmployees.length === 0) return "Semua hadir"
    
    const names = absentEmployees
      .slice(0, 2)
      .map((emp) => emp.name)
      .join(", ")
    
    return absentEmployees.length > 2 ? `${names}...` : names
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      {/* Total Employees Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium">
            Total Karyawan
          </CardTitle>
          <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-lg md:text-2xl font-bold">{totalEmployees}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            {activeEmployees} aktif
          </p>
        </CardContent>
      </Card>
      
      {/* Total Salary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium">
            Total Gaji
          </CardTitle>
          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-sm md:text-2xl font-bold truncate">
            {formatRupiah(totalSalary)}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Per bulan
          </p>
        </CardContent>
      </Card>
      
      {/* Absent Today Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium line-clamp-2">
            Tidak Hadir Hari Ini
          </CardTitle>
          <UserX className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-lg md:text-2xl font-bold">{absentToday}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
            {formatAbsentNames()}
          </p>
        </CardContent>
      </Card>
      
      {/* On Leave Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium">
            Karyawan Cuti
          </CardTitle>
          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-lg md:text-2xl font-bold">{onLeaveCount}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Sedang cuti
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
