/**
 * Employee Payroll Dialog Component
 * 
 * Modal dialog for managing employee payroll settings.
 * Allows updating salary, commission rate, and overtime rate.
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
import { Loader2, DollarSign } from "lucide-react"
import { formatRupiah, validatePayrollForm } from "@/lib/utils/employee-helpers"
import type { Employee, PayrollFormData } from "@/components/employees/types"

/**
 * Props for EmployeePayrollDialog component
 */
export interface EmployeePayrollDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Employee to manage */
  employee: Employee | null
  /** Form submit handler */
  onSubmit: (id: string, data: PayrollFormData) => Promise<void>
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Payroll Dialog
 * 
 * Dialog for managing employee payroll settings.
 * 
 * @param props - Component props
 * @returns Payroll dialog component
 */
export function EmployeePayrollDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
  loading = false
}: EmployeePayrollDialogProps) {
  const [formData, setFormData] = useState<PayrollFormData>({
    baseSalary: 3000000,
    commissionRate: 0,
    overtimeRate: 0,
    bonusPoints: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Update form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        baseSalary: employee.salary || 3000000,
        commissionRate: employee.commission_rate || 0,
        overtimeRate: employee.overtime_rate || 0,
        bonusPoints: 0 // This would come from stats if needed
      })
    }
  }, [employee])
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!employee) return
    
    // Validate form
    const validation = validatePayrollForm(formData)
    
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
      onOpenChange(false)
    }
  }
  
  if (!employee) return null
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Kelola Gaji</DialogTitle>
          <DialogDescription className="text-sm">
            Atur informasi gaji untuk {employee.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Base Salary */}
          <div className="space-y-2">
            <Label htmlFor="baseSalary">
              Gaji Pokok <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="baseSalary"
                type="number"
                min="0"
                step="100000"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: parseInt(e.target.value) || 0 })}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.baseSalary && (
              <p className="text-xs text-red-500">{errors.baseSalary}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Preview: {formatRupiah(formData.baseSalary)}
            </p>
          </div>
          
          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commissionRate">
              Rate Komisi (%)
            </Label>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
              disabled={loading}
            />
            {errors.commissionRate && (
              <p className="text-xs text-red-500">{errors.commissionRate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Persentase komisi dari setiap transaksi (0-100%)
            </p>
          </div>
          
          {/* Overtime Rate */}
          <div className="space-y-2">
            <Label htmlFor="overtimeRate">
              Rate Lembur (per jam)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="overtimeRate"
                type="number"
                min="0"
                step="10000"
                value={formData.overtimeRate}
                onChange={(e) => setFormData({ ...formData, overtimeRate: parseInt(e.target.value) || 0 })}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.overtimeRate && (
              <p className="text-xs text-red-500">{errors.overtimeRate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Preview: {formatRupiah(formData.overtimeRate)}/jam
            </p>
          </div>
          
          {/* Bonus Points (Read-only for now) */}
          <div className="space-y-2">
            <Label htmlFor="bonusPoints">
              Bonus Points
            </Label>
            <Input
              id="bonusPoints"
              type="number"
              value={formData.bonusPoints}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Bonus points dihitung otomatis berdasarkan performa
            </p>
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
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
