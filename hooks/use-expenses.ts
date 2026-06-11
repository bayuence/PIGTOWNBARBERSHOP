/**
 * ========================================
 * CUSTOM HOOK: useExpenses
 * ========================================
 * Manages expense data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getExpenses, type Expense } from '@/lib/supabase'

interface UseExpensesOptions {
  branchId?: string
  startDate?: string
  endDate?: string
  autoLoad?: boolean
}

interface UseExpensesReturn {
  expenses: Expense[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { branchId, startDate, endDate, autoLoad = true } = options
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getExpenses(branchId, startDate, endDate)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load expenses')
      }
      
      setExpenses(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading expenses:', err)
    } finally {
      setLoading(false)
    }
  }, [branchId, startDate, endDate])

  useEffect(() => {
    if (autoLoad) {
      loadExpenses()
    }
  }, [autoLoad, loadExpenses])

  return {
    expenses,
    loading,
    error,
    refetch: loadExpenses,
  }
}
