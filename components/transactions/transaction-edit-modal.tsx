/**
 * Transaction Edit Modal Component
 * 
 * Complex modal for editing transaction details:
 * - Customer information
 * - Transaction items (add/remove/edit)
 * - Payment method and status
 * - Notes
 * - Tabbed interface for organization
 */

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Trash2, RefreshCw } from "lucide-react"
import type { Transaction, EditTransactionData, Service } from "./types"

interface TransactionEditModalProps {
  /** Transaction to edit (null if none selected) */
  transaction: Transaction | null
  /** Modal open state */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when save is clicked */
  onSave: (data: EditTransactionData) => Promise<void> | void
  /** List of available services */
  services: Service[]
  /** Loading state during save */
  loading?: boolean
}

/**
 * Transaction Edit Modal
 * 
 * Displays a comprehensive modal for editing transaction details
 * 
 * @example
 * ```tsx
 * <TransactionEditModal
 *   transaction={selectedTransaction}
 *   open={showEditModal}
 *   onOpenChange={setShowEditModal}
 *   onSave={handleSave}
 *   services={services}
 * />
 * ```
 */
export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  onSave,
  services,
  loading = false
}: TransactionEditModalProps) {
  const [editData, setEditData] = useState<EditTransactionData>({
    customer_name: "",
    payment_method: "cash",
    payment_status: "completed",
    notes: "",
    discount_amount: 0,
    discount_type: "percentage",
    discount_value: "",
    discount_reason: "",
    items: []
  })

  // Initialize edit data when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditData({
        customer_name: transaction.customer_name || "",
        payment_method: transaction.payment_method || "cash",
        payment_status: transaction.payment_status || "completed",
        notes: transaction.notes || "",
        discount_amount: transaction.discount_amount || 0,
        discount_type: "percentage",
        discount_value: "",
        discount_reason: "",
        items: transaction.transaction_items || []
      })
    }
  }, [transaction])

  // Item management functions
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setEditData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity,
        total_price: newQuantity * newItems[index].unit_price
      }
      return { ...prev, items: newItems }
    })
  }

  const updateItemPrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return

    setEditData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        unit_price: newPrice,
        total_price: newItems[index].quantity * newPrice
      }
      return { ...prev, items: newItems }
    })
  }

  const updateItemService = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    setEditData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        service_id: serviceId,
        unit_price: service.price,
        total_price: newItems[index].quantity * service.price,
        service: { name: service.name, price: service.price }
      }
      return { ...prev, items: newItems }
    })
  }

  const addNewItem = () => {
    setEditData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `new-${Date.now()}`,
          service_id: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          service: { name: "Pilih Layanan", price: 0 }
        }
      ]
    }))
  }

  const removeItem = (index: number) => {
    setEditData(prev => {
      const newItems = [...prev.items]
      newItems.splice(index, 1)
      return { ...prev, items: newItems }
    })
  }

  const handleSave = async () => {
    await onSave(editData)
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
          <DialogDescription>
            Edit detail transaksi {transaction.transaction_number || transaction.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Info Transaksi</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nama Customer</Label>
                <Input
                  id="customer-name"
                  value={editData.customer_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Nama customer"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Cabang</Label>
                <Input
                  id="branch"
                  value={transaction.branch?.name || "N/A"}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan transaksi"
                rows={3}
                disabled={loading}
              />
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Items Transaksi</Label>
              <Button
                size="sm"
                onClick={addNewItem}
                className="gap-1"
                disabled={loading}
              >
                <Plus className="h-4 w-4" /> Tambah Item
              </Button>
            </div>

            <div className="space-y-3">
              {editData.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Layanan</Label>
                      <Select
                        value={item.service_id}
                        onValueChange={(value) => updateItemService(index, value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih layanan" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - Rp {service.price.toLocaleString("id-ID")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Harga</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItemPrice(index, Number(e.target.value))}
                        placeholder="Harga"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                        className="w-16 text-center"
                        min="1"
                        disabled={loading}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        disabled={loading}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="text-red-500"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Metode Pembayaran</Label>
                <Select
                  value={editData.payment_method}
                  onValueChange={(value: any) => setEditData(prev => ({ ...prev, payment_method: value }))}
                  disabled={loading}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="debit">Kartu Debit</SelectItem>
                    <SelectItem value="credit">Kartu Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-status">Status Pembayaran</Label>
                <Select
                  value={editData.payment_status}
                  onValueChange={(value: any) => setEditData(prev => ({ ...prev, payment_status: value }))}
                  disabled={loading}
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount">Total Amount</Label>
              <Input
                id="total-amount"
                value={`Rp ${transaction.total_amount?.toLocaleString("id-ID")}`}
                disabled
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
