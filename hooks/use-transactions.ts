/**
 * ========================================
 * CUSTOM HOOK: useTransactions
 * ========================================
 * Manages transaction data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getTransactions, type Transaction } from '@/lib/supabase'

interface UseTransactionsOptions {
  branchId?: string
  limit?: number
  autoLoad?: boolean
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { branchId, limit = 50, autoLoad = true } = options
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getTransactions(branchId, limit)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load transactions')
      }
      
      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [branchId, limit])

  useEffect(() => {
    if (autoLoad) {
      loadTransactions()
    }
  }, [autoLoad, loadTransactions])

  return {
    transactions,
    loading,
    error,
    refetch: loadTransactions,
  }
}
