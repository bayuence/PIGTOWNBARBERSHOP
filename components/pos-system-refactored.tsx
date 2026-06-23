/**
 * POS System Component (Refactored)
 * 
 * Main orchestrator for Point of Sale system.
 * Uses Clean Architecture with separated sub-components.
 * 
 * Features:
 * - Service/product selection
 * - Shopping cart management
 * - Checkout process
 * - Receipt generation
 * - Bluetooth printing
 * - Real-time updates
 * - Stock management
 * 
 * Architecture:
 * This component follows Clean Architecture principles:
 * - Presentation: Sub-components handle UI rendering
 * - Application: This orchestrator manages state and coordination
 * - Infrastructure: Supabase handles data persistence
 */

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bluetooth } from "lucide-react"
import { toast } from "sonner"
import {
  supabase,
  createTransaction,
  createTransactionItems,
  broadcastTransactionEvent,
  reduceOutletStock
} from "@/lib/supabase"
import { usePOSData } from "@/lib/hooks/use-pos-data"
import {
  POSServiceGrid,
  POSCart,
  POSCheckoutModal,
  POSReceiptModal,
  type CartItem,
  type DiscountInfo,
  type PaymentMethod,
  type ServiceType,
  type CheckoutData,
  type ReceiptData,
  type BluetoothDevice
} from "./pos"
import {
  calculatePrices,
  calculateChange,
  parseNominal,
  checkStockAvailability
} from "@/lib/utils/pos-helpers"
import {
  requestBluetoothDevice,
  connectBluetoothDevice,
  disconnectBluetoothDevice,
  isBluetoothSupported
} from "@/lib/utils/receipt-helpers"

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * POS System Component
 * 
 * Main orchestrator for the Point of Sale system
 */
export function POSSystem() {
  // ============================================================================
  // DATA FETCHING (Custom Hook)
  // ============================================================================
  
  const {
    services,
    categories,
    branches,
    employees,
    receiptTemplate,
    outletStock,
    currentUser,
    loading,
    stockLoading,
    error,
    refetch,
    loadOutletStock,
    setCurrentUser
  } = usePOSData()
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("semua")
  const [selectedType, setSelectedType] = useState<ServiceType>("all")
  const [selectedBranch, setSelectedBranch] = useState("")
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Checkout state
  const [customerName, setCustomerName] = useState("")
  const [servingEmployee, setServingEmployee] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [discount, setDiscount] = useState<DiscountInfo>({
    type: "percentage",
    value: "",
    reason: ""
  })
  
  // Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isBluetoothOpen, setIsBluetoothOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Transaction state
  const [currentTransaction, setCurrentTransaction] = useState<any | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  
  // Bluetooth state
  const [bluetoothConnected, setBluetoothConnected] = useState(false)
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [bluetoothError, setBluetoothError] = useState<string | null>(null)
  
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
  
  // Get current branch ID
  const currentBranchId = useMemo(() => {
    const branch = branches.find(b => b.name === selectedBranch)
    return branch?.id || null
  }, [branches, selectedBranch])
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Set default branch when branches load
   */
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].name)
    }
  }, [branches, selectedBranch])
  
  /**
   * Load outlet stock when branch changes
   */
  useEffect(() => {
    if (currentBranchId) {
      loadOutletStock(currentBranchId)
    }
  }, [currentBranchId, loadOutletStock])
  
  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'p':
            e.preventDefault()
            if (cart.length > 0) setIsCheckoutOpen(true)
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length])
  
  // ============================================================================
  // CART HANDLERS
  // ============================================================================
  
  /**
   * Add service/product to cart
   */
  const handleAddToCart = useCallback((service: any) => {
    // Check stock for products
    if (service.type === "product" && currentBranchId) {
      const inCart = cart.find(item => item.service.id === service.id)?.quantity || 0
      const stockCheck = checkStockAvailability(
        { service, quantity: inCart + 1 },
        outletStock
      )
      
      if (!stockCheck.available) {
        toast.error("Stok Tidak Cukup", {
          description: stockCheck.message || `Stok ${service.name} tidak mencukupi`
        })
        return
      }
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id)
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { service, quantity: 1 }]
    })
    
    toast.success("Berhasil Ditambahkan", {
      description: `${service.name} telah ditambahkan ke keranjang`
    })
  }, [cart, currentBranchId, outletStock])
  
  /**
   * Update item quantity in cart
   */
  const handleUpdateQuantity = useCallback((index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index)
      return
    }
    
    const item = cart[index]
    
    // Check stock for products
    if (item.service.type === "product") {
      const stockCheck = checkStockAvailability(
        { ...item, quantity: newQuantity },
        outletStock
      )
      
      if (!stockCheck.available) {
        toast.error("Stok Tidak Cukup", {
          description: `Stok tersedia hanya ${stockCheck.currentStock} item`
        })
        return
      }
    }
    
    setCart(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    )
  }, [cart, outletStock])
  
  /**
   * Remove item from cart
   */
  const handleRemoveItem = useCallback((index: number) => {
    const item = cart[index]
    setCart(prev => prev.filter((_, i) => i !== index))
    toast.success("Item Dihapus", {
      description: `${item.service.name} telah dihapus dari keranjang`
    })
  }, [cart])
  
  /**
   * Clear entire cart
   */
  const handleClearCart = useCallback(() => {
    setCart([])
    toast.success("Keranjang Dikosongkan")
  }, [])
  
  // ============================================================================
  // CHECKOUT HANDLERS
  // ============================================================================
  
  /**
   * Handle checkout confirmation
   */
  const handleCheckoutConfirm = async (checkoutData: CheckoutData) => {
    setIsProcessing(true)
    
    try {
      const branch = branches.find(b => b.name === checkoutData.selectedBranch)
      if (!branch) throw new Error("Branch not found")
      
      // Create transaction
      const transactionData = {
        customer_name: checkoutData.customerName || undefined,
        branch_id: branch.id,
        cashier_id: currentUser?.id ? Number(currentUser.id) : undefined,
        server_id: checkoutData.servingEmployee ? Number(checkoutData.servingEmployee) : undefined,
        payment_method: checkoutData.paymentMethod,
        payment_status: "completed" as const,
        subtotal: subtotal,
        total_amount: total,
        discount_amount: discountAmount,
        notes: checkoutData.discountReason || undefined,
        cashier_name: currentUser?.name || undefined,
        server_name: employees.find(e => String(e.id) === String(checkoutData.servingEmployee))?.name || undefined,
        branch_name: branch.name
      }
      
      const { data: transaction, error: transactionError } = await createTransaction(transactionData)
      if (transactionError) throw transactionError
      
      // Create transaction items with commissions
      const transactionItemsWithCommission = await Promise.all(
        cart.map(async (item) => {
          let commissionData: {
            commission_status: string
            commission_type: string | undefined
            commission_value: number | undefined
            commission_amount: number
          } = {
            commission_status: 'no_commission',
            commission_type: undefined,
            commission_value: undefined,
            commission_amount: 0,
          }

          if (item.service.type === 'service') {
            console.log('🔍 Checking commission for:', {
              service_id: item.service.id,
              service_name: item.service.name,
              user_id: checkoutData.servingEmployee,
              employee_name: employees.find(e => String(e.id) === String(checkoutData.servingEmployee))?.name
            });

            const { data: rule, error: ruleError } = await supabase
              .from('commission_rules')
              .select('commission_type, commission_value')
              .eq('service_id', item.service.id)
              .eq('user_id', checkoutData.servingEmployee)
              .limit(1)
              .maybeSingle()

            console.log('📋 Commission rule result:', { rule, ruleError });

            if (rule) {
              const price = item.service.price
              const commissionAmount = rule.commission_type === 'percentage'
                ? price * (Number(rule.commission_value) / 100)
                : Number(rule.commission_value)

              commissionData = {
                commission_status: 'credited',
                commission_type: rule.commission_type ?? undefined,
                commission_value: Number(rule.commission_value),
                commission_amount: commissionAmount * item.quantity,
              }

              console.log('✅ Commission applied:', commissionData);
            } else {
              commissionData.commission_status = 'pending_rule'
              console.log('⚠️ No commission rule found - status set to pending_rule');
            }
          }

          return {
            transaction_id: transaction.id,
            service_id: Number(item.service.id),
            quantity: item.quantity,
            unit_price: item.service.price,
            cost_price: item.service.type === 'product' ? Number(item.service.cost_price || 0) : 0,
            total_price: item.service.price * item.quantity,
            barber_id: item.service.type === 'service' && checkoutData.servingEmployee ? Number(checkoutData.servingEmployee) : undefined,
            ...commissionData,
          }
        })
      )
      
      const { error: itemsError } = await createTransactionItems(transactionItemsWithCommission)
      if (itemsError) throw itemsError
      
      // Reduce stock for products
      for (const item of cart) {
        if (item.service.type === "product") {
          await reduceOutletStock(branch.id, item.service.id, item.quantity)
        }
      }
      
      // Broadcast event
      broadcastTransactionEvent('transaction_created', {
        transaction_id: transaction.id,
        branch_id: branch.id
      })
      
      // Prepare receipt data
      const receipt: ReceiptData = {
        transaction,
        items: cart,
        template: receiptTemplate,
        branch,
        subtotal,
        discount: discountAmount,
        total
      }
      
      setCurrentTransaction(transaction)
      setReceiptData(receipt)
      setIsCheckoutOpen(false)
      setIsReceiptOpen(true)
      
      // Clear cart and reset form
      setCart([])
      setCustomerName("")
      setServingEmployee("")
      setPaymentMethod("cash")
      setCashAmount("")
      setDiscount({ type: "percentage", value: "", reason: "" })
      
      // Refresh data
      refetch()
      
      toast.success("Transaksi Berhasil!", {
        description: `Transaksi #${transaction.transaction_number} telah dibuat`
      })
      
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Gagal Memproses Transaksi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan"
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // ============================================================================
  // BLUETOOTH HANDLERS
  // ============================================================================
  
  /**
   * Connect to Bluetooth printer
   */
  const handleBluetoothConnect = async () => {
    setBluetoothError(null)
    
    if (!isBluetoothSupported()) {
      setBluetoothError("Browser Anda tidak mendukung Bluetooth. Gunakan Chrome atau Edge.")
      return
    }
    
    try {
      const device = await requestBluetoothDevice()
      await connectBluetoothDevice(device)
      
      setBluetoothDevice(device)
      setBluetoothConnected(true)
      setIsBluetoothOpen(false)
      
      toast.success("Berhasil Terhubung!", {
        description: `Terhubung ke printer ${device.name}`
      })
      
      // Listen for disconnect
      device.addEventListener("gattserverdisconnected", () => {
        setBluetoothConnected(false)
        setBluetoothDevice(null)
        toast.warning("Printer Terputus", {
          description: "Koneksi Bluetooth terputus"
        })
      })
      
    } catch (error) {
      console.error("Bluetooth error:", error)
      setBluetoothError("Gagal terhubung. Pastikan Bluetooth aktif dan printer dalam jangkauan.")
      setBluetoothConnected(false)
      setBluetoothDevice(null)
    }
  }
  
  /**
   * Disconnect from Bluetooth printer
   */
  const handleBluetoothDisconnect = () => {
    if (bluetoothDevice) {
      disconnectBluetoothDevice(bluetoothDevice)
    }
    setBluetoothConnected(false)
    setBluetoothDevice(null)
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading POS data</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
          <Button onClick={refetch} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <p className="text-muted-foreground text-sm">Pigtown Barbershop</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih Cabang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 ${bluetoothConnected ? "text-blue-600 border-blue-600" : ""}`}
              onClick={() => setIsBluetoothOpen(true)}
            >
              <Bluetooth className="h-4 w-4" />
              {bluetoothConnected ? "Terhubung" : "Printer"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Services Grid */}
        <div className="flex-1 overflow-auto p-4">
          <POSServiceGrid
            services={services}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onAddToCart={handleAddToCart}
            outletStock={outletStock}
            currentBranchId={currentBranchId}
            loading={loading}
          />
        </div>
        
        {/* Cart Sidebar */}
        <div className="w-96 border-l bg-gray-50 overflow-hidden flex flex-col">
          <POSCart
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            subtotal={subtotal}
            discount={discountAmount}
            total={total}
            onCheckout={() => setIsCheckoutOpen(true)}
            isCheckoutDisabled={cart.length === 0}
          />
        </div>
      </div>
      
      {/* Checkout Modal */}
      <POSCheckoutModal
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart}
        branches={branches}
        employees={employees}
        onConfirm={handleCheckoutConfirm}
        loading={isProcessing}
      />
      
      {/* Receipt Modal */}
      <POSReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        receiptData={receiptData}
        bluetoothDevice={bluetoothDevice}
        bluetoothConnected={bluetoothConnected}
        onOpenBluetoothSettings={() => setIsBluetoothOpen(true)}
      />
      
      {/* Bluetooth Settings Dialog */}
      <Dialog open={isBluetoothOpen} onOpenChange={setIsBluetoothOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5" />
              Hubungkan Printer Bluetooth
            </DialogTitle>
            <DialogDescription>
              Pindai dan hubungkan ke printer struk termal Anda.
            </DialogDescription>
          </DialogHeader>
          
          {bluetoothError && (
            <div className="p-3 bg-red-100 text-red-800 text-sm rounded-lg">
              {bluetoothError}
            </div>
          )}
          
          <div className="space-y-4">
            {bluetoothConnected && bluetoothDevice ? (
              <div className="p-4 bg-green-100 rounded-lg text-green-800 text-center">
                <p className="font-semibold">Terhubung ke:</p>
                <p>{bluetoothDevice.name}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Belum terhubung ke printer
              </p>
            )}
          </div>
          
          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={handleBluetoothConnect}
              disabled={bluetoothConnected}
              className="w-full"
            >
              Cari & Hubungkan Printer
            </Button>
            <Button
              onClick={handleBluetoothDisconnect}
              disabled={!bluetoothConnected}
              variant="outline"
              className="w-full"
            >
              Putuskan Koneksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
