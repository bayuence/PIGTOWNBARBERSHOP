/**
 * POS Barber Selector Component
 * 
 * Select barber/server for service.
 */

"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scissors } from "lucide-react"
import type { Employee } from "./types"

// ============================================================================
// PROPS
// ============================================================================

interface POSBarberSelectorProps {
  value: string
  onChange: (value: string) => void
  employees: Employee[]
  required?: boolean
  loading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * POS Barber Selector Component
 * 
 * Features:
 * - Employee dropdown
 * - Filter by position (barber)
 * - Optional/required indicator
 * - Loading state
 */
export function POSBarberSelector({
  value,
  onChange,
  employees,
  required = false,
  loading = false
}: POSBarberSelectorProps) {
  
  // Filter employees by barber position
  const barbers = employees.filter(
    (emp) => emp.position?.toLowerCase().includes("barber") || 
             emp.position?.toLowerCase().includes("tukang")
  )
  
  return (
    <div className="space-y-2">
      <Label htmlFor="barber" className="flex items-center gap-2">
        <Scissors className="h-4 w-4" />
        Barber/Server {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger id="barber" className="w-full">
          <SelectValue placeholder={loading ? "Memuat..." : "Pilih Barber"} />
        </SelectTrigger>
        <SelectContent>
          {barbers.length === 0 ? (
            <SelectItem value="none" disabled>
              Tidak ada barber tersedia
            </SelectItem>
          ) : (
            barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.name} - {barber.position}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {!required && (
        <p className="text-xs text-muted-foreground">
          Opsional - Kosongkan jika tidak ada barber spesifik
        </p>
      )}
    </div>
  )
}
