/**
 * Transaction Filters Component
 * 
 * Comprehensive filter controls for transaction list:
 * - Search input
 * - Date range selector
 * - Branch filter
 * - Status filter
 * - Custom date range inputs
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import type { Branch, DateFilterType } from "./types"
import { formatStatus } from "@/lib/utils/transaction-helpers"

interface TransactionFiltersProps {
  /** Search term value */
  searchTerm: string
  /** Callback when search term changes */
  onSearchChange: (value: string) => void

  /** Date filter value */
  dateFilter: DateFilterType
  /** Callback when date filter changes */
  onDateFilterChange: (value: DateFilterType) => void

  /** Custom start date (for custom filter) */
  customStartDate: string
  /** Custom end date (for custom filter) */
  customEndDate: string
  /** Callback when custom dates change */
  onCustomDateChange: (start: string, end: string) => void

  /** Branch filter value */
  filterBranch: string
  /** Callback when branch filter changes */
  onBranchChange: (value: string) => void
  /** List of branches */
  branches: Branch[]
  /** Loading state for branches */
  branchesLoading?: boolean

  /** Status filter value */
  filterStatus: string
  /** Callback when status filter changes */
  onStatusChange: (value: string) => void
  /** List of available statuses */
  statuses: string[]
}

/**
 * Transaction Filters
 * 
 * Displays comprehensive filter controls for transaction list
 * 
 * @example
 * ```tsx
 * <TransactionFilters
 *   searchTerm={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   dateFilter={dateFilter}
 *   onDateFilterChange={setDateFilter}
 *   customStartDate={customStartDate}
 *   customEndDate={customEndDate}
 *   onCustomDateChange={(start, end) => {
 *     setCustomStartDate(start)
 *     setCustomEndDate(end)
 *   }}
 *   filterBranch={filterBranch}
 *   onBranchChange={setFilterBranch}
 *   branches={branches}
 *   filterStatus={filterStatus}
 *   onStatusChange={setFilterStatus}
 *   statuses={statuses}
 * />
 * ```
 */
export function TransactionFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  filterBranch,
  onBranchChange,
  branches,
  branchesLoading = false,
  filterStatus,
  onStatusChange,
  statuses
}: TransactionFiltersProps) {
  return (
    <Card>
      <CardHeader className="p-3 md:p-4 lg:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Filter className="h-4 w-4 md:h-5 md:w-5" />
          Filter & Pencarian
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
        {/* Main Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 md:h-4 md:w-4" />
            <Input
              placeholder="Cari transaksi, customer..."
              value={searchTerm}
              onChange={(e) => {
                console.log('🔍 Search term changed:', e.target.value)
                onSearchChange(e.target.value)
              }}
              className="pl-9 md:pl-10 text-xs md:text-sm h-9 md:h-10"
            />
          </div>

          {/* Date Filter */}
          <Select 
            value={dateFilter} 
            onValueChange={(value) => {
              console.log('📅 Date filter changed:', value)
              onDateFilterChange(value as DateFilterType)
            }}
          >
            <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="this_week">Minggu Ini</SelectItem>
              <SelectItem value="this_month">Bulan Ini</SelectItem>
              <SelectItem value="custom">Rentang Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch Filter */}
          <Select 
            value={filterBranch} 
            onValueChange={(value) => {
              console.log('🏢 Branch filter changed:', value)
              onBranchChange(value)
            }} 
            disabled={branchesLoading}
          >
            <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
              <SelectValue placeholder={branchesLoading ? "Memuat..." : "Pilih Cabang"} />
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

          {/* Status Filter */}
          <Select 
            value={filterStatus} 
            onValueChange={(value) => {
              console.log('📊 Status filter changed:', value)
              onStatusChange(value)
            }}
          >
            <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range (shown when dateFilter is "custom") */}
        {dateFilter === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-start-date">Tanggal Mulai</Label>
              <Input
                id="custom-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="custom-end-date">Tanggal Akhir</Label>
              <Input
                id="custom-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
