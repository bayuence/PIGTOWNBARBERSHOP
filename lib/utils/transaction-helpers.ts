/**
 * Transaction Helper Utilities
 * 
 * Utility functions for formatting and calculating transaction data
 */

import type { Transaction, PaymentMethod, PaymentStatus } from "@/components/transactions/types"

/**
 * Get color class for payment status badge
 * @param status - Payment status
 * @returns Tailwind CSS classes for badge styling
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "refunded":
      return "bg-red-100 text-red-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Get color class for payment method badge
 * @param method - Payment method
 * @returns Tailwind CSS classes for badge styling
 */
export const getPaymentMethodColor = (method: string): string => {
  switch (method) {
    case "cash":
      return "bg-blue-100 text-blue-800"
    case "qris":
      return "bg-red-100 text-red-800"
    case "debit":
      return "bg-orange-100 text-orange-800"
    case "credit":
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Format payment method for display
 * @param method - Payment method code
 * @returns Formatted payment method name in Indonesian
 */
export const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case "cash":
      return "Tunai"
    case "qris":
      return "QRIS"
    case "debit":
      return "Kartu Debit"
    case "credit":
      return "Kartu Kredit"
    default:
      return method
  }
}

/**
 * Format payment status for display
 * @param status - Payment status code
 * @returns Formatted status name in Indonesian
 */
export const formatStatus = (status: string): string => {
  switch (status) {
    case "completed":
      return "Selesai"
    case "refunded":
      return "Refund"
    case "pending":
      return "Pending"
    default:
      return status
  }
}

/**
 * Format time from ISO date string
 * @param dateString - ISO date string
 * @returns Formatted time (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("id-ID", { 
    hour: "2-digit", 
    minute: "2-digit" 
  })
}

/**
 * Format date from ISO date string
 * @param dateString - ISO date string
 * @returns Formatted date (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

/**
 * Format currency to Indonesian Rupiah
 * @param amount - Amount in rupiah
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Calculate total revenue from transactions
 * @param transactions - Array of transactions
 * @param filterCompleted - Only count completed transactions
 * @returns Total revenue amount
 */
export const calculateTotalRevenue = (
  transactions: Transaction[], 
  filterCompleted: boolean = true
): number => {
  return transactions
    .filter((t) => !filterCompleted || t.payment_status === "completed")
    .reduce((sum, t) => sum + (t.total_amount || 0), 0)
}

/**
 * Calculate total transactions count
 * @param transactions - Array of transactions
 * @returns Total count
 */
export const calculateTotalTransactions = (transactions: Transaction[]): number => {
  return transactions.length
}

/**
 * Calculate completed transactions count
 * @param transactions - Array of transactions
 * @returns Completed count
 */
export const calculateCompletedTransactions = (transactions: Transaction[]): number => {
  return transactions.filter((t) => t.payment_status === "completed").length
}

/**
 * Calculate average transaction value
 * @param transactions - Array of transactions
 * @returns Average transaction amount
 */
export const calculateAverageTransaction = (transactions: Transaction[]): number => {
  const completed = transactions.filter((t) => t.payment_status === "completed")
  if (completed.length === 0) return 0
  
  const total = completed.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  return total / completed.length
}

/**
 * Get date range based on filter type
 * @param filter - Date filter type
 * @param customStart - Custom start date (for custom filter)
 * @param customEnd - Custom end date (for custom filter)
 * @returns Object with startDate and endDate
 */
export const getDateRange = (
  filter: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } => {
  const now = new Date()
  let startDate: string = now.toISOString().split("T")[0]
  let endDate: string = now.toISOString().split("T")[0]

  switch (filter) {
    case "today":
      startDate = now.toISOString().split("T")[0]
      endDate = startDate
      break

    case "this_week":
      const startOfWeek = new Date(now)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startDate = startOfWeek.toISOString().split("T")[0]

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endDate = endOfWeek.toISOString().split("T")[0]
      break

    case "this_month":
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`
      break

    case "custom":
      if (customStart && customEnd) {
        startDate = customStart
        endDate = customEnd
      }
      break
  }

  return { startDate, endDate }
}

/**
 * Get date filter label for display
 * @param filter - Date filter type
 * @returns Formatted label in Indonesian
 */
export const getDateFilterLabel = (filter: string): string => {
  switch (filter) {
    case "today":
      return "Hari Ini"
    case "this_week":
      return "Minggu Ini"
    case "this_month":
      return "Bulan Ini"
    case "custom":
      return "Rentang Custom"
    default:
      return "Hari Ini"
  }
}

/**
 * Check if transaction matches search term
 * @param transaction - Transaction to check
 * @param searchTerm - Search term
 * @returns True if matches
 */
export const matchesSearch = (transaction: Transaction, searchTerm: string): boolean => {
  if (!searchTerm) return true
  
  const term = searchTerm.toLowerCase()
  return (
    transaction.transaction_number?.toLowerCase().includes(term) ||
    transaction.customer_name?.toLowerCase().includes(term) ||
    transaction.server?.name?.toLowerCase().includes(term) ||
    transaction.branch?.name?.toLowerCase().includes(term) ||
    false
  )
}

/**
 * Filter transactions based on criteria
 * @param transactions - Array of transactions
 * @param filters - Filter criteria
 * @returns Filtered transactions
 */
export const filterTransactions = (
  transactions: Transaction[],
  filters: {
    searchTerm?: string
    branchId?: string
    status?: string
  }
): Transaction[] => {
  return transactions.filter((transaction) => {
    const matchesSearchTerm = !filters.searchTerm || matchesSearch(transaction, filters.searchTerm)
    const matchesBranch = !filters.branchId || filters.branchId === "all" || transaction.branch_id === filters.branchId
    const matchesStatus = !filters.status || filters.status === "all" || transaction.payment_status === filters.status
    
    return matchesSearchTerm && matchesBranch && matchesStatus
  })
}
