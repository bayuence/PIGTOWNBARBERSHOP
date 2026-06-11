/**
 * Employee Absence Dialog Component
 * 
 * Modal dialog for managing employee absence/leave days.
 * Allows updating maximum allowed absence days.
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
import { Loader2, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import type { Employee, AbsenceInfo } from "@/components/employees/types"

/**
 * Props for EmployeeAbsenceDialog component
 */
export interface EmployeeAbsenceDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Employee to manage */
  employee: Employee | null
  /** Absence information */
  absenceInfo: AbsenceInfo
  /** Update max days handler */
  onUpdateMaxDays: (employeeId: string, maxDays: number) => Promise<void>
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Absence Dialog
 * 
 * Dialog for managing employee absence days.
 * 
 * @param props - Component props
 * @returns Absence dialog component
 */
export function EmployeeAbsenceDialog({
  open,
  onOpenChange,
  employee,
  absenceInfo,
  onUpdateMaxDays,
  loading = false
}: EmployeeAbsenceDialogProps) {
  const [maxDays, setMaxDays] = useState(absenceInfo.maxAbsentDays)
  
  // Update maxDays when absenceInfo changes
  useEffect(() => {
    setMaxDays(absenceInfo.maxAbsentDays)
  }, [absenceInfo])
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (employee && maxDays >= 0) {
      await onUpdateMaxDays(employee.id, maxDays)
    }
  }
  
  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }
  
  if (!employee) return null
  
  const hasExcessDays = absenceInfo.excessDays > 0
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Kelola Hari Libur</DialogTitle>
          <DialogDescription className="text-sm">
            Atur jumlah hari libur untuk {employee.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Hari Libur Saat Ini</p>
              </div>
              <p className="text-2xl font-bold">{absenceInfo.currentAbsentDays}</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Sisa Hari</p>
              </div>
              <p className={`text-2xl font-bold ${hasExcessDays ? 'text-red-600' : 'text-green-600'}`}>
                {absenceInfo.remainingDays}
              </p>
            </div>
          </div>
          
          {/* Excess Days Warning */}
          {hasExcessDays && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Melebihi Batas</p>
                <p className="text-xs text-red-700">
                  Karyawan telah melebihi {absenceInfo.excessDays} hari dari batas yang ditentukan.
                </p>
              </div>
            </div>
          )}
          
          {/* Max Days Input */}
          <div className="space-y-2">
            <Label htmlFor="maxDays">
              Maksimal Hari Libur
            </Label>
            <Input
              id="maxDays"
              type="number"
              min="0"
              value={maxDays}
              onChange={(e) => setMaxDays(parseInt(e.target.value) || 0)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Jumlah maksimal hari libur yang diperbolehkan per periode
            </p>
          </div>
          
          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs text-blue-900">
                Perubahan akan langsung diterapkan dan mempengaruhi perhitungan sisa hari libur.
              </p>
            </div>
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
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
