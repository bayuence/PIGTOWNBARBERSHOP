/**
 * Employee Management Helper Functions
 * 
 * Utility functions for employee calculations, formatting, and validation.
 * These functions are pure and have no side effects.
 */

import type {
  Employee,
  EmployeeStatus,
  EmployeeStats,
  EmployeeFormData,
  PayrollFormData,
  EmployeeFilters,
  ValidationResult,
  EmployeeSummary,
  EmployeeSort
} from "@/components/employees/types"

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format number to Indonesian Rupiah
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string
 * 
 * @example
 * formatRupiah(3000000) // "Rp 3.000.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format number to Indonesian Rupiah with decimals
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string with decimals
 * 
 * @example
 * formatRupiahDecimal(3000000.50) // "Rp 3.000.000,50"
 */
export function formatRupiahDecimal(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format employee status for display
 * 
 * @param status - Employee status
 * @returns Formatted status string
 * 
 * @example
 * formatEmployeeStatus("active") // "Aktif"
 */
export function formatEmployeeStatus(status: EmployeeStatus): string {
  const statusMap: Record<EmployeeStatus, string> = {
    active: "Aktif",
    inactive: "Tidak Aktif",
    "on-leave": "Cuti"
  }
  return statusMap[status] || status
}

/**
 * Format position for display
 * 
 * @param position - Position string
 * @returns Formatted position
 * 
 * @example
 * formatPosition("barber") // "Barber"
 */
export function formatPosition(position: string): string {
  return position.charAt(0).toUpperCase() + position.slice(1).toLowerCase()
}

/**
 * Get initials from name
 * 
 * @param name - Full name
 * @returns Initials (max 2 characters)
 * 
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Ahmad") // "A"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format phone number
 * 
 * @param phone - Phone number
 * @returns Formatted phone number
 * 
 * @example
 * formatPhone("081234567890") // "+62 812-3456-7890"
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return "-"
  // Simple formatting, can be enhanced
  return phone
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total salary including commission and overtime
 * 
 * @param employee - Employee data
 * @param stats - Employee statistics
 * @returns Total salary amount
 * 
 * @example
 * calculateTotalSalary(employee, stats) // 5000000
 */
export function calculateTotalSalary(employee: Employee, stats: EmployeeStats): number {
  const baseSalary = employee.salary || 3000000
  const commission = stats.totalCommission || 0
  return baseSalary + commission
}

/**
 * Calculate monthly earnings
 * 
 * @param baseSalary - Base salary
 * @param commission - Commission amount
 * @param overtime - Overtime pay
 * @returns Total monthly earnings
 * 
 * @example
 * calculateMonthlyEarnings(3000000, 500000, 200000) // 3700000
 */
export function calculateMonthlyEarnings(
  baseSalary: number,
  commission: number,
  overtime: number
): number {
  return baseSalary + commission + overtime
}

/**
 * Calculate attendance rate percentage
 * 
 * @param presentDays - Number of present days
 * @param totalDays - Total working days
 * @returns Attendance rate (0-100)
 * 
 * @example
 * calculateAttendanceRate(20, 22) // 90.91
 */
export function calculateAttendanceRate(presentDays: number, totalDays: number): number {
  if (totalDays === 0) return 0
  return Math.round((presentDays / totalDays) * 100 * 100) / 100
}

/**
 * Calculate overtime pay
 * 
 * @param hours - Overtime hours
 * @param rate - Hourly rate
 * @returns Overtime pay amount
 * 
 * @example
 * calculateOvertimePay(10, 50000) // 500000
 */
export function calculateOvertimePay(hours: number, rate: number): number {
  return hours * rate
}

/**
 * Calculate bonus/penalty total
 * 
 * @param bonusPoints - Bonus points
 * @param penaltyPoints - Penalty points
 * @param pointValue - Value per point
 * @returns Net bonus/penalty amount
 * 
 * @example
 * calculateBonusPenalty(10, 3, 10000) // 70000
 */
export function calculateBonusPenalty(
  bonusPoints: number,
  penaltyPoints: number,
  pointValue: number
): number {
  return (bonusPoints - penaltyPoints) * pointValue
}

/**
 * Calculate average performance score
 * 
 * @param stats - Employee statistics
 * @returns Performance score (0-100)
 */
export function calculateAveragePerformance(stats: EmployeeStats): number {
  // Simple performance calculation based on transactions and revenue
  const transactionScore = Math.min(stats.totalTransactions / 100 * 50, 50)
  const revenueScore = Math.min(stats.totalRevenue / 10000000 * 30, 30)
  const bonusScore = Math.min(stats.bonusPoints / 10 * 20, 20)
  
  return Math.round(transactionScore + revenueScore + bonusScore)
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate employee form data
 * 
 * @param data - Employee form data
 * @returns Validation result
 * 
 * @example
 * validateEmployeeForm(formData)
 * // { valid: true, errors: {} }
 */
export function validateEmployeeForm(data: EmployeeFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  // Name validation
  if (!data.name.trim()) {
    errors.name = "Nama harus diisi"
  } else if (data.name.trim().length < 3) {
    errors.name = "Nama minimal 3 karakter"
  }
  
  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email harus diisi"
  } else if (!validateEmail(data.email)) {
    errors.email = "Format email tidak valid"
  }
  
  // Phone validation (optional)
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = "Format nomor telepon tidak valid"
  }
  
  // Position validation
  if (!data.position.trim()) {
    errors.position = "Posisi harus diisi"
  }
  
  // PIN validation
  if (!validatePIN(data.pin)) {
    errors.pin = "PIN harus 6 digit angka"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate email format
 * 
 * @param email - Email address
 * @returns True if valid
 * 
 * @example
 * validateEmail("user@example.com") // true
 * validateEmail("invalid") // false
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format
 * 
 * @param phone - Phone number
 * @returns True if valid
 * 
 * @example
 * validatePhone("081234567890") // true
 * validatePhone("123") // false
 */
export function validatePhone(phone: string): boolean {
  // Indonesian phone number format
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

/**
 * Validate PIN format
 * 
 * @param pin - PIN code
 * @returns True if valid
 * 
 * @example
 * validatePIN("123456") // true
 * validatePIN("12345") // false
 */
export function validatePIN(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

/**
 * Validate payroll form data
 * 
 * @param data - Payroll form data
 * @returns Validation result
 */
export function validatePayrollForm(data: PayrollFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (data.baseSalary < 0) {
    errors.baseSalary = "Gaji pokok tidak boleh negatif"
  }
  
  if (data.commissionRate < 0 || data.commissionRate > 100) {
    errors.commissionRate = "Rate komisi harus 0-100%"
  }
  
  if (data.overtimeRate < 0) {
    errors.overtimeRate = "Rate lembur tidak boleh negatif"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter employees by search term and status
 * 
 * @param employees - Array of employees
 * @param filters - Filter options
 * @returns Filtered employees
 * 
 * @example
 * filterEmployees(employees, { searchTerm: "john", status: "active" })
 */
export function filterEmployees(
  employees: Employee[],
  filters: EmployeeFilters
): Employee[] {
  let filtered = [...employees]
  
  // Apply search filter
  if (filters.searchTerm) {
    filtered = searchEmployees(filtered, filters.searchTerm)
  }
  
  // Apply status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(emp => emp.status === filters.status)
  }
  
  return filtered
}

/**
 * Search employees by term
 * 
 * @param employees - Array of employees
 * @param searchTerm - Search term
 * @returns Matching employees
 * 
 * @example
 * searchEmployees(employees, "john")
 */
export function searchEmployees(employees: Employee[], searchTerm: string): Employee[] {
  const term = searchTerm.toLowerCase().trim()
  
  if (!term) return employees
  
  return employees.filter(employee => {
    return (
      employee.name.toLowerCase().includes(term) ||
      employee.email.toLowerCase().includes(term) ||
      (employee.phone?.toLowerCase() || '').includes(term) ||
      employee.position.toLowerCase().includes(term)
    )
  })
}

/**
 * Sort employees by field
 * 
 * @param employees - Array of employees
 * @param sortBy - Field to sort by
 * @param order - Sort order
 * @returns Sorted employees
 * 
 * @example
 * sortEmployees(employees, "name", "asc")
 */
export function sortEmployees(
  employees: Employee[],
  sortBy: string,
  order: 'asc' | 'desc'
): Employee[] {
  const sorted = [...employees]
  
  sorted.sort((a, b) => {
    let aValue: any = a[sortBy as keyof Employee]
    let bValue: any = b[sortBy as keyof Employee]
    
    // Handle null values
    if (aValue === null) aValue = ''
    if (bValue === null) bValue = ''
    
    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    // Number comparison
    return order === 'asc' ? aValue - bValue : bValue - aValue
  })
  
  return sorted
}

// ============================================================================
// STATUS HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge color
 * 
 * @param status - Employee status
 * @returns Tailwind CSS classes
 * 
 * @example
 * getStatusColor("active") // "bg-green-100 text-green-800"
 */
export function getStatusColor(status: EmployeeStatus): string {
  const colorMap: Record<EmployeeStatus, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    "on-leave": "bg-yellow-100 text-yellow-800"
  }
  return colorMap[status] || colorMap.active
}

/**
 * Check if employee is active
 * 
 * @param employee - Employee data
 * @returns True if active
 */
export function isEmployeeActive(employee: Employee): boolean {
  return employee.status === 'active'
}

/**
 * Check if employee is on leave
 * 
 * @param employee - Employee data
 * @returns True if on leave
 */
export function isEmployeeOnLeave(employee: Employee): boolean {
  return employee.status === 'on-leave'
}

/**
 * Check if employee is inactive
 * 
 * @param employee - Employee data
 * @returns True if inactive
 */
export function isEmployeeInactive(employee: Employee): boolean {
  return employee.status === 'inactive'
}

// ============================================================================
// STATISTICS HELPER FUNCTIONS
// ============================================================================

/**
 * Get top performing employees
 * 
 * @param employees - Array of employees
 * @param stats - Employee statistics map
 * @param limit - Number of top performers
 * @returns Top performing employees
 * 
 * @example
 * getTopPerformers(employees, statsMap, 5)
 */
export function getTopPerformers(
  employees: Employee[],
  stats: Record<string, EmployeeStats>,
  limit: number = 5
): Employee[] {
  return employees
    .filter(emp => isEmployeeActive(emp))
    .sort((a, b) => {
      const aStats = stats[a.id]
      const bStats = stats[b.id]
      if (!aStats || !bStats) return 0
      return bStats.totalRevenue - aStats.totalRevenue
    })
    .slice(0, limit)
}

/**
 * Get employee rank by revenue
 * 
 * @param employee - Employee to rank
 * @param allEmployees - All employees
 * @param stats - Employee statistics map
 * @returns Rank (1-based)
 * 
 * @example
 * getEmployeeRank(employee, allEmployees, statsMap) // 3
 */
export function getEmployeeRank(
  employee: Employee,
  allEmployees: Employee[],
  stats: Record<string, EmployeeStats>
): number {
  const sorted = getTopPerformers(allEmployees, stats, allEmployees.length)
  return sorted.findIndex(emp => emp.id === employee.id) + 1
}

/**
 * Calculate employee summary statistics
 * 
 * @param employees - Array of employees
 * @param stats - Employee statistics map
 * @param absentEmployees - Absent employees today
 * @returns Summary statistics
 */
export function calculateEmployeeSummary(
  employees: Employee[],
  stats: Record<string, EmployeeStats>,
  absentEmployees: Employee[]
): EmployeeSummary {
  const activeEmployees = employees.filter(isEmployeeActive).length
  const inactiveEmployees = employees.filter(isEmployeeInactive).length
  const onLeaveEmployees = employees.filter(isEmployeeOnLeave).length
  
  const totalSalary = employees.reduce((sum, emp) => {
    const empStats = stats[emp.id]
    return sum + calculateTotalSalary(emp, empStats || {
      totalTransactions: 0,
      totalRevenue: 0,
      totalCommission: 0,
      averageTransaction: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      totalBonus: 0,
      totalPenalty: 0
    })
  }, 0)
  
  return {
    totalEmployees: employees.length,
    activeEmployees,
    inactiveEmployees,
    onLeaveEmployees,
    totalSalary,
    absentToday: absentEmployees.length
  }
}
