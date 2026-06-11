/**
 * Branch Management Helper Functions
 * 
 * Utility functions for branch calculations, formatting, and validation.
 * These functions are pure and have no side effects.
 */

import type {
  Branch,
  BranchStatus,
  BranchFormData,
  BranchFilters,
  BranchService,
  Shift,
  BranchTarget,
  BranchSettings,
  ValidationResult,
  BranchSummary,
  ServiceFormData,
  ShiftFormData,
  TargetFormData
} from "@/components/branches/types"

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format number to Indonesian Rupiah
 */
export function formatRupiah(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount)
}

/**
 * Format branch status for display
 */
export function formatBranchStatus(status: BranchStatus): string {
  const statusMap: Record<BranchStatus, string> = {
    active: "Aktif",
    inactive: "Tidak Aktif",
    maintenance: "Maintenance"
  }
  return statusMap[status] || status
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  return time
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  return phone
}

/**
 * Format rating
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total revenue from branches
 */
export function calculateTotalRevenue(branches: Branch[]): number {
  return branches.reduce((sum, branch) => {
    const revenue = typeof branch.revenue === 'string' 
      ? parseFloat(branch.revenue) 
      : branch.revenue
    return sum + (revenue || 0)
  }, 0)
}

/**
 * Calculate total customers from branches
 */
export function calculateTotalCustomers(branches: Branch[]): number {
  return branches.reduce((sum, branch) => sum + (branch.customers || 0), 0)
}

/**
 * Calculate average rating from branches
 */
export function calculateAverageRating(branches: Branch[]): number {
  if (branches.length === 0) return 0
  const totalRating = branches.reduce((sum, branch) => sum + (branch.rating || 0), 0)
  return totalRating / branches.length
}

/**
 * Calculate target progress percentage
 */
export function calculateTargetProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

/**
 * Calculate shift duration in hours
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return (endMinutes - startMinutes) / 60
}

/**
 * Calculate service total price
 */
export function calculateServiceTotal(services: BranchService[]): number {
  return services.reduce((sum, service) => sum + service.price, 0)
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate branch form data
 */
export function validateBranchForm(data: BranchFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.name.trim()) {
    errors.name = "Nama cabang harus diisi"
  }
  
  if (!data.address.trim()) {
    errors.address = "Alamat harus diisi"
  }
  
  if (!data.phone.trim()) {
    errors.phone = "Nomor telepon harus diisi"
  }
  
  if (!data.manager.trim()) {
    errors.manager = "Manager harus diisi"
  }
  
  if (!data.openTime) {
    errors.openTime = "Jam buka harus diisi"
  }
  
  if (!data.closeTime) {
    errors.closeTime = "Jam tutup harus diisi"
  }
  
  // Validate time range
  if (data.openTime && data.closeTime && data.openTime >= data.closeTime) {
    errors.closeTime = "Jam tutup harus setelah jam buka"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate service form data
 */
export function validateServiceForm(data: ServiceFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.name.trim()) {
    errors.name = "Nama layanan harus diisi"
  }
  
  if (data.price <= 0) {
    errors.price = "Harga harus lebih dari 0"
  }
  
  if (data.duration <= 0) {
    errors.duration = "Durasi harus lebih dari 0"
  }
  
  if (!data.category.trim()) {
    errors.category = "Kategori harus diisi"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate shift form data
 */
export function validateShiftForm(data: ShiftFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.name.trim()) {
    errors.name = "Nama shift harus diisi"
  }
  
  if (!data.startTime) {
    errors.startTime = "Jam mulai harus diisi"
  }
  
  if (!data.endTime) {
    errors.endTime = "Jam selesai harus diisi"
  }
  
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.endTime = "Jam selesai harus setelah jam mulai"
  }
  
  if (data.days.length === 0) {
    errors.days = "Minimal pilih 1 hari"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate target form data
 */
export function validateTargetForm(data: TargetFormData): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (data.target <= 0) {
    errors.target = "Target harus lebih dari 0"
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate phone number format
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter branches by search term and status
 */
export function filterBranches(
  branches: Branch[],
  filters: BranchFilters
): Branch[] {
  let filtered = [...branches]
  
  // Apply search filter
  if (filters.searchTerm) {
    filtered = searchBranches(filtered, filters.searchTerm)
  }
  
  // Apply status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(branch => branch.status === filters.status)
  }
  
  return filtered
}

/**
 * Search branches by term
 */
export function searchBranches(branches: Branch[], searchTerm: string): Branch[] {
  const term = searchTerm.toLowerCase().trim()
  
  if (!term) return branches
  
  return branches.filter(branch => {
    return (
      branch.name.toLowerCase().includes(term) ||
      branch.address.toLowerCase().includes(term) ||
      branch.phone.toLowerCase().includes(term) ||
      branch.manager.toLowerCase().includes(term)
    )
  })
}

/**
 * Sort branches by field
 */
export function sortBranches(
  branches: Branch[],
  sortBy: string,
  order: 'asc' | 'desc'
): Branch[] {
  const sorted = [...branches]
  
  sorted.sort((a, b) => {
    let aValue: any = a[sortBy as keyof Branch]
    let bValue: any = b[sortBy as keyof Branch]
    
    if (aValue === null) aValue = ''
    if (bValue === null) bValue = ''
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return order === 'asc' ? aValue - bValue : bValue - aValue
  })
  
  return sorted
}

// ============================================================================
// STATUS HELPER FUNCTIONS
// ============================================================================

/**
 * Get status badge color
 */
export function getStatusColor(status: BranchStatus): string {
  const colorMap: Record<BranchStatus, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    maintenance: "bg-yellow-100 text-yellow-800"
  }
  return colorMap[status] || colorMap.active
}

/**
 * Check if branch is active
 */
export function isBranchActive(branch: Branch): boolean {
  return branch.status === 'active'
}

/**
 * Check if branch is inactive
 */
export function isBranchInactive(branch: Branch): boolean {
  return branch.status === 'inactive'
}

/**
 * Check if branch is in maintenance
 */
export function isBranchMaintenance(branch: Branch): boolean {
  return branch.status === 'maintenance'
}

// ============================================================================
// TARGET HELPER FUNCTIONS
// ============================================================================

/**
 * Get target status color based on progress
 */
export function getTargetStatusColor(current: number, target: number): string {
  const progress = calculateTargetProgress(current, target)
  
  if (progress >= 100) return "text-green-600"
  if (progress >= 75) return "text-blue-600"
  if (progress >= 50) return "text-yellow-600"
  return "text-red-600"
}

/**
 * Format target type for display
 */
export function formatTargetType(type: string): string {
  const typeMap: Record<string, string> = {
    revenue: "Revenue",
    customers: "Pelanggan",
    services: "Layanan"
  }
  return typeMap[type] || type
}

/**
 * Format target period for display
 */
export function formatTargetPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    daily: "Harian",
    weekly: "Mingguan",
    monthly: "Bulanan"
  }
  return periodMap[period] || period
}

// ============================================================================
// STATISTICS HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate branch summary statistics
 */
export function calculateBranchSummary(branches: Branch[]): BranchSummary {
  const activeBranches = branches.filter(isBranchActive).length
  const inactiveBranches = branches.filter(isBranchInactive).length
  const maintenanceBranches = branches.filter(isBranchMaintenance).length
  
  const totalRevenue = calculateTotalRevenue(branches)
  const totalCustomers = calculateTotalCustomers(branches)
  const averageRating = calculateAverageRating(branches)
  
  return {
    totalBranches: branches.length,
    activeBranches,
    inactiveBranches,
    maintenanceBranches,
    totalRevenue,
    totalCustomers,
    averageRating
  }
}

/**
 * Get top performing branches by revenue
 */
export function getTopBranches(branches: Branch[], limit: number = 5): Branch[] {
  return branches
    .filter(isBranchActive)
    .sort((a, b) => {
      const aRevenue = typeof a.revenue === 'string' ? parseFloat(a.revenue) : a.revenue
      const bRevenue = typeof b.revenue === 'string' ? parseFloat(b.revenue) : b.revenue
      return bRevenue - aRevenue
    })
    .slice(0, limit)
}

// ============================================================================
// SERVICE HELPER FUNCTIONS
// ============================================================================

/**
 * Get active services count
 */
export function getActiveServicesCount(services: BranchService[]): number {
  return services.filter(s => s.aktif).length
}

/**
 * Get services by category
 */
export function getServicesByCategory(services: BranchService[], category: string): BranchService[] {
  return services.filter(s => s.category === category)
}

// ============================================================================
// SHIFT HELPER FUNCTIONS
// ============================================================================

/**
 * Get active shifts count
 */
export function getActiveShiftsCount(shifts: Shift[]): number {
  return shifts.filter(s => s.status === 'active').length
}

/**
 * Check if shift has available slots
 */
export function hasAvailableSlots(shift: Shift): boolean {
  return shift.currentEmployees < shift.maxEmployees
}

/**
 * Format shift days for display
 */
export function formatShiftDays(days: string[]): string {
  if (days.length === 0) return "-"
  if (days.length === 7) return "Setiap Hari"
  return days.join(", ")
}
