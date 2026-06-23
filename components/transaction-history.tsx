/**
 * Transaction History Component
 * 
 * Main orchestrator component for transaction management.
 * Coordinates all transaction-related sub-components and manages global state.
 * 
 * Features:
 * - Transaction list with filtering and search
 * - Statistics cards (revenue, count, etc.)
 * - Transaction detail view
 * - Transaction editing
 * - Commission management
 * - Export functionality
 * - Real-time updates via Supabase
 * 
 * Architecture:
 * This component follows Clean Architecture principles:
 * - Presentation: Sub-components handle UI rendering
 * - Application: This orchestrator manages state and coordination
 * - Infrastructure: Supabase handles data persistence
 * 
 * @see {@link TransactionStatsCards} for statistics display
 * @see {@link TransactionFilters} for filter controls
 * @see {@link TransactionTable} for transaction list
 * @see {@link TransactionDetailModal} for detail view
 * @see {@link TransactionEditModal} for editing
 * @see {@link TransactionCommissionDialog} for commission management
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"
import { 
  supabase, 
  setupTransactionsRealtime, 
  subscribeToEvents,
  broadcastTransactionEvent
} from "../lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { 
  Transaction, 
  Branch, 
  TransactionItem, 
  EditTransactionData,
  Service,
  DateFilterType
} from "./transactions/types"
import { getDateRange } from "@/lib/utils/transaction-helpers"
import { TransactionStatsCards } from "./transactions/transaction-stats-cards"
import { TransactionDeleteDialog } from "./transactions/transaction-delete-dialog"
import { TransactionExportModal } from "./transactions/transaction-export-modal"
import { TransactionFilters } from "./transactions/transaction-filters"
import { TransactionTable } from "./transactions/transaction-table"
import { TransactionDetailModal } from "./transactions/transaction-detail-modal"
import { TransactionEditModal } from "./transactions/transaction-edit-modal"
import { TransactionCommissionDialog } from "./transactions/transaction-commission-dialog"

/**
 * Transaction History Component
 * 
 * Main component for managing and viewing transaction history
 */
export function TransactionHistory() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [statuses, setStatuses] = useState<string[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateFilter, setDateFilter] = useState<DateFilterType>("this_month")
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split("T")[0])
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split("T")[0])

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showCommissionDialog, setShowCommissionDialog] = useState(false)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false)

  // Selected items state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
  const [selectedItemForCommission, setSelectedItemForCommission] = useState<{index: number, item: TransactionItem} | null>(null)

  // Loading state
  const [isEditing, setIsEditing] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const { toast } = useToast()

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch branches from database
   */
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true)
      const { data, error } = await supabase.from("branches").select("id, name, created_at").order("name")
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error("Error fetching branches:", error)
      toast({ title: "Error", description: "Gagal memuat data cabang.", variant: "destructive" })
    } finally {
      setBranchesLoading(false)
    }
  }

  /**
   * Fetch services from database
   */
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase.from("services").select("id, name, price")
      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  /**
   * Fetch employees from database
   * Note: Currently not used in this component but kept for future features
   */
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, position")
        .eq("status", "active")
        .order("name")
      
      console.log("[transaction-history] Employees loaded:", data?.length)
      
      if (error && !data) {
        throw error
      }
      
      // Employees data loaded but not currently used in UI
      // Available for future features like employee filtering
      return data || []
    } catch (error) {
      console.error("Error fetching employees:", error)
      return []
    }
  }

  /**
   * Load commission data for transaction items
   * Note: Currently not used as commission data comes from database
   * Kept for potential future use with real-time commission updates
   */
  const loadCommissionForItems = async (items: TransactionItem[]) => {
    if (!items || items.length === 0) {
      console.log('⚠️ No items to load commission for')
      return items
    }

    try {
      // Ambil semua barber_id yang ada di items
      const barberIds = [...new Set(items.map(item => item.barber_id).filter(Boolean))]
      
      if (barberIds.length === 0) {
        console.log('⚠️ No barber_id found in items')
        return items
      }

      console.log('📊 Loading commission for barbers:', barberIds)
      
      // Ambil semua commission rules untuk barbers ini
      const { data: commissionRules, error } = await supabase
        .from('commission_rules')
        .select('*')
        .in('user_id', barberIds)

      if (error) throw error

      console.log('✅ Commission rules found:', commissionRules?.length || 0)

      // Map items dengan commission data
      const itemsWithCommission = items.map(item => {
        // Cari rule berdasarkan barber_id (bukan cashier_id) dan service_id
        const rule = commissionRules?.find(r => 
          r.user_id === item.barber_id && r.service_id === item.service_id
        )
        
        if (rule) {
          const commissionAmount = rule.commission_type === 'percentage'
            ? (item.unit_price * rule.commission_value / 100)
            : rule.commission_value

          console.log('💰 Commission found for service:', item.service?.name, {
            barber_id: item.barber_id,
            type: rule.commission_type,
            value: rule.commission_value,
            amount: commissionAmount * item.quantity
          })

          return {
            ...item,
            has_commission: true,
            commission_type: rule.commission_type as 'percentage' | 'fixed',
            commission_value: rule.commission_value,
            commission_amount: commissionAmount * item.quantity
          }
        }

        console.log('⚠️ No commission for service:', item.service?.name, 'barber:', item.barber_id)
        return {
          ...item,
          has_commission: false
        }
      })

      return itemsWithCommission
    } catch (error) {
      console.error("❌ Error loading commission:", error)
      return items
    }
  }

  /**
   * Fetch available payment statuses
   */
  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("payment_status")
      if (error) throw error
      if (data) {
        const uniqueStatuses = [...new Set(data.map((tx) => tx.payment_status).filter(Boolean))]
        setStatuses(uniqueStatuses)
      }
    } catch (error) {
      console.error("Error fetching statuses:", error)
    }
  }

  /**
   * Fetch transactions from database with filters
   */
  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate)

      console.log("Fetching transactions for date range:", startDate, "to", endDate)

      let query = supabase
        .from("transactions")
        .select(`
          *,
          transaction_items(
            id,
            service_id,
            service_name,
            service_type,
            service_category,
            quantity,
            unit_price,
            cost_price,
            total_price,
            barber_id,
            commission_status,
            commission_type,
            commission_value,
            commission_amount
          )
        `)
        .gte("created_at", `${startDate}T00:00:00+00:00`)
        .lte("created_at", `${endDate}T23:59:59+00:00`)
        .order("created_at", { ascending: false })

      if (filterBranch !== "all") {
        query = query.eq("branch_id", filterBranch)
      }

      const { data: transactionsData, error } = await query

      if (error) {
        console.error("Supabase error:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log("✅ Fetched transactions:", transactionsData?.length || 0)

      if (transactionsData && transactionsData.length > 0) {
        // Sekarang cashier_name, server_name, branch_name sudah tersedia di transactions
        // Tidak perlu query users lagi karena sudah ada snapshot
        const enrichedTransactions = await Promise.all(
          transactionsData.map(async (transaction) => {
            // Gunakan data komisi yang sudah ada di transaction_items dari database
            const itemsWithCommission = (transaction.transaction_items || []).map((item: any) => {
              // Cek apakah ada data komisi yang tersimpan
              const hasCommissionData = item.commission_status === 'credited' && 
                                       item.commission_amount > 0;
              
              if (hasCommissionData) {
                console.log('✅ Commission data found in DB for item:', item.service_name, {
                  barber_id: item.barber_id,
                  status: item.commission_status,
                  type: item.commission_type,
                  value: item.commission_value,
                  amount: item.commission_amount
                });
              } else {
                console.log('⚠️ No commission data for item:', item.service_name, {
                  status: item.commission_status,
                  barber_id: item.barber_id
                });
              }

              return {
                ...item,
                has_commission: hasCommissionData,
                // Create service object dari snapshot data untuk backward compatibility
                service: item.service_name ? {
                  name: item.service_name,
                  price: item.unit_price
                } : null
              };
            });

            return {
              ...transaction,
              // Gunakan snapshot data yang sudah ada
              cashier: transaction.cashier_name ? { name: transaction.cashier_name } : null,
              server: transaction.server_name ? { name: transaction.server_name } : null,
              branch: transaction.branch_name ? { name: transaction.branch_name } : null,
              transaction_items: itemsWithCommission
            }
          })
        )

        setTransactions(enrichedTransactions)
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error Database",
        description: error instanceof Error ? error.message : "Gagal memuat data transaksi.",
        variant: "destructive",
      })
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  /**
   * Handle transaction deletion
   */
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return
    
    try {
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", transactionToDelete.id)

      if (itemsError) throw itemsError

      const { error: transactionError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionToDelete.id)

      if (transactionError) throw transactionError

      // Broadcast event for real-time updates across components
      broadcastTransactionEvent('transaction_deleted', {
        transaction_id: transactionToDelete.id,
        branch_id: transactionToDelete.branch_id
      })

      toast({
        title: "Berhasil",
        description: `Transaksi #${transactionToDelete.transaction_number} telah dihapus.`,
      })

      await fetchTransactions()
      
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus transaksi.",
        variant: "destructive",
      })
    } finally {
      setIsConfirmDeleteDialogOpen(false)
      setTransactionToDelete(null)
    }
  }

  /**
   * Open edit modal for a transaction
   */
  const handleOpenEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowEditModal(true)
  }

  /**
   * Save edited transaction data
   */
  const handleSaveEdit = async (editData: EditTransactionData) => {
    if (!selectedTransaction) return

    setIsEditing(true)
    try {
      // Update transaction data
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({
          customer_name: editData.customer_name,
          payment_method: editData.payment_method,
          payment_status: editData.payment_status,
          notes: editData.notes,
          discount_amount: editData.discount_amount,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedTransaction.id)

      if (transactionError) throw transactionError

      // Update transaction items
      for (const item of editData.items) {
        const { error: itemError } = await supabase
          .from("transaction_items")
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price
          })
          .eq("id", item.id)

        if (itemError) throw itemError
      }

      // Broadcast event for real-time updates across components
      broadcastTransactionEvent('transaction_updated', {
        transaction_id: selectedTransaction.id,
        branch_id: selectedTransaction.branch_id
      })

      toast({
        title: "Berhasil",
        description: `Transaksi #${selectedTransaction.transaction_number} berhasil diperbarui.`,
      })

      setShowEditModal(false)
      await fetchTransactions()

    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "Gagal",
        description: "Terjadi kesalahan saat memperbarui transaksi.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  // ============================================================================
  // EFFECTS - Lifecycle & Side Effects
  // ============================================================================

  /**
   * Initialize data and setup real-time subscriptions
   */
  useEffect(() => {
    fetchTransactions()
    fetchBranches()
    fetchStatuses()
    fetchServices()
    fetchEmployees()

    // Setup real-time subscriptions for transaction updates
    const transactionsChannel = setupTransactionsRealtime(() => {
      console.log("Transaction change detected, refreshing data...")
      fetchTransactions()
    })

    // Listen for broadcast events from other components
    subscribeToEvents((event: string, payload: any) => {
      console.log('Global event received:', event, payload)
      if (event === 'transaction_created' || event === 'transaction_deleted' || event === 'transaction_updated') {
        fetchTransactions()
      }
    })

    return () => {
      supabase.removeChannel(transactionsChannel)
    }
  }, [dateFilter, customStartDate, customEndDate, filterBranch])

  /**
   * Initialize data and setup real-time subscriptions
   */
  useEffect(() => {
    fetchTransactions()
    fetchBranches()
    fetchStatuses()
    fetchServices()
    fetchEmployees()

    // 🔥 GUNAKAN SETUP GLOBAL YANG BARU
    const transactionsChannel = setupTransactionsRealtime(() => {
      console.log("Transaction change detected, refreshing data...")
      fetchTransactions()
    })

    // 🔥 LISTEN UNTUK BROADCAST EVENTS
    const globalChannel = subscribeToEvents((event: string, payload: any) => {
      console.log('Global event received:', event, payload)
      if (event === 'transaction_created' || event === 'transaction_deleted' || event === 'transaction_updated') {
        fetchTransactions()
      }
    })

    return () => {
      supabase.removeChannel(transactionsChannel)
      // globalChannel might not be a RealtimeChannel, so we skip cleanup
      // The subscribeToEvents function handles its own cleanup
    }
  }, [dateFilter, customStartDate, customEndDate, filterBranch])

  /**
   * Auto refresh transactions every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions()
    }, 30000)
    return () => clearInterval(interval)
  }, [dateFilter, customStartDate, customEndDate, filterBranch])

  // ============================================================================
  // COMPUTED VALUES - Memoized Calculations
  // ============================================================================

  /**
   * Filter transactions based on search term, branch, and status
   */
  const filteredTransactions = useMemo(() => {
    console.log('🔍 Filtering transactions:', { 
      total: transactions.length, 
      searchTerm, 
      filterBranch, 
      filterStatus 
    });
    
    const filtered = transactions.filter((transaction) => {
      // Search filter - jika searchTerm kosong, return true
      const matchesSearch = !searchTerm || 
        transaction.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.server?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesBranch = filterBranch === "all" || transaction.branch_id === filterBranch
      const matchesStatus = filterStatus === "all" || transaction.payment_status === filterStatus
      
      const result = matchesSearch && matchesBranch && matchesStatus
      
      if (searchTerm) {
        console.log('Transaction:', transaction.transaction_number, {
          matchesSearch,
          matchesBranch,
          matchesStatus,
          result
        })
      }
      
      return result
    });
    
    console.log('✅ Filtered transactions:', filtered.length, 'from', transactions.length);
    return filtered;
  }, [transactions, searchTerm, filterBranch, filterStatus])

  // ============================================================================
  // UI ACTION HANDLERS - User Interactions
  // ============================================================================

  /**
   * Generate PDF report (placeholder for future implementation)
   */
  const generatePDFReport = async (_options: { startDate: string; endDate: string; branchId: string; format: string }) => {
    setExportLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({ title: "Fitur PDF Export", description: "Fitur export PDF sedang dalam pengembangan" })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({ title: "Error", description: "Gagal menghasilkan PDF", variant: "destructive" })
    } finally {
      setExportLoading(false)
      setShowExportModal(false)
    }
  }

  /**
   * Open transaction detail modal
   */
  const openTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailModal(true)
  }

  /**
   * Open commission management dialog for a transaction item
   */
  const handleOpenCommissionDialog = (index: number, item: TransactionItem) => {
    if (!selectedTransaction?.cashier_id) {
      toast({
        title: "Error",
        description: "Transaksi ini tidak memiliki kasir. Tidak dapat mengatur komisi.",
        variant: "destructive"
      })
      return
    }

    setSelectedItemForCommission({ index, item })
    setShowCommissionDialog(true)
  }

  // ============================================================================
  // RENDER - Component UI
  // ============================================================================

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-xs md:text-sm text-gray-600">Kelola dan pantau semua transaksi dengan filter fleksibel</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchTransactions} 
            disabled={loading} 
            className="gap-2 flex-1 sm:flex-none text-xs md:text-sm h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 flex-1 sm:flex-none text-xs md:text-sm h-9" 
            onClick={() => setShowExportModal(true)}
          >
            <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <TransactionStatsCards
        transactions={filteredTransactions}
        loading={loading}
        dateFilter={dateFilter}
      />

      {/* Filters - Mobile Responsive */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        filterBranch={filterBranch}
        onBranchChange={setFilterBranch}
        branches={branches}
        branchesLoading={branchesLoading}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        statuses={statuses}
      />

      {/* Transaction List */}
      <TransactionTable
        transactions={filteredTransactions}
        loading={loading}
        totalCount={transactions.length}
        dateFilter={dateFilter}
        onViewDetail={openTransactionDetail}
        onEdit={handleOpenEditModal}
        onDelete={(transaction) => {
          setTransactionToDelete(transaction)
          setIsConfirmDeleteDialogOpen(true)
        }}
        onCommission={(transaction, itemIndex, item) => {
          setSelectedTransaction(transaction)
          handleOpenCommissionDialog(itemIndex, item)
        }}
      />

      {/* Export Modal */}
      <TransactionExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onExport={generatePDFReport}
        branches={branches}
        loading={exportLoading}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onCommission={(itemIndex, item) => {
          handleOpenCommissionDialog(itemIndex, item)
        }}
      />

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        transaction={selectedTransaction}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSaveEdit}
        services={services}
        loading={isEditing}
      />

      {/* Commission Management Dialog */}
      <TransactionCommissionDialog
        item={selectedItemForCommission?.item || null}
        open={showCommissionDialog}
        onOpenChange={setShowCommissionDialog}
        onSave={async (type, value) => {
          if (!selectedTransaction || !selectedItemForCommission) return
          
          const item = selectedItemForCommission.item
          const commissionAmount = type === 'percentage'
            ? (item.unit_price * value / 100) * item.quantity
            : value * item.quantity

          try {
            const { error: itemError } = await supabase
              .from('transaction_items')
              .update({
                commission_status: 'credited',
                commission_type: type,
                commission_value: value,
                commission_amount: commissionAmount
              })
              .eq('id', item.id)

            if (itemError) throw itemError

            if (item.barber_id && item.service_id) {
              const { error: ruleError } = await supabase
                .from('commission_rules')
                .upsert({
                  user_id: item.barber_id,
                  service_id: item.service_id,
                  commission_type: type,
                  commission_value: value,
                }, { onConflict: 'user_id,service_id' })

              if (ruleError) {
                console.warn('Warning: Failed to save commission rule:', ruleError)
              }
            }

            toast({
              title: "Berhasil",
              description: "Komisi berhasil disimpan"
            })

            await fetchTransactions()
            setShowCommissionDialog(false)
            setSelectedItemForCommission(null)
          } catch (error) {
            console.error("Error saving commission:", error)
            toast({
              title: "Gagal",
              description: "Terjadi kesalahan saat menyimpan komisi",
              variant: "destructive"
            })
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <TransactionDeleteDialog
        transaction={transactionToDelete}
        open={isConfirmDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsConfirmDeleteDialogOpen(open)
          if (!open) setTransactionToDelete(null)
        }}
        onConfirm={handleDeleteTransaction}
      />
    </div>
  )
}
