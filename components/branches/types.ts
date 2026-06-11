/**
 * Branch Management Type Definitions
 * 
 * Centralized type definitions for the Branch Management system.
 * All types used across branch components are defined here.
 */

// ============================================================================
// BRANCH TYPES
// ============================================================================

/**
 * Branch status
 */
export type BranchStatus = 'active' | 'inactive' | 'maintenance'

/**
 * Branch data
 */
export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  manager: string
  employees: number
  status: BranchStatus
  revenue: string
  customers: number
  rating: number
  openTime: string
  closeTime: string
  services: BranchService[]
  shifts: Shift[]
  branchEmployees: BranchEmployee[]
  targets: BranchTarget[]
  settings: BranchSettings
  created_at?: string
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

/**
 * Branch service
 */
export interface BranchService {
  id: string
  name: string
  price: number
  duration: number
  aktif: boolean
  category: string
}

/**
 * Service form data
 */
export interface ServiceFormData {
  name: string
  price: number
  duration: number
  aktif: boolean
  category: string
}

/**
 * Default service form
 */
export const DEFAULT_SERVICE_FORM: ServiceFormData = {
  name: '',
  price: 0,
  duration: 30,
  aktif: true,
  category: ''
}

// ============================================================================
// SHIFT TYPES
// ============================================================================

/**
 * Break time
 */
export interface BreakTime {
  id: string
  start: string
  end: string
  duration: number
}

/**
 * Shift data
 */
export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  days: string[]
  maxEmployees: number
  currentEmployees: number
  status: string
  breakTime?: {
    start: string
    end: string
    duration: number
  }
  minStaff: number
  hasBreakTime?: boolean
  breakTimes?: BreakTime[]
}

/**
 * Shift form data
 */
export interface ShiftFormData {
  name: string
  startTime: string
  endTime: string
  days: string[]
  hasBreakTime: boolean
  breakTimes: BreakTime[]
  status?: string
}

/**
 * Default shift form
 */
export const DEFAULT_SHIFT_FORM: ShiftFormData = {
  name: '',
  startTime: '09:00',
  endTime: '17:00',
  days: [],
  hasBreakTime: false,
  breakTimes: [],
  status: 'active'
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

/**
 * Branch employee
 */
export interface BranchEmployee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  status: string
  shifts: string[]
  salary: number
  commission: number
}

// ============================================================================
// TARGET TYPES
// ============================================================================

/**
 * Target type
 */
export type TargetType = 'revenue' | 'customers' | 'services'

/**
 * Target period
 */
export type TargetPeriod = 'daily' | 'weekly' | 'monthly'

/**
 * Branch target
 */
export interface BranchTarget {
  id: string
  type: TargetType
  target: number
  current: number
  period: TargetPeriod
  status: string
}

/**
 * Target form data
 */
export interface TargetFormData {
  type: TargetType
  target: number
  period: TargetPeriod
  status: string
}

/**
 * Default target form
 */
export const DEFAULT_TARGET_FORM: TargetFormData = {
  type: 'revenue',
  target: 0,
  period: 'monthly',
  status: 'active'
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * Branch settings
 */
export interface BranchSettings {
  autoAcceptBookings: boolean
  allowWalkIns: boolean
  requireDeposit: boolean
  depositAmount: number
  cancellationPolicy: string
  maxAdvanceBooking: number
  timezone: string
  currency: string
  taxRate: number
  serviceCommission: number
}

/**
 * Default branch settings
 */
export const DEFAULT_BRANCH_SETTINGS: BranchSettings = {
  autoAcceptBookings: true,
  allowWalkIns: true,
  requireDeposit: false,
  depositAmount: 50000,
  cancellationPolicy: '24 jam sebelumnya',
  maxAdvanceBooking: 30,
  timezone: 'Asia/Jakarta',
  currency: 'IDR',
  taxRate: 10,
  serviceCommission: 15
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Branch form data
 */
export interface BranchFormData {
  name: string
  address: string
  phone: string
  manager: string
  openTime: string
  closeTime: string
}

/**
 * Default branch form
 */
export const DEFAULT_BRANCH_FORM: BranchFormData = {
  name: '',
  address: '',
  phone: '',
  manager: '',
  openTime: '09:00',
  closeTime: '21:00'
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Branch filter options
 */
export interface BranchFilters {
  searchTerm: string
  status: 'all' | BranchStatus
}

/**
 * Default filters
 */
export const DEFAULT_BRANCH_FILTERS: BranchFilters = {
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
 * Branch summary statistics
 */
export interface BranchSummary {
  totalBranches: number
  activeBranches: number
  inactiveBranches: number
  maintenanceBranches: number
  totalRevenue: number
  totalCustomers: number
  averageRating: number
}

/**
 * Default summary
 */
export const DEFAULT_BRANCH_SUMMARY: BranchSummary = {
  totalBranches: 0,
  activeBranches: 0,
  inactiveBranches: 0,
  maintenanceBranches: 0,
  totalRevenue: 0,
  totalCustomers: 0,
  averageRating: 0
}

// ============================================================================
// DAYS OF WEEK
// ============================================================================

/**
 * Days of week
 */
export const DAYS_OF_WEEK = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu'
] as const

export type DayOfWeek = typeof DAYS_OF_WEEK[number]
