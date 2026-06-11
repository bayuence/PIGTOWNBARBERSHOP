/**
 * ========================================
 * CUSTOM HOOK: useEmployees
 * ========================================
 * Manages employee data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getEmployees, type User } from '@/lib/supabase'

interface UseEmployeesOptions {
  branchId?: string
  role?: string
  autoLoad?: boolean
}

interface UseEmployeesReturn {
  employees: User[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useEmployees(options: UseEmployeesOptions = {}): UseEmployeesReturn {
  const { branchId, role, autoLoad = true } = options
  
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getEmployees(branchId)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load employees')
      }
      
      // Filter by role if specified
      const filteredData = role 
        ? (data || []).filter(emp => emp.role === role)
        : (data || [])
      
      setEmployees(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading employees:', err)
    } finally {
      setLoading(false)
    }
  }, [branchId, role])

  useEffect(() => {
    if (autoLoad) {
      loadEmployees()
    }
  }, [autoLoad, loadEmployees])

  return {
    employees,
    loading,
    error,
    refetch: loadEmployees,
  }
}
