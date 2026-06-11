/**
 * POS Cart Item Component
 * 
 * Individual cart item display with quantity controls and remove button.
 */

"use client"

import { Button } from "@/components/ui/button"
import { Plus, Minus, Trash2 } from "lucide-react"
import type { CartItem } from "./types"
import { formatCurrency } from "@/lib/utils/pos-helpers"

// ============================================================================
// PROPS
// ============================================================================

interface POSCartItemProps {
  item: CartItem
  index: number
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Cart Item Component
 * 
 * Features:
 * - Service/product name and price
 * - Quantity controls (+/-)
 * - Remove button
 * - Total price calculation
 * - Responsive layout
 */
export function POSCartItem({
  item,
  index,
  onUpdateQuantity,
  onRemove
}: POSCartItemProps) {
  
  const totalPrice = item.service.price * item.quantity
  
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.service.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(item.service.price)} × {item.quantity}
        </p>
      </div>
      
      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Total Price */}
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-sm">{formatCurrency(totalPrice)}</p>
      </div>
      
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
