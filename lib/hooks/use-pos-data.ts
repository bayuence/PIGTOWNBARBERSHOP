/**
 * usePOSData Hook
 * 
 * Custom hook for fetching and managing POS system data.
 * Handles loading states, errors, and real-time updates.
 * 
 * @example
 * ```tsx
 * const {
 *   services,
 *   categories,
 *   branches,
 *   employees,
 *   receiptTemplate,
 *   outletStock,
 *   loading,
 *   stockLoading,
 *   error,
 *   refetch,
 *   loadOutletStock
 * } = usePOSData()
 * ```
 */

import { useState, useEffect, useCallback } from "react"
import {
  supabase,
  getServicesWithCategories,
  getServiceCategories,
  getBranches,
  getActiveReceiptTemplate,
  getOutletStock,
  subscribeToEvents,
  type ServiceWithCategory,
  type Branch,
  type ReceiptTemplateWithBranch,
  type OutletStock
} from "@/lib/supabase"
import type { Employee, ServiceCategory } from "@/components/pos/types"

/**
 * POS data hook return type
 */
interface UsePOSDataReturn {
  // Data
  services: ServiceWithCategory[]
  categories: ServiceCategory[]
  branches: Branch[]
  employees: Employee[]
  receiptTemplate: ReceiptTemplateWithBranch | null
  outletStock: OutletStock[]
  currentUser: Employee | null
  
  // Loading states
  loading: boolean
  stockLoading: boolean
  
  // Error state
  error: string | null
  
  // Actions
  refetch: () => Promise<void>
  loadOutletStock: (branchId: string) => Promise<void>
  setCurrentUser: (user: Employee | null) => void
}

/**
 * Custom hook for POS data management
 * 
 * Features:
 * - Fetches all required POS data on mount
 * - Real-time updates via Supabase subscriptions
 * - Auto-refresh every 30 seconds
 * - Stock management per branch
 * - Error handling
 * 
 * @returns POS data and actions
 */
export function usePOSData(): UsePOSDataReturn {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [receiptTemplate, setReceiptTemplate] = useState<ReceiptTemplateWithBranch | null>(null)
  const [outletStock, setOutletStock] = useState<OutletStock[]>([])
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [stockLoading, setStockLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================
  
  /**
   * Load services with categories
   */
  const loadServices = useCallback(async () => {
    try {
      const { data, error } = await getServicesWithCategories()
      if (error) {
        console.error("Error loading services:", error)
        throw error
      }
      setServices(data || [])
    } catch (err) {
      console.error("Failed to load services:", err)
    }
  }, [])
  
  /**
   * Load service categories
   */
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await getServiceCategories()
      if (error) {
        console.error("Error loading categories:", error)
        throw error
      }
      setCategories(data || [])
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }, [])
  
  /**
   * Load branches
   */
  const loadBranches = useCallback(async () => {
    try {
      const { data, error } = await getBranches()
      if (error) {
        console.error("Error loading branches:", error)
        throw error
      }
      setBranches(data || [])
    } catch (err) {
      console.error("Failed to load branches:", err)
    }
  }, [])
  
  /**
   * Load employees (active users)
   */
  const loadEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, position, status, branch_id")
        .eq("status", "active")
        .order("name")
      
      if (error) {
        console.error("Error loading employees:", error)
        throw error
      }
      
      const employeeData = (data || []) as Employee[]
      setEmployees(employeeData)
      
      // Set current user to first employee if not set
      if (!currentUser && employeeData.length > 0) {
        setCurrentUser(employeeData[0])
      }
    } catch (err) {
      console.error("Failed to load employees:", err)
    }
  }, [currentUser])
  
  /**
   * Load receipt template
   */
  const loadReceiptTemplate = useCallback(async () => {
    try {
      const { data, error } = await getActiveReceiptTemplate()
      if (error) {
        console.error("Error loading receipt template:", error)
        // Don't throw - receipt template is optional
      }
      setReceiptTemplate(data)
    } catch (err) {
      console.error("Failed to load receipt template:", err)
    }
  }, [])
  
  /**
   * Load outlet stock for specific branch
   * 
   * @param branchId - Branch ID to load stock for
   */
  const loadOutletStock = useCallback(async (branchId: string) => {
    if (!branchId) {
      console.warn("No branch ID provided for stock loading")
      return
    }
    
    setStockLoading(true)
    try {
      const { data, error } = await getOutletStock(branchId)
      if (error) {
        console.error("Error loading outlet stock:", error)
        throw error
      }
      setOutletStock(data || [])
    } catch (err) {
      console.error("Failed to load outlet stock:", err)
    } finally {
      setStockLoading(false)
    }
  }, [])
  
  /**
   * Load all initial data
   */
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        loadServices(),
        loadCategories(),
        loadBranches(),
        loadEmployees(),
        loadReceiptTemplate()
      ])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load POS data"
      setError(errorMessage)
      console.error("Error loading initial data:", err)
    } finally {
      setLoading(false)
    }
  }, [loadServices, loadCategories, loadBranches, loadEmployees, loadReceiptTemplate])
  
  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    await loadInitialData()
  }, [loadInitialData])
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Load initial data on mount and setup subscriptions
   */
  useEffect(() => {
    loadInitialData()
    
    // Subscribe to services changes
    const servicesSubscription = supabase
      .channel("pos_services_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => {
          console.log("Services changed, reloading...")
          loadServices()
        }
      )
      .subscribe()
    
    // Subscribe to categories changes
    const categoriesSubscription = supabase
      .channel("pos_categories_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_categories" },
        () => {
          console.log("Categories changed, reloading...")
          loadCategories()
        }
      )
      .subscribe()
    
    // Subscribe to global events (from other components)
    const eventsChannel = subscribeToEvents((event: string, payload: any) => {
      console.log("POS received event:", event, payload)
      
      // Refresh services when transactions change (for stock updates)
      if (event === "transaction_created" || event === "transaction_deleted") {
        loadServices()
      }
    })
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(servicesSubscription)
      supabase.removeChannel(categoriesSubscription)
      // eventsChannel cleanup is handled by subscribeToEvents
    }
  }, [loadInitialData, loadServices, loadCategories])
  
  /**
   * Auto-refresh services every 30 seconds
   * (for stock updates and price changes)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing services...")
      loadServices()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [loadServices])
  
  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Data
    services,
    categories,
    branches,
    employees,
    receiptTemplate,
    outletStock,
    currentUser,
    
    // Loading states
    loading,
    stockLoading,
    
    // Error state
    error,
    
    // Actions
    refetch,
    loadOutletStock,
    setCurrentUser
  }
}
