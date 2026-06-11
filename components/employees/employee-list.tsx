/**
 * Employee List Component
 * 
 * Displays a grid of employee cards.
 * Handles loading and empty states.
 */

import { EmployeeCard } from "./employee-card"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { Employee, EmployeeStats } from "@/components/employees/types"

/**
 * Props for EmployeeList component
 */
export interface EmployeeListProps {
  /** Array of employees to display */
  employees: Employee[]
  /** Employee statistics map */
  employeeStats: Record<string, EmployeeStats>
  /** View detail handler */
  onViewDetail: (employee: Employee) => void
  /** Edit handler */
  onEdit: (employee: Employee) => void
  /** Delete handler */
  onDelete: (employee: Employee) => void
  /** Manage absence handler */
  onManageAbsence: (employee: Employee) => void
  /** Manage payroll handler */
  onManagePayroll: (employee: Employee) => void
  /** Loading state */
  loading?: boolean
}

/**
 * Employee List
 * 
 * Displays employees in a responsive grid layout.
 * 
 * @param props - Component props
 * @returns Employee list component
 * 
 * @example
 * <EmployeeList
 *   employees={employees}
 *   employeeStats={statsMap}
 *   onViewDetail={(emp) => {}}
 *   onEdit={(emp) => {}}
 *   onDelete={(emp) => {}}
 *   onManageAbsence={(emp) => {}}
 *   onManagePayroll={(emp) => {}}
 * />
 */
export function EmployeeList({
  employees,
  employeeStats,
  onViewDetail,
  onEdit,
  onDelete,
  onManageAbsence,
  onManagePayroll,
  loading = false
}: EmployeeListProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  // Empty state
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tidak ada karyawan</h3>
          <p className="text-sm text-muted-foreground text-center">
            Belum ada karyawan yang ditambahkan atau tidak ada yang sesuai dengan filter.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // Employee grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          stats={employeeStats[employee.id] || {
            totalTransactions: 0,
            totalRevenue: 0,
            totalCommission: 0,
            averageTransaction: 0,
            bonusPoints: 0,
            penaltyPoints: 0,
            totalBonus: 0,
            totalPenalty: 0
          }}
          onViewDetail={() => onViewDetail(employee)}
          onEdit={() => onEdit(employee)}
          onDelete={() => onDelete(employee)}
          onManageAbsence={() => onManageAbsence(employee)}
          onManagePayroll={() => onManagePayroll(employee)}
        />
      ))}
    </div>
  )
}
