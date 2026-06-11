/**
 * Transaction Commission Dialog Component
 * 
 * Dialog for managing commission for transaction items:
 * - Commission type selection (percentage/fixed)
 * - Commission value input
 * - Preview calculation
 * - Save to database
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TransactionItem, CommissionType } from "./types"

interface TransactionCommissionDialogProps {
  /** Item to set commission for (null if none selected) */
  item: TransactionItem | null
  /** Dialog open state */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when commission is saved */
  onSave: (type: CommissionType, value: number) => Promise<void> | void
  /** Loading state during save */
  loading?: boolean
}

/**
 * Transaction Commission Dialog
 * 
 * Displays a dialog for configuring commission for a transaction item
 * 
 * @example
 * ```tsx
 * <TransactionCommissionDialog
 *   item={selectedItem}
 *   open={showCommissionDialog}
 *   onOpenChange={setShowCommissionDialog}
 *   onSave={handleSaveCommission}
 * />
 * ```
 */
export function TransactionCommissionDialog({
  item,
  open,
  onOpenChange,
  onSave,
  loading = false
}: TransactionCommissionDialogProps) {
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage')
  const [commissionValue, setCommissionValue] = useState('')

  // Pre-fill if item already has commission
  useEffect(() => {
    if (item && item.has_commission) {
      setCommissionType(item.commission_type || 'percentage')
      setCommissionValue(item.commission_value?.toString() || '')
    } else {
      setCommissionType('percentage')
      setCommissionValue('')
    }
  }, [item])

  // Calculate preview
  const calculatePreview = () => {
    if (!item || !commissionValue) return 0
    
    const value = parseFloat(commissionValue)
    if (isNaN(value)) return 0

    if (commissionType === 'percentage') {
      return (item.unit_price * value) / 100
    } else {
      return value
    }
  }

  const previewAmount = calculatePreview()

  const handleSave = async () => {
    if (!commissionValue) return
    
    const value = parseFloat(commissionValue)
    if (isNaN(value) || value <= 0) return

    await onSave(commissionType, value)
  }

  const handleClose = () => {
    onOpenChange(false)
    setCommissionValue('')
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atur Komisi</DialogTitle>
          <DialogDescription>
            Atur komisi untuk layanan: {item.service?.name || 'Item'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Info:</strong> Komisi yang diatur akan disimpan ke database dan berlaku
              untuk transaksi selanjutnya dari karyawan yang sama untuk layanan ini.
            </div>
          </div>

          {/* Service Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Layanan</Label>
              <Input
                id="service-name"
                value={item.service?.name || 'Item'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Harga Layanan</Label>
              <Input
                id="service-price"
                value={`Rp ${item.unit_price?.toLocaleString('id-ID')}`}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Commission Type */}
          <div className="space-y-2">
            <Label htmlFor="commission-type">Tipe Komisi</Label>
            <Select
              value={commissionType}
              onValueChange={(value: CommissionType) => setCommissionType(value)}
              disabled={loading}
            >
              <SelectTrigger id="commission-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Persentase (%)</SelectItem>
                <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commission Value */}
          <div className="space-y-2">
            <Label htmlFor="commission-value">
              Nilai Komisi {commissionType === 'percentage' ? '(%)' : '(Rp)'}
            </Label>
            <Input
              id="commission-value"
              type="number"
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              placeholder={commissionType === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
              disabled={loading}
            />
          </div>

          {/* Preview */}
          {commissionValue && previewAmount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Preview Komisi:</strong>
                <div className="mt-1">
                  {commissionType === 'percentage' ? (
                    <>
                      {commissionValue}% dari Rp {item.unit_price?.toLocaleString('id-ID')} ={' '}
                      <strong className="ml-1">
                        Rp {previewAmount.toLocaleString('id-ID')}
                      </strong>
                    </>
                  ) : (
                    <>
                      Komisi tetap:{' '}
                      <strong>Rp {previewAmount.toLocaleString('id-ID')}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !commissionValue || previewAmount <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Menyimpan..." : "Simpan Komisi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
