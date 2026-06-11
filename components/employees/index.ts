/**
 * Employee Management Components
 * 
 * Barrel export for all employee management components.
 * Provides clean imports for the employee management system.
 */

// Main component
export { EmployeeManagement } from "../employee-management-refactored"

// Display components
export { EmployeeStatsCards } from "./employee-stats-cards"
export { EmployeeCard } from "./employee-card"
export { EmployeeList } from "./employee-list"

// Filter component
export { EmployeeFilters } from "./employee-filters"

// Dialog components
export { EmployeeAddDialog } from "./employee-add-dialog"
export { EmployeeEditDialog } from "./employee-edit-dialog"
export { EmployeeDeleteDialog } from "./employee-delete-dialog"
export { EmployeeDetailDialog } from "./employee-detail-dialog"
export { EmployeeAbsenceDialog } from "./employee-absence-dialog"
export { EmployeePayrollDialog } from "./employee-payroll-dialog"

// Types
export type {
  Employee,
  EmployeeStatus,
  EmployeeStats,
  EmployeeAttendance,
  AttendanceRecord,
  AbsenceInfo,
  CommissionRecord,
  EmployeeFormData,
  PayrollFormData,
  EmployeeFilters,
  ValidationResult,
  EmployeeSummary,
  EmployeeSortField,
  SortOrder,
  EmployeeSort,
} from "./types"

// Constants
export {
  DEFAULT_EMPLOYEE_STATS,
  DEFAULT_EMPLOYEE_ATTENDANCE,
  DEFAULT_ABSENCE_INFO,
  DEFAULT_EMPLOYEE_FORM,
  DEFAULT_PAYROLL_FORM,
  DEFAULT_EMPLOYEE_FILTERS,
  DEFAULT_EMPLOYEE_SUMMARY,
  DEFAULT_EMPLOYEE_SORT,
} from "./types"

// Component prop types
export type { EmployeeStatsCardsProps } from "./employee-stats-cards"
export type { EmployeeCardProps } from "./employee-card"
export type { EmployeeListProps } from "./employee-list"
export type { EmployeeFiltersProps } from "./employee-filters"
export type { EmployeeAddDialogProps } from "./employee-add-dialog"
export type { EmployeeEditDialogProps } from "./employee-edit-dialog"
export type { EmployeeDeleteDialogProps } from "./employee-delete-dialog"
export type { EmployeeDetailDialogProps } from "./employee-detail-dialog"
export type { EmployeeAbsenceDialogProps } from "./employee-absence-dialog"
export type { EmployeePayrollDialogProps } from "./employee-payroll-dialog"
