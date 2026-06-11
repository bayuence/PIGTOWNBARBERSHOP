/**
 * Employee Detail Dialog Component
 * 
 * Modal dialog showing detailed employee information.
 * Displays statistics, attendance, and commission data.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, Calendar, TrendingUp, Users } from "lucide-react"
import {
  formatRupiah,
  formatEmployeeStatus,
  getStatusColor,
  calculateTotalSalary
} from "@/lib/utils/employee-helpers"
import type { Employee, EmployeeStats, EmployeeAttendance } from "@/components/employees/types"

/**
 * Props for EmployeeDetailDialog component
 */
export interface EmployeeDetailDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Employee to display */
  employee: Employee | null
  /** Employee statistics */
  stats: EmployeeStats | null
  /** Employee attendance */
  attendance: EmployeeAttendance | null
  /** Employee commissions */
  commissions: any[]
}

/**
 * Employee Detail Dialog
 * 
 * Shows comprehensive employee information in tabs.
 * 
 * @param props - Component props
 * @returns Detail dialog component
 */
export function EmployeeDetailDialog({
  open,
  onOpenChange,
  employee,
  stats,
  attendance,
  commissions
}: EmployeeDetailDialogProps) {
  if (!employee) return null
  
  const totalSalary = stats ? calculateTotalSalary(employee, stats) : 0
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{employee.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
            </div>
            <Badge className={getStatusColor(employee.status)}>
              {formatEmployeeStatus(employee.status)}
            </Badge>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistics">Statistik</TabsTrigger>
            <TabsTrigger value="attendance">Presensi</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                </div>
                <p className="text-sm font-medium">{employee.email}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Telepon:</span>
                </div>
                <p className="text-sm font-medium">{employee.phone || "-"}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Posisi:</span>
                </div>
                <p className="text-sm font-medium">{employee.position}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Bergabung:</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(employee.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Informasi Gaji</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gaji Pokok</p>
                  <p className="text-lg font-semibold">
                    {formatRupiah(employee.salary || 3000000)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Komisi</p>
                  <p className="text-lg font-semibold">
                    {formatRupiah(stats?.totalCommission || 0)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Total Gaji</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(totalSalary)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">{formatRupiah(stats?.totalRevenue || 0)}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold">{formatRupiah(stats?.averageTransaction || 0)}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Komisi</p>
                <p className="text-2xl font-bold">{formatRupiah(stats?.totalCommission || 0)}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Bonus Points</p>
                <p className="text-2xl font-bold text-green-600">{stats?.bonusPoints || 0}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Penalty Points</p>
                <p className="text-2xl font-bold text-red-600">{stats?.penaltyPoints || 0}</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tingkat Kehadiran</p>
                <p className="text-2xl font-bold">{attendance?.attendanceRate || 0}%</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Hari Hadir</p>
                <p className="text-2xl font-bold">{attendance?.presentDays || 0}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Hari Terlambat</p>
                <p className="text-2xl font-bold">{attendance?.lateDays || 0}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Jam Lembur</p>
                <p className="text-2xl font-bold">{attendance?.overtimeHours || 0}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
