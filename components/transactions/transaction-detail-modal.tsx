/**
 * Transaction Detail Modal Component
 * 
 * Displays detailed information about a transaction:
 * - Transaction header (ID, date, time)
 * - Customer and server information
 * - Branch and status
 * - Payment method and amount
 * - Transaction items with commission info
 * - Notes
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus } from "lucide-react"
import type { Transaction } from "./types"
import {
  getStatusColor,
  getPaymentMethodColor,
  formatPaymentMethod,
  formatStatus,
} from "@/lib/utils/transaction-helpers"

interface TransactionDetailModalProps {
  /** Transaction to display (null if none selected) */
  transaction: Transaction | null
  /** Modal open state */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when commission button is clicked */
  onCommission?: (itemIndex: number, item: any) => void
}

/**
 * Transaction Detail Modal
 * 
 * Displays comprehensive transaction information in a modal
 * 
 * @example
 * ```tsx
 * <TransactionDetailModal
 *   transaction={selectedTransaction}
 *   open={showDetailModal}
 *   onOpenChange={setShowDetailModal}
 *   onCommission={handleCommission}
 * />
 * ```
 */
export function TransactionDetailModal({
  transaction,
  open,
  onOpenChange,
  onCommission
}: TransactionDetailModalProps) {
  if (!transaction) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detail Transaksi</DialogTitle>
          <DialogDescription>
            Informasi lengkap transaksi {transaction.transaction_number || transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">ID Transaksi</Label>
              <p className="font-mono text-sm mt-1">
                {transaction.transaction_number || transaction.id}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tanggal & Waktu</Label>
              <p className="text-sm mt-1">
                {new Date(transaction.created_at).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                <br />
                <span className="text-gray-500">
                  {new Date(transaction.created_at).toLocaleTimeString("id-ID")}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Customer</Label>
              <p className="font-medium mt-1">
                {transaction.customer_name || "Tidak ada nama"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Dilayani oleh</Label>
              <p className="font-medium mt-1">
                {transaction.server?.name || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Cabang</Label>
              <p className="font-medium mt-1">
                {transaction.branch?.name || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(transaction.payment_status || 'pending')}>
                  {formatStatus(transaction.payment_status || 'pending')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Metode Pembayaran</Label>
                <div className="mt-1">
                  <Badge className={getPaymentMethodColor(transaction.payment_method || 'cash')}>
                    {formatPaymentMethod(transaction.payment_method || 'cash')}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Pembayaran</Label>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  Rp {transaction.total_amount?.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Catatan</Label>
              <p className="text-sm mt-1 p-3 bg-yellow-50 rounded-lg">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Transaction Items */}
          {transaction.transaction_items && transaction.transaction_items.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Items & Komisi</Label>
              <div className="mt-2 space-y-2">
                {transaction.transaction_items.map((item: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.service?.name || `Item ${index + 1}`}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.quantity} x Rp {item.unit_price?.toLocaleString("id-ID")} = Rp{" "}
                          {item.total_price?.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    {/* Commission Info */}
                    {item.has_commission ? (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">✓ Komisi: </span>
                            <span className="text-gray-700">
                              {item.commission_type === 'percentage'
                                ? `${item.commission_value}%`
                                : `Rp ${item.commission_value?.toLocaleString('id-ID')}`}{" "}
                              = Rp {item.commission_amount?.toLocaleString('id-ID')}
                            </span>
                          </div>
                          {onCommission && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCommission(index, item)}
                              className="h-7 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Ubah
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        {onCommission && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onCommission(index, item)}
                              className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Atur Komisi
                            </Button>
                            <span className="text-xs text-gray-500 ml-2">
                              Belum ada komisi untuk layanan ini
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
