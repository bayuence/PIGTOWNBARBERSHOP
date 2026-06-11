/**
 * ========================================
 * CUSTOM HOOK: useServices
 * ========================================
 * Manages services/products data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getServices, type ServiceWithCategory } from '@/lib/supabase'

interface UseServicesOptions {
  activeOnly?: boolean
  autoLoad?: boolean
}

interface UseServicesReturn {
  services: ServiceWithCategory[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const { activeOnly = true, autoLoad = true } = options
  
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getServices()
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load services')
      }
      
      // Filter active services if needed
      const filteredData = activeOnly 
        ? (data || []).filter(service => service.aktif !== false)
        : (data || [])
      
      setServices(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    if (autoLoad) {
      loadServices()
    }
  }, [autoLoad, loadServices])

  return {
    services,
    loading,
    error,
    refetch: loadServices,
  }
}
