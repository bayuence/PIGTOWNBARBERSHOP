/**
 * POS Components Barrel Export
 * 
 * Central export point for all POS-related components and utilities.
 * This file provides a clean import interface for consumers.
 * 
 * @example
 * ```typescript
 * // Instead of multiple imports:
 * import { POSServiceGrid } from './pos/pos-service-grid'
 * import { POSCart } from './pos/pos-cart'
 * import type { CartItem } from './pos/types'
 * 
 * // Use single import:
 * import { POSServiceGrid, POSCart, type CartItem } from './pos'
 * ```
 */

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================

export { POSServiceGrid } from './pos-service-grid'
export { POSCart } from './pos-cart'
export { POSCartItem } from './pos-cart-item'

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

export { POSCustomerInput } from './pos-customer-input'
export { POSBarberSelector } from './pos-barber-selector'
export { POSDiscountForm } from './pos-discount-form'
export { POSPaymentForm } from './pos-payment-form'

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

export { POSCheckoutModal } from './pos-checkout-modal'
export { POSReceiptModal } from './pos-receipt-modal'

// ============================================================================
// TYPES
// ============================================================================

export type {
  CartItem,
  PaymentMethod,
  PaymentInfo,
  DiscountType,
  DiscountInfo,
  POSTransaction,
  CheckoutData,
  ReceiptData,
  BluetoothDevice,
  BluetoothRemoteGATTCharacteristic,
  BluetoothState,
  Employee,
  ServiceCategory,
  ServiceType,
  POSFilters,
  POSModalState,
  PriceCalculation,
  StockCheckResult,
  ServiceWithCategory,
  Branch,
  ReceiptTemplateWithBranch,
  OutletStock
} from './types'
