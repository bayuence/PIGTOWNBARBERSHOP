// Script: Lihat semua user detail
// Run: node scratch/lihat-semua-user.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://leoriloxnohuwzyapcou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34'
)

async function main() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, pin, phone, position, branch_id, created_at')
    .order('id', { ascending: true })

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('\n' + '='.repeat(70))
  console.log(`  👥 SEMUA USER PIGTOWN BARBERSHOP (Total: ${users.length})`)
  console.log('='.repeat(70))

  for (const u of users) {
    const tgl = u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'
    console.log(`\n┌── USER #${u.id} ──────────────────────────────────`)
    console.log(`│  Nama      : ${u.name || '-'}`)
    console.log(`│  Email     : ${u.email || '❌ TIDAK ADA'}`)
    console.log(`│  Role      : ${u.role || '-'}`)
    console.log(`│  Posisi    : ${u.position || '-'}`)
    console.log(`│  Status    : ${u.status === 'active' ? '🟢 Active' : '🔴 ' + (u.status || '-')}`)
    console.log(`│  PIN       : ${u.pin ? '✅ ' + u.pin : '❌ Belum ada PIN'}`)
    console.log(`│  Password  : ${u.password !== undefined ? '✅ Ada (hashed)' : '❌ Belum ada'}`)
    console.log(`│  Telepon   : ${u.phone || '-'}`)
    console.log(`│  Branch ID : ${u.branch_id || 'Tidak terikat cabang'}`)
    console.log(`│  Dibuat    : ${tgl}`)
    console.log(`└──────────────────────────────────────────────────`)
  }

  // Ringkasan
  const noEmail = users.filter(u => !u.email)
  const noPin = users.filter(u => !u.pin)
  const inactive = users.filter(u => u.status !== 'active')

  console.log('\n' + '='.repeat(70))
  console.log('  📊 RINGKASAN')
  console.log('='.repeat(70))
  console.log(`  Total User       : ${users.length}`)
  console.log(`  Tanpa Email      : ${noEmail.length} ${noEmail.map(u => u.name).join(', ')}`)
  console.log(`  Tanpa PIN        : ${noPin.length} ${noPin.map(u => u.name).join(', ')}`)
  console.log(`  Tidak Aktif      : ${inactive.length} ${inactive.map(u => u.name).join(', ')}`)
  console.log('='.repeat(70) + '\n')
}

main().catch(console.error)
