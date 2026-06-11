/**
 * Employee Edit Dialog Component
 * 
 * Modal dialog for editing an existing employee.
 * Pre-fills form with current employee data.
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { validateEmployeeForm } from "@/lib/utils/employee-helpers"
import type { Employee, EmployeeFormData } from "@/components/employees/types"

/**
 * Props for EmployeeEditDialog component
 */
export interface EmployeeEditDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Employee to edit */
  employee: Employee | null
  /** Form submit handler */
  onSubmit: (id: string, data: Partial<EmployeeFormData>) => Promise<void>
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Edit Dialog
 * 
 * Dialog for editing an existing employee with form validation.
 * 
 * @param props - Component props
 * @returns Edit dialog component
 */
export function EmployeeEditDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
  loading = false
}: EmployeeEditDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    pin: '',
    status: 'active'
  })
  const [showPin, setShowPin] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Update form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        position: employee.position,
        pin: employee.pin,
        status: employee.status
      })
    }
  }, [employee])
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!employee) return
    
    // Validate form
    const validation = validateEmployeeForm(formData)
    
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    
    // Clear errors
    setErrors({})
    
    // Submit form
    await onSubmit(employee.id, formData)
  }
  
  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      setErrors({})
      setShowPin(false)
      onOpenChange(false)
    }
  }
  
  if (!employee) return null
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            Edit Karyawan
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Update informasi karyawan {employee.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
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
            <Label htmlFor="edit-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-email"
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
            <Label htmlFor="edit-phone">Nomor Telepon</Label>
            <Input
              id="edit-phone"
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
            <Label htmlFor="edit-position">
              Posisi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-position"
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
            <Label htmlFor="edit-pin">
              PIN Keamanan (6 digit) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-pin"
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
            <Label htmlFor="edit-status">Status</Label>
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
              "Update Karyawan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
