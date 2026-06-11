/**
 * POS Discount Form Component
 * 
 * Discount management with type selection and preview.
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Percent, DollarSign, X } from "lucide-react"
import type { DiscountInfo, DiscountType } from "./types"
import { formatCurrency, parseNominal, calculateDiscount } from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSDiscountFormProps {
  discount: DiscountInfo
  onDiscountChange: (discount: DiscountInfo) => void
  subtotal: number
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Discount Form Component
 * 
 * Features:
 * - Discount type selector (percentage/fixed)
 * - Discount value input
 * - Discount reason input
 * - Preview calculation
 * - Clear discount button
 * - Validation
 */
export function POSDiscountForm({
  discount,
  onDiscountChange,
  subtotal
}: POSDiscountFormProps) {
  
  const discountAmount = calculateDiscount(subtotal, discount)
  const hasDiscount = parseNominal(discount.value) > 0
  
  const handleTypeChange = (type: DiscountType) => {
    onDiscountChange({
      ...discount,
      type
    })
  }
  
  const handleValueChange = (value: string) => {
    onDiscountChange({
      ...discount,
      value
    })
  }
  
  const handleReasonChange = (reason: string) => {
    onDiscountChange({
      ...discount,
      reason
    })
  }
  
  const handleClearDiscount = () => {
    onDiscountChange({
      type: "percentage",
      value: "",
      reason: ""
    })
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Diskon</Label>
        {hasDiscount && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDiscount}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        )}
      </div>
      
      {/* Discount Type */}
      <div className="space-y-2">
        <Label htmlFor="discount-type">Tipe Diskon</Label>
        <Select
          value={discount.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger id="discount-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Persentase (%)
              </div>
            </SelectItem>
            <SelectItem value="fixed">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Nominal (Rp)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Discount Value */}
      <div className="space-y-2">
        <Label htmlFor="discount-value">
          Nilai Diskon {discount.type === "percentage" ? "(%)" : "(Rp)"}
        </Label>
        <Input
          id="discount-value"
          type="text"
          placeholder={discount.type === "percentage" ? "Contoh: 10" : "Contoh: 50000"}
          value={discount.value}
          onChange={(e) => handleValueChange(e.target.value)}
        />
        {discount.type === "percentage" && parseNominal(discount.value) > 100 && (
          <p className="text-xs text-red-600">
            Persentase tidak boleh lebih dari 100%
          </p>
        )}
        {discount.type === "fixed" && parseNominal(discount.value) > subtotal && (
          <p className="text-xs text-red-600">
            Diskon tidak boleh lebih dari subtotal
          </p>
        )}
      </div>
      
      {/* Discount Reason */}
      <div className="space-y-2">
        <Label htmlFor="discount-reason">Alasan Diskon (Opsional)</Label>
        <Input
          id="discount-reason"
          type="text"
          placeholder="Contoh: Promo member, Diskon khusus"
          value={discount.reason}
          onChange={(e) => handleReasonChange(e.target.value)}
        />
      </div>
      
      {/* Preview */}
      {hasDiscount && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-800">Potongan Diskon:</span>
            <span className="text-lg font-bold text-green-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
          {discount.type === "percentage" && (
            <p className="text-xs text-green-700 mt-1">
              {discount.value}% dari {formatCurrency(subtotal)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
