/**
 * POS Customer Input Component
 * 
 * Customer information input with branch selection.
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserIcon, MapPin } from "lucide-react"
import type { Branch } from "./types"

// ============================================================================
// PROPS
// ============================================================================

interface POSCustomerInputProps {
  customerName: string
  onCustomerNameChange: (value: string) => void
  selectedBranch: string
  onBranchChange: (value: string) => void
  branches: Branch[]
  branchesLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Customer Input Component
 * 
 * Features:
 * - Customer name input
 * - Branch selector
 * - Icons for visual clarity
 * - Loading state for branches
 */
export function POSCustomerInput({
  customerName,
  onCustomerNameChange,
  selectedBranch,
  onBranchChange,
  branches,
  branchesLoading = false
}: POSCustomerInputProps) {
  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="customer-name" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Nama Customer
        </Label>
        <Input
          id="customer-name"
          placeholder="Masukkan nama customer"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      {/* Branch Selection */}
      <div className="space-y-2">
        <Label htmlFor="branch" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Cabang
        </Label>
        <Select
          value={selectedBranch}
          onValueChange={onBranchChange}
          disabled={branchesLoading}
        >
          <SelectTrigger id="branch" className="w-full">
            <SelectValue placeholder={branchesLoading ? "Memuat..." : "Pilih Cabang"} />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.name}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
