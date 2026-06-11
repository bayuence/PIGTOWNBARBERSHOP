/**
 * Employee Filters Component
 * 
 * Provides search and filter controls for employee list.
 * Includes search input, status filter, and add employee button.
 */

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, X } from "lucide-react"

/**
 * Props for EmployeeFilters component
 */
export interface EmployeeFiltersProps {
  /** Current search term */
  searchTerm: string
  /** Search change handler */
  onSearchChange: (value: string) => void
  /** Current filter status */
  filterStatus: string
  /** Status change handler */
  onStatusChange: (value: string) => void
  /** Add employee handler */
  onAddEmployee: () => void
  /** Clear filters handler (optional) */
  onClearFilters?: () => void
}

/**
 * Employee Filters
 * 
 * Provides filtering controls for the employee list.
 * 
 * @param props - Component props
 * @returns Filters component
 * 
 * @example
 * <EmployeeFilters
 *   searchTerm={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   filterStatus={filterStatus}
 *   onStatusChange={setFilterStatus}
 *   onAddEmployee={() => setIsAddDialogOpen(true)}
 * />
 */
export function EmployeeFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  onAddEmployee,
  onClearFilters
}: EmployeeFiltersProps) {
  const hasActiveFilters = searchTerm || filterStatus !== 'all'
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama, email, telepon, atau posisi..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Status Filter */}
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Tidak Aktif</SelectItem>
          <SelectItem value="on-leave">Cuti</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Clear Filters Button */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
      
      {/* Add Employee Button */}
      <Button
        onClick={onAddEmployee}
        className="gap-2 w-full sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden xs:inline">Tambah Karyawan</span>
        <span className="xs:hidden">Tambah</span>
      </Button>
    </div>
  )
}
