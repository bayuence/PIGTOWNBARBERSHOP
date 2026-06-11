/**
 * POS Payment Form Component
 * 
 * Payment method selection and cash amount input.
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Banknote, CreditCard, QrCode } from "lucide-react"
import type { PaymentMethod } from "./types"
import { formatCurrency, formatRupiah, parseNominal, calculateChange, getQuickAmounts } from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSPaymentFormProps {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  total: number
  cashAmount: string
  onCashAmountChange: (amount: string) => void
  change: number
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Payment Form Component
 * 
 * Features:
 * - Payment method selector (cash, QRIS, transfer, debit)
 * - Cash amount input (for cash payment)
 * - Change calculation display
 * - Quick amount buttons (50k, 100k, 200k)
 * - Validation
 */
export function POSPaymentForm({
  paymentMethod,
  onPaymentMethodChange,
  total,
  cashAmount,
  onCashAmountChange,
  change
}: POSPaymentFormProps) {
  
  const paidAmount = parseNominal(cashAmount)
  const isInsufficientCash = paymentMethod === "cash" && paidAmount < total
  const quickAmounts = getQuickAmounts(total)
  
  const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: any }> = [
    { value: "cash", label: "Tunai", icon: Banknote },
    { value: "qris", label: "QRIS", icon: QrCode },
    { value: "transfer", label: "Transfer", icon: CreditCard },
    { value: "debit", label: "Debit", icon: CreditCard }
  ]
  
  const handleQuickAmount = (amount: number) => {
    onCashAmountChange(amount.toString())
  }
  
  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = paymentMethod === method.value
            
            return (
              <Button
                key={method.value}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto py-3 ${isSelected ? "" : "bg-transparent"}`}
                onClick={() => onPaymentMethodChange(method.value)}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>
      
      {/* Cash Amount Input (only for cash payment) */}
      {paymentMethod === "cash" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="cash-amount">Jumlah Uang Diterima</Label>
            <Input
              id="cash-amount"
              type="text"
              placeholder="Masukkan jumlah uang"
              value={cashAmount ? formatRupiah(cashAmount) : ""}
              onChange={(e) => onCashAmountChange(e.target.value)}
              className={isInsufficientCash ? "border-red-500" : ""}
            />
            {isInsufficientCash && (
              <p className="text-xs text-red-600">
                Uang tidak cukup. Minimal: {formatCurrency(total)}
              </p>
            )}
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nominal Cepat:</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="text-xs"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Change Display */}
          {paidAmount >= total && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Kembalian:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Non-cash payment info */}
      {paymentMethod !== "cash" && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            {paymentMethod === "qris" && "Scan QRIS untuk melakukan pembayaran"}
            {paymentMethod === "transfer" && "Lakukan transfer ke rekening toko"}
            {paymentMethod === "debit" && "Gesek kartu debit untuk melakukan pembayaran"}
          </p>
        </div>
      )}
      
      {/* Total Display */}
      <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Pembayaran:</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
