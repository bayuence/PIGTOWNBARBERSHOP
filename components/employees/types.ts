/**
 * Employee Management Type Definitions
 * 
 * Centralized type definitions for the Employee Management system.
 * All types used across employee components are defined here.
 */

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

/**
 * Employee status
 */
export type EmployeeStatus = 'active' | 'inactive' | 'on-leave'

/**
 * Employee data
 */
export interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  position: string
  pin: string
  status: EmployeeStatus
  salary: number | null
  commission_rate: number | null
  overtime_rate: number | null
  created_at: string
  updated_at: string
  branch_id?: string | null
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Employee performance statistics
 */
export interface EmployeeStats {
  totalTransactions: number
  totalRevenue: number
  totalCommission: number
  averageTransaction: number
  bonusPoints: number
  penaltyPoints: number
  totalBonus: number
  totalPenalty: number
}

/**
 * Default empty stats
 */
export const DEFAULT_EMPLOYEE_STATS: EmployeeStats = {
  totalTransactions: 0,
  totalRevenue: 0,
  totalCommission: 0,
  averageTransaction: 0,
  bonusPoints: 0,
  penaltyPoints: 0,
  totalBonus: 0,
  totalPenalty: 0
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

/**
 * Attendance record
 */
export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  clock_in: string | null
  clock_out: string | null
  overtime_hours: number
  notes: string | null
  created_at: string
}

/**
 * Employee attendance summary
 */
export interface EmployeeAttendance {
  data: AttendanceRecord[]
  attendanceRate: number
  presentDays: number
  lateDays: number
  overtimeHours: number
}

/**
 * Default empty attendance
 */
export const DEFAULT_EMPLOYEE_ATTENDANCE: EmployeeAttendance = {
  data: [],
  attendanceRate: 0,
  presentDays: 0,
  lateDays: 0,
  overtimeHours: 0
}

// ============================================================================
// ABSENCE TYPES
// ============================================================================

/**
 * Absence information
 */
export interface AbsenceInfo {
  maxAbsentDays: number
  currentAbsentDays: number
  remainingDays: number
  excessDays: number
}

/**
 * Default absence info
 */
export const DEFAULT_ABSENCE_INFO: AbsenceInfo = {
  maxAbsentDays: 4,
  currentAbsentDays: 0,
  remainingDays: 4,
  excessDays: 0
}

// ============================================================================
// COMMISSION TYPES
// ============================================================================

/**
 * Commission record
 */
export interface CommissionRecord {
  id: string
  employee_id: string
  transaction_id: string
  amount: number
  rate: number
  date: string
  created_at: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Employee form data for add/edit
 */
export interface EmployeeFormData {
  name: string
  email: string
  phone: string
  position: string
  pin: string
  status: EmployeeStatus
}

/**
 * Payroll form data
 */
export interface PayrollFormData {
  baseSalary: number
  commissionRate: number
  overtimeRate: number
  bonusPoints: number
}

/**
 * Default employee form
 */
export const DEFAULT_EMPLOYEE_FORM: EmployeeFormData = {
  name: '',
  email: '',
  phone: '',
  position: '',
  pin: '',
  status: 'active'
}

/**
 * Default payroll form
 */
export const DEFAULT_PAYROLL_FORM: PayrollFormData = {
  baseSalary: 3000000,
  commissionRate: 0,
  overtimeRate: 0,
  bonusPoints: 0
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Employee filter options
 */
export interface EmployeeFilters {
  searchTerm: string
  status: 'all' | EmployeeStatus
}

/**
 * Default filters
 */
export const DEFAULT_EMPLOYEE_FILTERS: EmployeeFilters = {
  searchTerm: '',
  status: 'all'
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// ============================================================================
// SUMMARY TYPES
// ============================================================================

/**
 * Employee summary statistics
 */
export interface EmployeeSummary {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  onLeaveEmployees: number
  totalSalary: number
  absentToday: number
}

/**
 * Default summary
 */
export const DEFAULT_EMPLOYEE_SUMMARY: EmployeeSummary = {
  totalEmployees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  onLeaveEmployees: 0,
  totalSalary: 0,
  absentToday: 0
}

// ============================================================================
// SORT TYPES
// ============================================================================

/**
 * Sort field options
 */
export type EmployeeSortField = 'name' | 'position' | 'status' | 'salary' | 'created_at'

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Sort configuration
 */
export interface EmployeeSort {
  field: EmployeeSortField
  order: SortOrder
}

/**
 * Default sort
 */
export const DEFAULT_EMPLOYEE_SORT: EmployeeSort = {
  field: 'name',
  order: 'asc'
}
