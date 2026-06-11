/**
 * Employee Add Dialog Component
 * 
 * Modal dialog for adding a new employee.
 * Includes form validation and PIN visibility toggle.
 */

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { validateEmployeeForm } from "@/lib/utils/employee-helpers"
import type { EmployeeFormData } from "@/components/employees/types"
import { DEFAULT_EMPLOYEE_FORM } from "@/components/employees/types"

/**
 * Props for EmployeeAddDialog component
 */
export interface EmployeeAddDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Form submit handler */
  onSubmit: (data: EmployeeFormData) => Promise<void>
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Add Dialog
 * 
 * Dialog for adding a new employee with form validation.
 * 
 * @param props - Component props
 * @returns Add dialog component
 * 
 * @example
 * <EmployeeAddDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleAddEmployee}
 *   loading={loading}
 * />
 */
export function EmployeeAddDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false
}: EmployeeAddDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(DEFAULT_EMPLOYEE_FORM)
  const [showPin, setShowPin] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate form
    const validation = validateEmployeeForm(formData)
    
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    
    // Clear errors
    setErrors({})
    
    // Submit form
    await onSubmit(formData)
    
    // Reset form
    setFormData(DEFAULT_EMPLOYEE_FORM)
    setShowPin(false)
  }
  
  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      setFormData(DEFAULT_EMPLOYEE_FORM)
      setErrors({})
      setShowPin(false)
      onOpenChange(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            Tambah Karyawan Baru
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Isi informasi karyawan baru yang akan ditambahkan
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nama lengkap karyawan"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+62 812 xxxx xxxx"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>
          
          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">
              Posisi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Masukkan posisi"
              disabled={loading}
            />
            {errors.position && (
              <p className="text-xs text-red-500">{errors.position}</p>
            )}
          </div>
          
          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">
              PIN Keamanan (6 digit) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                maxLength={6}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="••••••"
                className="pr-10"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPin(!showPin)}
                disabled={loading}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.pin && (
              <p className="text-xs text-red-500">{errors.pin}</p>
            )}
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="on-leave">Cuti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Tambah Karyawan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
