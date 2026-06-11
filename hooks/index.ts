/**
 * ========================================
 * CUSTOM HOOKS - BARREL EXPORT
 * ========================================
 * Central export point for all custom hooks
 */

// Data fetching hooks
export { useTransactions } from './use-transactions'
export { useServices } from './use-services'
export { useEmployees } from './use-employees'
export { useBranches } from './use-branches'
export { useAttendance } from './use-attendance'
export { useExpenses } from './use-expenses'
export { useKasbon } from './use-kasbon'

// Utility hooks
export { useRealtimeSubscription } from './use-realtime-subscription'
export { useAuth } from './use-auth'

// Type exports
export type { UseTransactionsOptions, UseTransactionsReturn } from './use-transactions'
export type { UseServicesOptions, UseServicesReturn } from './use-services'
export type { UseEmployeesOptions, UseEmployeesReturn } from './use-employees'
export type { UseBranchesOptions, UseBranchesReturn } from './use-branches'
export type { UseAttendanceOptions, UseAttendanceReturn } from './use-attendance'
export type { UseExpensesOptions, UseExpensesReturn } from './use-expenses'
export type { UseKasbonOptions, UseKasbonReturn } from './use-kasbon'
export type { UseRealtimeSubscriptionOptions } from './use-realtime-subscription'
export type { UseAuthReturn } from './use-auth'
