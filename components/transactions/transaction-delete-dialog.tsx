/**
 * Transaction Delete Dialog Component
 * 
 * Confirmation dialog for deleting a transaction.
 * Shows transaction number and warning message.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Transaction } from "./types"

interface TransactionDeleteDialogProps {
  /** Transaction to delete (null if none selected) */
  transaction: Transaction | null
  /** Dialog open state */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when delete is confirmed */
  onConfirm: () => Promise<void> | void
  /** Loading state during deletion */
  loading?: boolean
}

/**
 * Transaction Delete Dialog
 * 
 * Displays a confirmation dialog before deleting a transaction
 * 
 * @example
 * ```tsx
 * <TransactionDeleteDialog
 *   transaction={selectedTransaction}
 *   open={showDeleteDialog}
 *   onOpenChange={setShowDeleteDialog}
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function TransactionDeleteDialog({
  transaction,
  open,
  onOpenChange,
  onConfirm,
  loading = false
}: TransactionDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Apakah Anda Yakin Ingin Menghapus?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus transaksi{" "}
            <span className="font-bold font-mono mx-1">
              {transaction?.transaction_number || transaction?.id}
            </span>{" "}
            secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Menghapus..." : "Ya, Hapus Transaksi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
