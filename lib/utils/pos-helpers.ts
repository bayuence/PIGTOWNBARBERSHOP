/**
 * POS System Helper Functions
 * 
 * Utility functions for POS calculations, formatting, and validation.
 * These functions are pure and have no side effects.
 */

import type {
  CartItem,
  DiscountInfo,
  PaymentMethod,
  PriceCalculation,
  StockCheckResult,
  OutletStock
} from "@/components/pos/types"

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format number to Indonesian Rupiah format
 * 
 * @param value - Number or string to format
 * @returns Formatted string (e.g., "50.000")
 * 
 * @example
 * formatRupiah(50000) // "50.000"
 * formatRupiah("50000") // "50.000"
 * formatRupiah("") // ""
 */
export function formatRupiah(value: string | number): string {
  if (!value && value !== 0) return ""
  const stringValue = String(value).replace(/[^0-9]/g, '')
  if (stringValue === "") return ""
  return new Intl.NumberFormat('id-ID').format(parseInt(stringValue, 10))
}

/**
 * Parse formatted Rupiah string to number
 * 
 * @param value - Formatted string to parse
 * @returns Parsed number
 * 
 * @example
 * parseNominal("50.000") // 50000
 * parseNominal("Rp 50.000") // 50000
 * parseNominal("") // 0
 */
export function parseNominal(value: string): number {
  if (!value) return 0
  return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0
}

/**
 * Format currency with Rp prefix
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(50000) // "Rp 50.000"
 */
export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return "Rp 0"
  return `Rp ${formatRupiah(amount)}`
}

/**
 * Format transaction number for display
 * 
 * @param number - Transaction number
 * @returns Formatted transaction number
 * 
 * @example
 * formatTransactionNumber("TRX-001") // "#TRX-001"
 */
export function formatTransactionNumber(number: string): string {
  return `#${number}`
}

/**
 * Format payment method for display
 * 
 * @param method - Payment method
 * @returns Formatted payment method string
 * 
 * @example
 * formatPaymentMethod("cash") // "Tunai"
 * formatPaymentMethod("qris") // "QRIS"
 */
export function formatPaymentMethod(method: PaymentMethod): string {
  const methodMap: Record<PaymentMethod, string> = {
    cash: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
    debit: "Debit"
  }
  return methodMap[method] || method
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate cart subtotal (before discount)
 * 
 * @param cart - Array of cart items
 * @returns Subtotal amount
 * 
 * @example
 * calculateSubtotal([
 *   { service: { price: 50000 }, quantity: 2 },
 *   { service: { price: 30000 }, quantity: 1 }
 * ]) // 130000
 */
export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => {
    return sum + (item.service.price * item.quantity)
  }, 0)
}

/**
 * Calculate discount amount
 * 
 * @param subtotal - Subtotal before discount
 * @param discount - Discount information
 * @returns Discount amount
 * 
 * @example
 * calculateDiscount(100000, { type: "percentage", value: "10", reason: "" }) // 10000
 * calculateDiscount(100000, { type: "fixed", value: "5000", reason: "" }) // 5000
 */
export function calculateDiscount(subtotal: number, discount: DiscountInfo): number {
  const value = parseNominal(discount.value)
  
  if (discount.type === "percentage") {
    return Math.round((subtotal * value) / 100)
  }
  
  return value
}

/**
 * Calculate final total (subtotal - discount)
 * 
 * @param subtotal - Subtotal before discount
 * @param discountAmount - Discount amount
 * @returns Final total
 * 
 * @example
 * calculateTotal(100000, 10000) // 90000
 */
export function calculateTotal(subtotal: number, discountAmount: number): number {
  return Math.max(0, subtotal - discountAmount)
}

/**
 * Calculate change amount for cash payment
 * 
 * @param total - Total amount to pay
 * @param paid - Amount paid by customer
 * @returns Change amount
 * 
 * @example
 * calculateChange(90000, 100000) // 10000
 * calculateChange(90000, 50000) // 0 (insufficient)
 */
export function calculateChange(total: number, paid: number): number {
  return Math.max(0, paid - total)
}

/**
 * Calculate all prices at once
 * 
 * @param cart - Array of cart items
 * @param discount - Discount information
 * @returns Price calculation result
 * 
 * @example
 * calculatePrices(cart, discount)
 * // { subtotal: 100000, discountAmount: 10000, total: 90000 }
 */
export function calculatePrices(cart: CartItem[], discount: DiscountInfo): PriceCalculation {
  const subtotal = calculateSubtotal(cart)
  const discountAmount = calculateDiscount(subtotal, discount)
  const total = calculateTotal(subtotal, discountAmount)
  
  return {
    subtotal,
    discountAmount,
    total
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate cart has items
 * 
 * @param cart - Array of cart items
 * @returns True if cart is valid
 * 
 * @example
 * validateCart([{ service: {...}, quantity: 1 }]) // true
 * validateCart([]) // false
 */
export function validateCart(cart: CartItem[]): boolean {
  return cart.length > 0
}

/**
 * Validate payment amount is sufficient
 * 
 * @param total - Total amount to pay
 * @param paid - Amount paid by customer
 * @param method - Payment method
 * @returns True if payment is valid
 * 
 * @example
 * validatePayment(90000, 100000, "cash") // true
 * validatePayment(90000, 50000, "cash") // false
 * validatePayment(90000, 0, "qris") // true (non-cash doesn't need amount)
 */
export function validatePayment(total: number, paid: number, method: PaymentMethod): boolean {
  // For non-cash payments, we don't validate amount
  if (method !== "cash") return true
  
  // For cash, paid amount must be >= total
  return paid >= total
}

/**
 * Validate discount information
 * 
 * @param discount - Discount information
 * @param subtotal - Subtotal amount
 * @returns True if discount is valid
 * 
 * @example
 * validateDiscount({ type: "percentage", value: "10", reason: "Promo" }, 100000) // true
 * validateDiscount({ type: "percentage", value: "150", reason: "" }, 100000) // false (>100%)
 * validateDiscount({ type: "fixed", value: "150000", reason: "" }, 100000) // false (>subtotal)
 */
export function validateDiscount(discount: DiscountInfo, subtotal: number): boolean {
  const value = parseNominal(discount.value)
  
  // No discount is valid
  if (value === 0) return true
  
  // Percentage discount must be 0-100
  if (discount.type === "percentage") {
    return value >= 0 && value <= 100
  }
  
  // Fixed discount must not exceed subtotal
  return value >= 0 && value <= subtotal
}

/**
 * Validate customer name
 * 
 * @param name - Customer name
 * @returns True if name is valid
 * 
 * @example
 * validateCustomerName("John Doe") // true
 * validateCustomerName("") // false
 * validateCustomerName("   ") // false
 */
export function validateCustomerName(name: string): boolean {
  return name.trim().length > 0
}

/**
 * Validate branch selection
 * 
 * @param branchId - Selected branch ID
 * @returns True if branch is selected
 */
export function validateBranch(branchId: string): boolean {
  return branchId.trim().length > 0
}

// ============================================================================
// STOCK FUNCTIONS
// ============================================================================

/**
 * Check if product stock is available
 * 
 * @param item - Cart item to check
 * @param stock - Outlet stock data
 * @returns Stock check result
 * 
 * @example
 * checkStockAvailability(cartItem, outletStock)
 * // { available: true, currentStock: 10, requiredQuantity: 2 }
 */
export function checkStockAvailability(
  item: CartItem,
  stock: OutletStock[]
): StockCheckResult {
  // Services don't need stock check
  if (item.service.type === "service") {
    return {
      available: true,
      currentStock: Infinity,
      requiredQuantity: item.quantity
    }
  }
  
  // Find stock for this product
  const productStock = stock.find(s => s.product_id === item.service.id)
  
  if (!productStock) {
    return {
      available: false,
      currentStock: 0,
      requiredQuantity: item.quantity,
      message: "Stok tidak ditemukan"
    }
  }
  
  const available = productStock.quantity >= item.quantity
  
  return {
    available,
    currentStock: productStock.quantity,
    requiredQuantity: item.quantity,
    message: available ? undefined : "Stok tidak mencukupi"
  }
}

/**
 * Calculate remaining stock after cart items
 * 
 * @param item - Cart item
 * @param stock - Current outlet stock
 * @returns Remaining stock quantity
 */
export function calculateRemainingStock(item: CartItem, stock: OutletStock): number {
  return Math.max(0, stock.quantity - item.quantity)
}

/**
 * Check if all cart items have sufficient stock
 * 
 * @param cart - Array of cart items
 * @param stock - Outlet stock data
 * @returns True if all items have sufficient stock
 */
export function validateCartStock(cart: CartItem[], stock: OutletStock[]): boolean {
  return cart.every(item => {
    const result = checkStockAvailability(item, stock)
    return result.available
  })
}

// ============================================================================
// CART HELPER FUNCTIONS
// ============================================================================

/**
 * Find cart item index by service ID
 * 
 * @param cart - Array of cart items
 * @param serviceId - Service ID to find
 * @returns Index of item or -1 if not found
 */
export function findCartItemIndex(cart: CartItem[], serviceId: string): number {
  return cart.findIndex(item => item.service.id === serviceId)
}

/**
 * Check if service is already in cart
 * 
 * @param cart - Array of cart items
 * @param serviceId - Service ID to check
 * @returns True if service is in cart
 */
export function isServiceInCart(cart: CartItem[], serviceId: string): boolean {
  return findCartItemIndex(cart, serviceId) !== -1
}

/**
 * Get total items count in cart
 * 
 * @param cart - Array of cart items
 * @returns Total quantity of all items
 * 
 * @example
 * getCartItemsCount([
 *   { service: {...}, quantity: 2 },
 *   { service: {...}, quantity: 3 }
 * ]) // 5
 */
export function getCartItemsCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

// ============================================================================
// QUICK AMOUNT HELPERS
// ============================================================================

/**
 * Get quick amount suggestions for cash payment
 * 
 * @param total - Total amount to pay
 * @returns Array of suggested amounts
 * 
 * @example
 * getQuickAmounts(45000) // [50000, 100000, 200000]
 * getQuickAmounts(150000) // [150000, 200000, 500000]
 */
export function getQuickAmounts(total: number): number[] {
  const amounts = [50000, 100000, 200000, 500000, 1000000]
  
  // Find the first amount >= total
  const minAmount = amounts.find(amount => amount >= total)
  
  if (!minAmount) {
    // If total is very large, return multiples
    return [total, total * 2, total * 5]
  }
  
  // Return 3 amounts starting from minAmount
  const startIndex = amounts.indexOf(minAmount)
  return amounts.slice(startIndex, startIndex + 3)
}
