import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key not found in .env')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper untuk parse HH:MM:SS ke menit
const toMinutes = (timeStr: string) => {
  const parts = timeStr.split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

// Helper dari calculateShiftTimes (sederhana)
const calculateTotalHours = (checkIn: string, checkOut: string, shift: any) => {
  let workMins = toMinutes(checkOut) - toMinutes(checkIn)
  if (workMins < 0) workMins = 0

  let totalBreakMins = 0
  if (shift.break_times && Array.isArray(shift.break_times)) {
    for (const bt of shift.break_times) {
      if (!bt.start || !bt.end) continue
      const bStart = toMinutes(bt.start)
      const bEnd = toMinutes(bt.end)
      let currentBStart = bStart
      let currentBEnd = Math.min(bEnd, toMinutes(checkOut))
      
      if (currentBEnd > currentBStart) {
        totalBreakMins += (currentBEnd - currentBStart)
      }
    }
  }

  if (totalBreakMins > workMins) totalBreakMins = workMins
  return (workMins - totalBreakMins) / 60
}

async function main() {
  console.log('Fetching branch_shifts...')
  const { data: shifts, error: shiftError } = await supabase.from('branch_shifts').select('*')
  if (shiftError) throw shiftError

  console.log(`Found ${shifts.length} branch shifts`)

  const todayStr = new Date().toISOString().split('T')[0]

  console.log(`Fetching attendance records up to today (${todayStr})...`)
  const { data: records, error: recError } = await supabase
    .from('attendance')
    .select('*')
    .lte('date', todayStr)

  if (recError) throw recError

  console.log(`Found ${records.length} historical attendance records`)

  let updatedCount = 0

  for (const rec of records) {
    if (!rec.check_in_time) continue // skip if no checkin

    // Find shift
    let shiftData = shifts.find(s => 
      String(s.branch_id) === String(rec.branch_id) && 
      (s.shift_type === rec.shift_type)
    )
    if (!shiftData) {
      shiftData = shifts.find(s => s.shift_type === rec.shift_type)
    }

    if (!shiftData || !shiftData.end_time) continue

    let needsUpdate = false
    let newCheckOut = rec.check_out_time
    let newStatus = rec.status

    const shiftEndMins = toMinutes(shiftData.end_time)

    // Kasus 1: Belum checkout tapi hari sudah lewat
    if (newStatus === 'present' || newStatus === 'on-break' || newStatus === 'on_break' || !newCheckOut) {
      newCheckOut = shiftData.end_time
      newStatus = 'checked_out'
      needsUpdate = true
      console.log(`[ID: ${rec.id}] - Missing checkout on ${rec.date}, auto-closing to ${newCheckOut}`)
    }
    // Kasus 2: Checkout melebihi batas jam shift
    else if (newCheckOut) {
      const checkoutMins = toMinutes(newCheckOut)
      if (checkoutMins > shiftEndMins) {
        newCheckOut = shiftData.end_time
        needsUpdate = true
        console.log(`[ID: ${rec.id}] - Overtime on ${rec.date}: ${rec.check_out_time} > ${shiftData.end_time}, capping to ${newCheckOut}`)
      }
    }

    if (needsUpdate) {
      // Pastikan format detik ada HH:MM:SS
      if (newCheckOut.split(':').length === 2) {
        newCheckOut += ':00'
      }

      const totalHours = calculateTotalHours(rec.check_in_time, newCheckOut, shiftData)

      const { error: updateErr } = await supabase
        .from('attendance')
        .update({
          check_out_time: newCheckOut,
          status: newStatus,
          total_hours: totalHours
        })
        .eq('id', rec.id)

      if (updateErr) {
        console.error(`Failed to update record ${rec.id}:`, updateErr)
      } else {
        updatedCount++
      }
    }
  }

  console.log(`\nDONE! Successfully updated ${updatedCount} records.`)
}

main().catch(console.error)
