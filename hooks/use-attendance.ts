/**
 * ========================================
 * CUSTOM HOOK: useAttendance
 * ========================================
 * Manages attendance data fetching and state
 */

import { useState, useEffect, useCallback } from 'react'
import { getAttendance, type Attendance } from '@/lib/supabase'

interface UseAttendanceOptions {
  branchId?: string
  date?: string
  autoLoad?: boolean
}

interface UseAttendanceReturn {
  attendance: Attendance[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAttendance(options: UseAttendanceOptions = {}): UseAttendanceReturn {
  const { branchId, date, autoLoad = true } = options
  
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getAttendance(branchId, date)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to load attendance')
      }
      
      setAttendance(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error loading attendance:', err)
    } finally {
      setLoading(false)
    }
  }, [branchId, date])

  useEffect(() => {
    if (autoLoad) {
      loadAttendance()
    }
  }, [autoLoad, loadAttendance])

  return {
    attendance,
    loading,
    error,
    refetch: loadAttendance,
  }
}
