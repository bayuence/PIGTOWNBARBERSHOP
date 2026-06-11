/**
 * POS Checkout Modal Component
 * 
 * Checkout process orchestrator with customer info, barber selection,
 * discount, and payment forms.
 */

"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { POSCustomerInput } from "./pos-customer-input"
import { POSBarberSelector } from "./pos-barber-selector"
import { POSDiscountForm } from "./pos-discount-form"
import { POSPaymentForm } from "./pos-payment-form"
import type { CartItem, Branch, Employee, DiscountInfo, PaymentMethod, CheckoutData } from "./types"
import { 
  calculatePrices, 
  calculateChange, 
  validateCart, 
  validatePayment, 
  validateCustomerName,
  validateBranch,
  parseNominal
} from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSCheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  branches: Branch[]
  employees: Employee[]
  onConfirm: (data: CheckoutData) => Promise<void>
  loading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Checkout Modal Component
 * 
 * Features:
 * - Customer information input
 * - Branch selection
 * - Barber/server selection
 * - Discount management
 * - Payment method and amount
 * - Price summary
 * - Validation
 * - Loading state
 */
export function POSCheckoutModal({
  open,
  onOpenChange,
  cart,
  branches,
  employees,
  onConfirm,
  loading = false
}: POSCheckoutModalProps) {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [customerName, setCustomerName] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [servingEmployee, setServingEmployee] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [discount, setDiscount] = useState<DiscountInfo>({
    type: "percentage",
    value: "",
    reason: ""
  })
  
  // ============================================================================
  // CALCULATIONS
  // ============================================================================
  
  const { subtotal, discountAmount, total } = useMemo(() => {
    return calculatePrices(cart, discount)
  }, [cart, discount])
  
  const change = useMemo(() => {
    if (paymentMethod !== "cash") return 0
    const paid = parseNominal(cashAmount)
    return calculateChange(total, paid)
  }, [paymentMethod, cashAmount, total])
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const isValid = useMemo(() => {
    // Cart must have items
    if (!validateCart(cart)) return false
    
    // Customer name required
    if (!validateCustomerName(customerName)) return false
    
    // Branch required
    if (!validateBranch(selectedBranch)) return false
    
    // Payment validation
    const paid = parseNominal(cashAmount)
    if (!validatePayment(total, paid, paymentMethod)) return false
    
    return true
  }, [cart, customerName, selectedBranch, paymentMethod, cashAmount, total])
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleConfirm = async () => {
    if (!isValid) return
    
    const checkoutData: CheckoutData = {
      customerName,
      selectedBranch,
      servingEmployee,
      paymentMethod,
      cashAmount,
      discountType: discount.type,
      discountValue: discount.value,
      discountReason: discount.reason
    }
    
    await onConfirm(checkoutData)
  }
  
  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Lengkapi informasi transaksi untuk melanjutkan pembayaran
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Informasi Customer</h3>
            <POSCustomerInput
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
            />
          </div>
          
          <Separator />
          
          {/* Barber Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Barber/Server</h3>
            <POSBarberSelector
              value={servingEmployee}
              onChange={setServingEmployee}
              employees={employees}
              required={false}
            />
          </div>
          
          <Separator />
          
          {/* Discount */}
          <div>
            <POSDiscountForm
              discount={discount}
              onDiscountChange={setDiscount}
              subtotal={subtotal}
            />
          </div>
          
          <Separator />
          
          {/* Payment */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Pembayaran</h3>
            <POSPaymentForm
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              total={total}
              cashAmount={cashAmount}
              onCashAmountChange={setCashAmount}
              change={change}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
