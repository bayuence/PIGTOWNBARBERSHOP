/**
 * Transaction Components Barrel Export
 * 
 * Central export point for all transaction-related components and utilities.
 * This file provides a clean import interface for consumers.
 * 
 * @example
 * ```typescript
 * // Instead of multiple imports:
 * import { TransactionTable } from './transactions/transaction-table'
 * import { TransactionFilters } from './transactions/transaction-filters'
 * import type { Transaction } from './transactions/types'
 * 
 * // Use single import:
 * import { TransactionTable, TransactionFilters, type Transaction } from './transactions'
 * ```
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { TransactionStatsCards } from './transaction-stats-cards'
export { TransactionDeleteDialog } from './transaction-delete-dialog'
export { TransactionExportModal } from './transaction-export-modal'
export { TransactionFilters } from './transaction-filters'
export { TransactionTable } from './transaction-table'
export { TransactionDetailModal } from './transaction-detail-modal'
export { TransactionEditModal } from './transaction-edit-modal'
export { TransactionCommissionDialog } from './transaction-commission-dialog'

// ============================================================================
// TYPES
// ============================================================================

export type {
  Transaction,
  TransactionItem,
  Branch,
  Service,
  Employee,
  EditTransactionData,
  TransactionFilters,
  ExportOptions,
  PaymentMethod,
  PaymentStatus,
  CommissionType,
  DateFilterType,
} from './types'
