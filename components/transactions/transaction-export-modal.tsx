/**
 * Transaction Export Modal Component
 * 
 * Modal dialog for exporting transaction data to PDF/Excel.
 * Allows selection of date range and branch filter.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, RefreshCw } from "lucide-react"
import type { Branch, ExportOptions } from "./types"

interface TransactionExportModalProps {
  /** Modal open state */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when export is triggered */
  onExport: (options: ExportOptions) => Promise<void> | void
  /** List of branches for filter */
  branches: Branch[]
  /** Loading state during export */
  loading?: boolean
}

/**
 * Transaction Export Modal
 * 
 * Displays a modal for configuring and exporting transaction data
 * 
 * @example
 * ```tsx
 * <TransactionExportModal
 *   open={showExportModal}
 *   onOpenChange={setShowExportModal}
 *   onExport={handleExport}
 *   branches={branches}
 * />
 * ```
 */
export function TransactionExportModal({
  open,
  onOpenChange,
  onExport,
  branches,
  loading = false
}: TransactionExportModalProps) {
  // Export options state
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [branchId, setBranchId] = useState("all")
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")

  // Handle export
  const handleExport = async () => {
    await onExport({
      startDate,
      endDate,
      branchId,
      format
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Laporan Transaksi</DialogTitle>
          <DialogDescription>
            Pilih rentang tanggal dan cabang untuk laporan transaksi yang akan di-export.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Start Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">
              Dari Tanggal
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">
              Sampai Tanggal
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>

          {/* Branch Filter */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch" className="text-right">
              Cabang
            </Label>
            <Select value={branchId} onValueChange={setBranchId} disabled={loading}>
              <SelectTrigger id="branch" className="col-span-3">
                <SelectValue placeholder="Pilih Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={(value: "pdf" | "excel") => setFormat(value)} disabled={loading}>
              <SelectTrigger id="format" className="col-span-3">
                <SelectValue placeholder="Pilih Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={loading} 
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
