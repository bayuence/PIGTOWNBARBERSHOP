/**
 * POS Cart Component
 * 
 * Shopping cart display with items, totals, and checkout button.
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, CreditCard } from "lucide-react"
import { POSCartItem } from "./pos-cart-item"
import type { CartItem } from "./types"
import { formatCurrency } from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSCartProps {
  cart: CartItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  subtotal: number
  discount: number
  total: number
  onCheckout: () => void
  isCheckoutDisabled?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Cart Component
 * 
 * Features:
 * - Cart items list
 * - Quantity controls per item
 * - Remove item button
 * - Clear cart button
 * - Subtotal/discount/total display
 * - Checkout button
 * - Empty cart state
 * - Responsive layout
 */
export function POSCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  discount,
  total,
  onCheckout,
  isCheckoutDisabled = false
}: POSCartProps) {
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Keranjang ({itemCount})
          </CardTitle>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Kosongkan
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Separator />
      
      {/* Cart Items */}
      <CardContent className="flex-1 overflow-auto p-4">
        {cart.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">Keranjang Kosong</p>
            <p className="text-gray-400 text-sm mt-1">
              Pilih layanan atau produk untuk memulai
            </p>
          </div>
        ) : (
          // Cart Items List
          <div className="space-y-2">
            {cart.map((item, index) => (
              <POSCartItem
                key={`${item.service.id}-${index}`}
                item={item}
                index={index}
                onUpdateQuantity={(quantity) => onUpdateQuantity(index, quantity)}
                onRemove={() => onRemoveItem(index)}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Totals & Checkout */}
      {cart.length > 0 && (
        <>
          <Separator />
          <CardContent className="p-4 space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Discount */}
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon:</span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <Separator />
            
            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            
            {/* Checkout Button */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={onCheckout}
              disabled={isCheckoutDisabled}
            >
              <CreditCard className="h-5 w-5" />
              Checkout
            </Button>
          </CardContent>
        </>
      )}
    </Card>
  )
}
