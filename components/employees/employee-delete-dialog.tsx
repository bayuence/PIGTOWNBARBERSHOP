/**
 * Employee Delete Dialog Component
 * 
 * Confirmation dialog for deleting an employee.
 * Shows warning message and employee name.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { Employee } from "@/components/employees/types"

/**
 * Props for EmployeeDeleteDialog component
 */
export interface EmployeeDeleteDialogProps {
  /** Dialog open state */
  open: boolean
  /** Open state change handler */
  onOpenChange: (open: boolean) => void
  /** Employee to delete */
  employee: Employee | null
  /** Delete confirmation handler */
  onConfirm: (id: string) => Promise<void>
  /** Loading state */
  loading?: boolean
}

/**
 * Employee Delete Dialog
 * 
 * Confirmation dialog for deleting an employee.
 * 
 * @param props - Component props
 * @returns Delete dialog component
 * 
 * @example
 * <EmployeeDeleteDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   employee={selectedEmployee}
 *   onConfirm={handleDeleteEmployee}
 *   loading={loading}
 * />
 */
export function EmployeeDeleteDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  loading = false
}: EmployeeDeleteDialogProps) {
  /**
   * Handle delete confirmation
   */
  const handleConfirm = async () => {
    if (employee) {
      await onConfirm(employee.id)
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
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Hapus Karyawan</DialogTitle>
              <DialogDescription className="text-sm">
                Tindakan ini tidak dapat dibatalkan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus karyawan{" "}
            <span className="font-semibold text-foreground">{employee.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Semua data terkait karyawan ini akan dihapus secara permanen.
          </p>
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Hapus Karyawan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
