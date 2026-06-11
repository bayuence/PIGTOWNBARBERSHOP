/**
 * Employee Card Component
 * 
 * Displays individual employee information in a card format.
 * Shows avatar, name, position, status, and key statistics.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react"
import {
  formatRupiah,
  formatEmployeeStatus,
  getInitials,
  getStatusColor,
  calculateTotalSalary
} from "@/lib/utils/employee-helpers"
import type { Employee, EmployeeStats } from "@/components/employees/types"

/**
 * Props for EmployeeCard component
 */
export interface EmployeeCardProps {
  /** Employee data */
  employee: Employee
  /** Employee statistics */
  stats: EmployeeStats
  /** View detail handler */
  onViewDetail: () => void
  /** Edit handler */
  onEdit: () => void
  /** Delete handler */
  onDelete: () => void
  /** Manage absence handler */
  onManageAbsence: () => void
  /** Manage payroll handler */
  onManagePayroll: () => void
}

/**
 * Employee Card
 * 
 * Displays employee information with action buttons.
 * 
 * @param props - Component props
 * @returns Employee card component
 * 
 * @example
 * <EmployeeCard
 *   employee={employee}
 *   stats={stats}
 *   onViewDetail={() => {}}
 *   onEdit={() => {}}
 *   onDelete={() => {}}
 *   onManageAbsence={() => {}}
 *   onManagePayroll={() => {}}
 * />
 */
export function EmployeeCard({
  employee,
  stats,
  onViewDetail,
  onEdit,
  onDelete,
  onManageAbsence,
  onManagePayroll
}: EmployeeCardProps) {
  const totalSalary = calculateTotalSalary(employee, stats)
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Avatar and Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                {employee.name}
              </h3>
              <p className="text-xs text-muted-foreground">{employee.position}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge className={getStatusColor(employee.status)}>
            {formatEmployeeStatus(employee.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Total Transaksi</p>
            <p className="font-semibold">{stats.totalTransactions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Revenue</p>
            <p className="font-semibold">{formatRupiah(stats.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Komisi</p>
            <p className="font-semibold">{formatRupiah(stats.totalCommission)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Gaji</p>
            <p className="font-semibold">{formatRupiah(totalSalary)}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetail}
            className="flex-1 min-w-[80px]"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detail
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 min-w-[80px]"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageAbsence}
            className="flex-1 min-w-[80px]"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Cuti
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManagePayroll}
            className="flex-1 min-w-[80px]"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Gaji
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex-1 min-w-[80px]"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
