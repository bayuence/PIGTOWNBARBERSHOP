/**
 * Real-time Subscriptions
 * Fungsi untuk real-time updates menggunakan Supabase Realtime
 */

import { supabase } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// =============================
// REAL-TIME SETUP FUNCTIONS
// =============================

/**
 * Setup real-time untuk transactions
 */
export function setupTransactionsRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('transactions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      console.log('Transaction changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

/**
 * Setup real-time untuk attendance
 */
export function setupAttendanceRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('attendance-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
      console.log('Attendance changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

/**
 * Setup real-time untuk expenses
 */
export function setupExpensesRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('expenses-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
      console.log('Expense changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

/**
 * Setup real-time untuk kasbon
 */
export function setupKasbonRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('kasbon-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kasbon' }, () => {
      console.log('Kasbon changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

/**
 * Setup real-time untuk commissions
 */
export function setupCommissionsRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('commissions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, () => {
      console.log('Commission changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

/**
 * Setup real-time untuk points
 */
export function setupPointsRealtime(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel('points-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'points' }, () => {
      console.log('Points changed, triggering callback...')
      callback()
    })
    .subscribe()

  return channel
}

// =============================
// BROADCAST EVENTS
// =============================

/**
 * Subscribe to broadcast events
 */
export function subscribeToEvents(
  callback: (event: string, payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel('global-events')
    .on('broadcast', { event: '*' }, ({ event, payload }) => {
      console.log('Broadcast event received:', event, payload)
      callback(event, payload)
    })
    .subscribe()

  return channel
}

/**
 * Broadcast transaction event
 */
export async function broadcastTransactionEvent(
  event: 'transaction_created' | 'transaction_updated' | 'transaction_deleted',
  payload: { transaction_id: string; branch_id?: string }
) {
  const channel = supabase.channel('global-events')
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

/**
 * Broadcast attendance event
 */
export async function broadcastAttendanceEvent(
  event: 'attendance_checked_in' | 'attendance_checked_out' | 'attendance_break_start' | 'attendance_break_end',
  payload: { user_id: string; branch_id: string }
) {
  const channel = supabase.channel('global-events')
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

/**
 * Broadcast expense event
 */
export async function broadcastExpenseEvent(
  event: 'expense_created' | 'expense_approved' | 'expense_rejected',
  payload: { expense_id: string; branch_id: string }
) {
  const channel = supabase.channel('global-events')
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

/**
 * Broadcast kasbon event
 */
export async function broadcastKasbonEvent(
  event: 'kasbon_requested' | 'kasbon_approved' | 'kasbon_rejected' | 'kasbon_paid',
  payload: { kasbon_id: string; user_id: string }
) {
  const channel = supabase.channel('global-events')
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

// =============================
// CLEANUP
// =============================

/**
 * Remove a channel subscription
 */
export function removeChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

/**
 * Remove all channels
 */
export function removeAllChannels() {
  supabase.removeAllChannels()
}
