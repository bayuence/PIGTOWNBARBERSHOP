/**
 * POS Receipt Modal Component
 * 
 * Display receipt with print functionality (browser and Bluetooth).
 */

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, Bluetooth, Loader2, CheckCircle } from "lucide-react"
import type { POSTransaction, ReceiptData, BluetoothDevice } from "./types"
import { formatCurrency, formatTransactionNumber } from "@/lib/utils/pos-helpers"
import { printReceipt, printViaBluetooth } from "@/lib/utils/receipt-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptData: ReceiptData | null
  bluetoothDevice: BluetoothDevice | null
  bluetoothConnected: boolean
  onOpenBluetoothSettings: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Receipt Modal Component
 * 
 * Features:
 * - Receipt preview
 * - Transaction details
 * - Items list
 * - Payment information
 * - Print button (browser)
 * - Bluetooth print button
 * - Success message
 */
export function POSReceiptModal({
  open,
  onOpenChange,
  receiptData,
  bluetoothDevice,
  bluetoothConnected,
  onOpenBluetoothSettings
}: POSReceiptModalProps) {
  
  const [isPrinting, setIsPrinting] = useState(false)
  
  if (!receiptData) return null
  
  const { transaction, items, subtotal, discount, total } = receiptData
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handlePrint = () => {
    setIsPrinting(true)
    try {
      printReceipt(receiptData)
    } catch (error) {
      console.error("Print error:", error)
    } finally {
      setTimeout(() => setIsPrinting(false), 1000)
    }
  }
  
  const handleBluetoothPrint = async () => {
    if (!bluetoothDevice || !bluetoothConnected) {
      onOpenBluetoothSettings()
      return
    }
    
    setIsPrinting(true)
    try {
      await printViaBluetooth(receiptData, bluetoothDevice)
    } catch (error) {
      console.error("Bluetooth print error:", error)
    } finally {
      setTimeout(() => setIsPrinting(false), 1000)
    }
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Transaksi Berhasil!
          </DialogTitle>
          <DialogDescription>
            Transaksi telah berhasil diproses
          </DialogDescription>
        </DialogHeader>
        
        {/* Receipt Preview */}
        <div className="py-4 space-y-4">
          {/* Transaction Info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">No. Transaksi</p>
            <p className="text-lg font-bold">
              {formatTransactionNumber(transaction.transaction_number)}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(transaction.created_at).toLocaleString('id-ID')}
            </p>
          </div>
          
          <Separator />
          
          {/* Customer & Branch Info */}
          <div className="space-y-2 text-sm">
            {transaction.customer_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{transaction.customer_name}</span>
              </div>
            )}
            {transaction.branch?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cabang:</span>
                <span className="font-medium">{transaction.branch.name}</span>
              </div>
            )}
            {transaction.server?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server:</span>
                <span className="font-medium">{transaction.server.name}</span>
              </div>
            )}
            {transaction.cashier?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kasir:</span>
                <span className="font-medium">{transaction.cashier.name}</span>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Items */}
          <div className="space-y-3">
            <p className="font-semibold text-sm">Item Transaksi:</p>
            {items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.service.name}</span>
                  <span className="font-medium">
                    {formatCurrency(item.service.price * item.quantity)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {item.quantity} × {formatCurrency(item.service.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <Separator />
          
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon:</span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metode:</span>
              <span className="font-medium uppercase">{transaction.payment_method}</span>
            </div>
          </div>
          
          {/* Notes */}
          {transaction.notes && (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Catatan:</p>
                <p className="text-gray-700">{transaction.notes}</p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Tutup
          </Button>
          
          {bluetoothConnected && bluetoothDevice ? (
            <Button
              onClick={handleBluetoothPrint}
              disabled={isPrinting}
              className="w-full sm:w-auto gap-2"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4" />
                  Print via Bluetooth
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full sm:w-auto gap-2"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Print Struk
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
