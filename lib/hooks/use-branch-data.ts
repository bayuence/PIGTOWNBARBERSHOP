/**
 * Branch Data Management Hook
 * 
 * Custom hook for fetching and managing branch data with real-time updates.
 */

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Branch, BranchFormData } from "@/components/branches/types"

export interface UseBranchDataReturn {
  branches: Branch[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addBranch: (data: BranchFormData) => Promise<{ success: boolean; error?: string }>
  updateBranch: (id: string, data: Partial<BranchFormData>) => Promise<{ success: boolean; error?: string }>
  deleteBranch: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function useBranchData(): UseBranchDataReturn {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const loadBranches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (branchesError) {
        console.error("Error loading branches:", branchesError)
        setError("Gagal memuat data cabang")
        return
      }
      
      // Transform data to match Branch interface
      const transformedBranches: Branch[] = (branchesData || []).map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address || "",
        phone: branch.phone || "",
        manager: branch.manager || "",
        employees: 0,
        status: branch.status || "active",
        revenue: "0",
        customers: 0,
        rating: 0,
        openTime: branch.open_time || "09:00",
        closeTime: branch.close_time || "21:00",
        services: [],
        shifts: [],
        branchEmployees: [],
        targets: [],
        settings: {
          autoAcceptBookings: true,
          allowWalkIns: true,
          requireDeposit: false,
          depositAmount: 50000,
          cancellationPolicy: "24 jam sebelumnya",
          maxAdvanceBooking: 30,
          timezone: "Asia/Jakarta",
          currency: "IDR",
          taxRate: 10,
          serviceCommission: 15
        },
        created_at: branch.created_at
      }))
      
      setBranches(transformedBranches)
    } catch (err) {
      console.error("Error loading branches:", err)
      setError("Terjadi kesalahan saat memuat data cabang")
    } finally {
      setLoading(false)
    }
  }, [])
  
  const addBranch = useCallback(async (data: BranchFormData) => {
    try {
      const { data: newBranch, error: addError } = await supabase
        .from("branches")
        .insert({
          name: data.name,
          address: data.address,
          phone: data.phone,
          manager: data.manager,
          open_time: data.openTime,
          close_time: data.closeTime,
          status: "active"
        })
        .select()
        .single()
      
      if (addError) {
        console.error("Error adding branch:", addError)
        return { success: false, error: addError.message }
      }
      
      await loadBranches()
      return { success: true }
    } catch (err: any) {
      console.error("Error in addBranch:", err)
      return { success: false, error: err.message }
    }
  }, [loadBranches])
  
  const updateBranch = useCallback(async (id: string, data: Partial<BranchFormData>) => {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.address) updateData.address = data.address
      if (data.phone) updateData.phone = data.phone
      if (data.manager) updateData.manager = data.manager
      if (data.openTime) updateData.open_time = data.openTime
      if (data.closeTime) updateData.close_time = data.closeTime
      
      const { error: updateError } = await supabase
        .from("branches")
        .update(updateData)
        .eq("id", id)
      
      if (updateError) {
        console.error("Error updating branch:", updateError)
        return { success: false, error: updateError.message }
      }
      
      await loadBranches()
      return { success: true }
    } catch (err: any) {
      console.error("Error in updateBranch:", err)
      return { success: false, error: err.message }
    }
  }, [loadBranches])
  
  const deleteBranch = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("branches")
        .delete()
        .eq("id", id)
      
      if (deleteError) {
        console.error("Error deleting branch:", deleteError)
        return { success: false, error: deleteError.message }
      }
      
      await loadBranches()
      return { success: true }
    } catch (err: any) {
      console.error("Error in deleteBranch:", err)
      return { success: false, error: err.message }
    }
  }, [loadBranches])
  
  useEffect(() => {
    loadBranches()
  }, [loadBranches])
  
  return {
    branches,
    loading,
    error,
    refetch: loadBranches,
    addBranch,
    updateBranch,
    deleteBranch
  }
}
