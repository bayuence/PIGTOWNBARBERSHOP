/**
 * Shared TypeScript types for Transaction components
 * 
 * This file contains all interfaces and types used across
 * transaction-related components.
 */

// Re-export types from supabase
export type { Transaction, Branch } from "@/lib/supabase"

/**
 * Transaction Item
 * Represents a single item/service in a transaction
 */
export interface TransactionItem {
  id: string
  service_id: string
  quantity: number
  unit_price: number
  cost_price?: number
  total_price: number
  barber_id?: number
  service?: {
    name: string
    price: number
    cost_price?: number
  }
  commission_type?: 'percentage' | 'fixed'
  commission_value?: number
  commission_amount?: number
  has_commission?: boolean
  service_name?: string
  service_type?: string
  service_category?: string
  commission_status?: string
}

/**
 * Edit Transaction Data
 * Data structure for editing a transaction
 */
export interface EditTransactionData {
  customer_name: string
  payment_method: string
  payment_status: string
  notes: string
  discount_amount: number
  discount_type: "percentage" | "fixed"
  discount_value: string
  discount_reason: string
  items: TransactionItem[]
}

/**
 * Transaction Filters
 * Filter options for transaction list
 */
export interface TransactionFilters {
  searchTerm: string
  filterBranch: string
  filterStatus: string
  dateFilter: "today" | "this_week" | "this_month" | "custom"
  customStartDate: string
  customEndDate: string
}

/**
 * Export Options
 * Options for exporting transaction data
 */
export interface ExportOptions {
  startDate: string
  endDate: string
  branchId: string
  format: "pdf" | "excel"
}

/**
 * Service
 * Service/product information
 */
export interface Service {
  id: string
  name: string
  price: number
  type?: string
  category?: string
}

/**
 * Employee
 * Employee/user information
 */
export interface Employee {
  id: number
  name: string
  position?: string
  status?: string
}

/**
 * Commission Dialog Data
 * Data for commission management dialog
 */
export interface CommissionDialogData {
  index: number
  item: TransactionItem
}

/**
 * Date Range
 * Start and end date range
 */
export interface DateRange {
  startDate: string
  endDate: string
}

/**
 * Payment Method Type
 */
export type PaymentMethod = "cash" | "qris" | "debit" | "credit"

/**
 * Payment Status Type
 */
export type PaymentStatus = "completed" | "pending" | "refunded"

/**
 * Commission Type
 */
export type CommissionType = "percentage" | "fixed"

/**
 * Date Filter Type
 */
export type DateFilterType = "today" | "this_week" | "this_month" | "custom"
