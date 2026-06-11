/**
 * ========================================
 * CUSTOM HOOK: useBranches
 * ========================================
 * Manages branch data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getBranches, type Branch } from '@/lib/supabase'

interface UseBranchesOptions {
  activeOnly?: boolean
  autoLoad?: boolean
}

interface UseBranchesReturn {
  branches: Branch[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useBranches(options: UseBranchesOptions = {}): UseBranchesReturn {
  const { activeOnly = true, autoLoad = true } = options
  
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getBranches()
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load branches')
      }
      
      // Filter active branches if needed
      const filteredData = activeOnly 
        ? (data || []).filter(branch => branch.status === 'active')
        : (data || [])
      
      setBranches(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading branches:', err)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    if (autoLoad) {
      loadBranches()
    }
  }, [autoLoad, loadBranches])

  return {
    branches,
    loading,
    error,
    refetch: loadBranches,
  }
}
