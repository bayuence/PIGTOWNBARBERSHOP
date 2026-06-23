/**
 * Transaction Table Component
 * 
 * Displays transaction list with:
 * - Transaction details (number, status, payment method)
 * - Customer and server information
 * - Transaction items with commission info
 * - Action buttons (view, edit, delete)
 * - Loading and empty states
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Eye, Edit, Trash2, Plus } from "lucide-react"
import type { Transaction } from "./types"
import {
  getStatusColor,
  getPaymentMethodColor,
  formatPaymentMethod,
  formatStatus,
  formatTime,
  getDateFilterLabel
} from "@/lib/utils/transaction-helpers"

interface TransactionTableProps {
  /** Array of transactions to display */
  transactions: Transaction[]
  /** Loading state */
  loading: boolean
  /** Total transactions count (before filtering) */
  totalCount: number
  /** Current date filter for label */
  dateFilter: string
  /** Callback when view detail is clicked */
  onViewDetail: (transaction: Transaction) => void
  /** Callback when edit is clicked */
  onEdit: (transaction: Transaction) => void
  /** Callback when delete is clicked */
  onDelete: (transaction: Transaction) => void
  /** Callback when commission button is clicked */
  onCommission?: (transaction: Transaction, itemIndex: number, item: any) => void
}

/**
 * Transaction Table
 * 
 * Displays transactions in a card-based list with full details
 * 
 * @example
 * ```tsx
 * <TransactionTable
 *   transactions={filteredTransactions}
 *   loading={loading}
 *   totalCount={transactions.length}
 *   dateFilter={dateFilter}
 *   onViewDetail={handleViewDetail}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onCommission={handleCommission}
 * />
 * ```
 */
export function TransactionTable({
  transactions,
  loading,
  totalCount,
  dateFilter,
  onViewDetail,
  onEdit,
  onDelete,
  onCommission
}: TransactionTableProps) {
  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi - {getDateFilterLabel(dateFilter)}</CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Memuat data transaksi...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi - {getDateFilterLabel(dateFilter)}</CardTitle>
          <CardDescription>
            {totalCount === 0
              ? "Tidak ada transaksi"
              : `Tidak ada transaksi yang sesuai dengan filter (Total: ${totalCount})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            {totalCount === 0
              ? "Tidak ada transaksi dalam periode ini."
              : "Tidak ada transaksi yang sesuai dengan filter."}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Transaksi - {getDateFilterLabel(dateFilter)}</CardTitle>
        <CardDescription>
          Menampilkan {transactions.length} transaksi dari total {totalCount} transaksi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm font-medium text-gray-900">
                    {transaction.transaction_number || `TX-${transaction.id.slice(0, 8)}`}
                  </div>
                  <Badge className={getStatusColor(transaction.payment_status || 'pending')}>
                    {formatStatus(transaction.payment_status || 'pending')}
                  </Badge>
                  <Badge className={getPaymentMethodColor(transaction.payment_method)}>
                    {formatPaymentMethod(transaction.payment_method)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {formatTime(transaction.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => onViewDetail(transaction)}
                  >
                    <Eye className="h-4 w-4" />
                    Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-blue-600 hover:text-blue-700"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-red-600 hover:text-red-700"
                    onClick={() => onDelete(transaction)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">
                    {transaction.customer_name || "Tidak ada nama"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Dilayani oleh:</span>
                  <div className="font-medium">
                    {transaction.server?.name || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Cabang:</span>
                  <div className="font-medium">
                    {transaction.branch?.name || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <div className="font-bold text-lg text-red-600">
                    Rp {transaction.total_amount?.toLocaleString("id-ID")}
                  </div>
                  {(() => {
                    const totalProfit = transaction.transaction_items?.reduce(
                      (sum: number, item: any) =>
                        sum +
                        ((item.service_type === 'product' || item.service?.type === 'product' || Number(item.cost_price) > 0)
                          ? (Number(item.unit_price) - Number(item.cost_price || 0)) * item.quantity
                          : 0),
                      0
                    ) || 0

                    if (totalProfit <= 0) return null

                    return (
                      <div className="text-xs text-green-600 font-semibold mt-0.5">
                        Untung Produk: +Rp {totalProfit.toLocaleString('id-ID')}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Items & Commission Section */}
              {transaction.transaction_items && transaction.transaction_items.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Items & Komisi:
                    </span>
                    {(() => {
                      const totalCommission = transaction.transaction_items?.reduce(
                        (sum, item: any) => sum + (item.commission_amount || 0),
                        0
                      ) || 0
                      const itemsWithCommission = transaction.transaction_items?.filter(
                        (item: any) => item.has_commission
                      ).length || 0
                      const totalItems = transaction.transaction_items?.length || 0

                      return (
                        <div className="flex items-center gap-2">
                          {totalCommission > 0 ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              💰 Total Komisi: Rp {totalCommission.toLocaleString('id-ID')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              ⚠️ Belum ada komisi
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {itemsWithCommission}/{totalItems} item dengan komisi
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {transaction.transaction_items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800">
                            {item.service?.name || 'Item'}
                          </span>
                          <span className="text-gray-600">
                            {item.quantity}x Rp {item.unit_price?.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Commission Info */}
                        {item.has_commission ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded flex-1">
                              <span className="flex items-center gap-1">
                                ✓ Komisi:{' '}
                                {item.commission_type === 'percentage'
                                  ? `${item.commission_value}%`
                                  : `Rp ${item.commission_value?.toLocaleString('id-ID')}`}
                              </span>
                              <span className="font-medium">
                                = Rp {item.commission_amount?.toLocaleString('id-ID')}
                              </span>
                            </div>
                            {onCommission && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onCommission(transaction, idx, item)}
                                className="h-6 px-2 text-xs ml-1"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-orange-600 text-xs">
                              ⚠️ Komisi belum diatur
                            </span>
                            {onCommission && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCommission(transaction, idx, item)}
                                className="h-6 px-2 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Atur
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
