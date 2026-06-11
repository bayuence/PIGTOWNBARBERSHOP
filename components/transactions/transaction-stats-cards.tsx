/**
 * Transaction Stats Cards Component
 * 
 * Displays transaction statistics in a responsive grid layout:
 * - Total transactions count
 * - Completed transactions count
 * - Total revenue
 * - Average transaction value
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Transaction } from "./types"
import {
  calculateTotalTransactions,
  calculateCompletedTransactions,
  calculateTotalRevenue,
  calculateAverageTransaction,
  getDateFilterLabel,
  formatCurrency
} from "@/lib/utils/transaction-helpers"

interface TransactionStatsCardsProps {
  /** Array of transactions to calculate stats from */
  transactions: Transaction[]
  /** Loading state - shows skeleton when true */
  loading: boolean
  /** Current date filter for label display */
  dateFilter: string
}

/**
 * Transaction Stats Cards
 * 
 * Responsive grid of statistics cards showing transaction metrics
 * 
 * @example
 * ```tsx
 * <TransactionStatsCards
 *   transactions={transactions}
 *   loading={loading}
 *   dateFilter="this_month"
 * />
 * ```
 */
export function TransactionStatsCards({
  transactions,
  loading,
  dateFilter
}: TransactionStatsCardsProps) {
  // Calculate statistics
  const totalTransactions = calculateTotalTransactions(transactions)
  const completedTransactions = calculateCompletedTransactions(transactions)
  const totalRevenue = calculateTotalRevenue(transactions, true)
  const averageTransaction = calculateAverageTransaction(transactions)

  // Get date filter label
  const dateLabel = getDateFilterLabel(dateFilter)

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2 p-3 md:p-4">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      {/* Total Transactions Card */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-600 line-clamp-1">
            Total Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-lg md:text-2xl font-bold text-gray-900">
            {totalTransactions}
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 truncate">
            {dateLabel}
          </p>
        </CardContent>
      </Card>

      {/* Completed Transactions Card */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-600 line-clamp-1">
            Transaksi Selesai
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-lg md:text-2xl font-bold text-green-600">
            {completedTransactions}
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 truncate">
            berhasil diselesaikan
          </p>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-600 line-clamp-1">
            Total Pendapatan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-sm md:text-2xl font-bold text-blue-600 truncate">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 truncate">
            dari transaksi selesai
          </p>
        </CardContent>
      </Card>

      {/* Average Transaction Card */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-600 line-clamp-2">
            Rata-rata Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <div className="text-sm md:text-2xl font-bold text-red-600 truncate">
            {formatCurrency(Math.round(averageTransaction))}
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 truncate">
            per transaksi
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
