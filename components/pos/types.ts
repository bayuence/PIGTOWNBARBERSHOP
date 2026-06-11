/**
 * POS System Type Definitions
 * 
 * Centralized type definitions for the Point of Sale system.
 * All types used across POS components are defined here.
 */

import type { ServiceWithCategory, Branch, ReceiptTemplateWithBranch, OutletStock } from "@/lib/supabase"

// ============================================================================
// CART TYPES
// ============================================================================

/**
 * Item in shopping cart
 */
export interface CartItem {
  service: ServiceWithCategory
  quantity: number
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

/**
 * Available payment methods
 */
export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit'

/**
 * Payment information
 */
export interface PaymentInfo {
  method: PaymentMethod
  cashAmount: string
  changeAmount: number
}

// ============================================================================
// DISCOUNT TYPES
// ============================================================================

/**
 * Discount calculation type
 */
export type DiscountType = 'percentage' | 'fixed'

/**
 * Discount information
 */
export interface DiscountInfo {
  type: DiscountType
  value: string
  reason: string
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * POS Transaction data
 */
export interface POSTransaction {
  id: string
  transaction_number: string
  customer_name: string
  payment_method: PaymentMethod
  payment_status: 'pending' | 'completed' | 'cancelled'
  total_amount: number
  discount_amount: number
  notes: string | null
  created_at: string
  branch_id: string
  cashier_id: string
  server_id: string | null
  branch?: Branch | null
  cashier?: { name: string } | null
  server?: { name: string } | null
}

/**
 * Checkout data to be submitted
 */
export interface CheckoutData {
  customerName: string
  selectedBranch: string
  servingEmployee: string
  paymentMethod: PaymentMethod
  cashAmount: string
  discountType: DiscountType
  discountValue: string
  discountReason: string
}

// ============================================================================
// RECEIPT TYPES
// ============================================================================

/**
 * Receipt data for printing
 */
export interface ReceiptData {
  transaction: POSTransaction
  items: CartItem[]
  template: ReceiptTemplateWithBranch | null
  branch: Branch | null
  subtotal: number
  discount: number
  total: number
}

// ============================================================================
// BLUETOOTH TYPES
// ============================================================================

/**
 * Bluetooth device (browser API)
 */
export type BluetoothDevice = any

/**
 * Bluetooth GATT characteristic (browser API)
 */
export type BluetoothRemoteGATTCharacteristic = any

/**
 * Bluetooth connection state
 */
export interface BluetoothState {
  connected: boolean
  device: BluetoothDevice | null
  characteristic: BluetoothRemoteGATTCharacteristic | null
  error: string | null
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

/**
 * Employee/User data
 */
export interface Employee {
  id: string
  name: string
  position: string
  status: 'active' | 'inactive'
  branch_id?: string
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/**
 * Service category
 */
export interface ServiceCategory {
  id: string
  name: string
  description?: string
  created_at: string
}

/**
 * Service type filter
 */
export type ServiceType = "all" | "service" | "product"

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * POS filters state
 */
export interface POSFilters {
  selectedCategory: string
  selectedType: ServiceType
}

// ============================================================================
// MODAL STATE TYPES
// ============================================================================

/**
 * Modal states for POS system
 */
export interface POSModalState {
  isCheckoutOpen: boolean
  isReceiptOpen: boolean
  isCartOpen: boolean
  isBluetoothOpen: boolean
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

/**
 * Price calculation result
 */
export interface PriceCalculation {
  subtotal: number
  discountAmount: number
  total: number
}

// ============================================================================
// STOCK TYPES
// ============================================================================

/**
 * Stock availability check result
 */
export interface StockCheckResult {
  available: boolean
  currentStock: number
  requiredQuantity: number
  message?: string
}

// ============================================================================
// RE-EXPORT SUPABASE TYPES
// ============================================================================

export type {
  ServiceWithCategory,
  Branch,
  ReceiptTemplateWithBranch,
  OutletStock
}
