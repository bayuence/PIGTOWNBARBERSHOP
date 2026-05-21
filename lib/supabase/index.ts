/**
 * Supabase Module - Main Entry Point
 * 
 * File ini mengexport semua fungsi dari modul supabase yang sudah direfactor.
 * Struktur baru lebih rapi dan mudah di-maintain.
 * 
 * Struktur:
 * - client.ts: Supabase client & configuration
 * - types.ts: All TypeScript interfaces
 * - realtime.ts: Real-time subscriptions
 * - utils.ts: Utility functions
 * 
 * Import semua fungsi dari file lama (supabase.ts) masih bisa dilakukan
 * dengan cara: import { ... } from '@/lib/supabase'
 */

// =============================
// EXPORTS
// =============================

// Client & Configuration
export { supabase, testSupabaseConnection } from './client'

// Types
export type {
  User,
  Branch,
  BranchShift,
  Service,
  Transaction,
  TransactionWithItems,
  TransactionItem,
  TransactionItemWithService,
  Attendance,
  Kasbon,
  Expense,
  Commission,
  CommissionRule,
  Point,
  Customer,
  EmployeeStats,
  BranchStats,
  DashboardStats,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  UserStatus,
  AttendanceStatus,
  KasbonStatus,
  ExpenseStatus,
  CommissionStatus,
} from './types'

// Real-time
export {
  setupTransactionsRealtime,
  setupAttendanceRealtime,
  setupExpensesRealtime,
  setupKasbonRealtime,
  setupCommissionsRealtime,
  setupPointsRealtime,
  subscribeToEvents,
  broadcastTransactionEvent,
  broadcastAttendanceEvent,
  broadcastExpenseEvent,
  broadcastKasbonEvent,
  removeChannel,
  removeAllChannels,
} from './realtime'

// Utilities
export {
  getBusinessDaysCount,
  formatDateIndonesia,
  formatTimeIndonesia,
  getDateRange,
  formatRupiah,
  formatNumber,
  calculatePercentage,
  calculateDiscount,
  generateTransactionNumber,
  generateReceiptNumber,
  capitalizeFirst,
  truncateText,
  isValidEmail,
  isValidPhone,
  isValidPIN,
  groupBy,
  sumBy,
  unique,
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  clearStorage,
} from './utils'
