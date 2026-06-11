/**
 * ========================================
 * CUSTOM HOOK: useRealtimeSubscription
 * ========================================
 * Generic hook for Supabase realtime subscriptions
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  callback: (payload: any) => void
  enabled?: boolean
}

export function useRealtimeSubscription(options: UseRealtimeSubscriptionOptions) {
  const { table, event = '*', filter, callback, enabled = true } = options
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Create unique channel name
    const channelName = `${table}_${event}_${Date.now()}`
    
    // Setup subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, filter, callback, enabled])

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    },
  }
}
