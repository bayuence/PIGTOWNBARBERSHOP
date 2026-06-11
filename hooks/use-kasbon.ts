/**
 * ========================================
 * CUSTOM HOOK: useKasbon
 * ========================================
 * Manages kasbon (cash advance) data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getKasbon, type Kasbon } from '@/lib/supabase'

interface UseKasbonOptions {
  employeeId?: number
  status?: string
  autoLoad?: boolean
}

interface UseKasbonReturn {
  kasbon: Kasbon[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useKasbon(options: UseKasbonOptions = {}): UseKasbonReturn {
  const { employeeId, status, autoLoad = true } = options
  
  const [kasbon, setKasbon] = useState<Kasbon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadKasbon = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getKasbon(employeeId)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load kasbon')
      }
      
      // Filter by status if specified
      const filteredData = status 
        ? (data || []).filter(k => k.status === status)
        : (data || [])
      
      setKasbon(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading kasbon:', err)
    } finally {
      setLoading(false)
    }
  }, [employeeId, status])

  useEffect(() => {
    if (autoLoad) {
      loadKasbon()
    }
  }, [autoLoad, loadKasbon])

  return {
    kasbon,
    loading,
    error,
    refetch: loadKasbon,
  }
}
