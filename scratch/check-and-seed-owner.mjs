// Script: Cek user yang ada + buat akun owner
// Run: node scratch/check-and-seed-owner.mjs

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = 'https://leoriloxnohuwzyapcou.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('='.repeat(50))
  console.log('  PIGTOWN BARBERSHOP - CEK USER & SEED OWNER')
  console.log('='.repeat(50))

  // ── 1. Cek semua user yang ada ──────────────────────
  console.log('\n📋 Mengambil daftar user dari database...\n')
  const { data: existingUsers, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, role, status, pin, branch_id, created_at')
    .order('created_at', { ascending: true })

  if (fetchError) {
    console.error('❌ Gagal ambil data user:', fetchError.message)
    process.exit(1)
  }

  if (!existingUsers || existingUsers.length === 0) {
    console.log('⚠️  Belum ada user sama sekali di database (total: 0)')
  } else {
    console.log(`✅ Total user ditemukan: ${existingUsers.length}`)
    console.log('\n┌─────────────────────────────────────────────────────────────────┐')
    console.log('│  ID  │ Nama                │ Email                   │ Role     │ PIN    │')
    console.log('├─────────────────────────────────────────────────────────────────┤')
    for (const u of existingUsers) {
      const id   = String(u.id).padEnd(4)
      const name = (u.name || '-').substring(0, 19).padEnd(19)
      const email = (u.email || '-').substring(0, 23).padEnd(23)
      const role = (u.role || '-').padEnd(8)
      const pin  = u.pin ? '✅ Ada' : '❌ None'
      console.log(`│ ${id} │ ${name} │ ${email} │ ${role} │ ${pin} │`)
    }
    console.log('└─────────────────────────────────────────────────────────────────┘')
  }

  // ── 2. Cek apakah owner sudah ada ──────────────────
  console.log('\n🔍 Mengecek apakah akun owner sudah ada...')
  const ownerEmail = 'owner@pigtownbarbershop.com'
  const ownerExists = existingUsers?.find(u => u.email === ownerEmail)

  if (ownerExists) {
    console.log(`\n⚠️  Akun owner SUDAH ADA (ID: ${ownerExists.id}, Email: ${ownerExists.email})`)
    console.log('   Memperbarui password dan PIN...\n')

    // Update password & PIN
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        pin: '123456',
        role: 'owner',
        status: 'active',
      })
      .eq('email', ownerEmail)

    if (updateError) {
      console.error('❌ Gagal update owner:', updateError.message)
      process.exit(1)
    }
    console.log('✅ Password dan PIN owner berhasil diperbarui!')

  } else {
    // ── 3. Buat akun owner baru ────────────────────────
    console.log('\n➕ Akun owner belum ada. Membuat akun baru...\n')

    const hashedPassword = await bcrypt.hash('admin123', 12)

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: 'Owner',
        email: ownerEmail,
        password: hashedPassword,
        pin: '123456',
        role: 'owner',
        status: 'active',
        position: 'Owner',
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Gagal membuat akun owner:', insertError.message)
      console.error('   Detail:', insertError.details || insertError.hint || '')
      process.exit(1)
    }

    console.log('✅ Akun owner berhasil dibuat!')
    console.log('   ID     :', newUser.id)
    console.log('   Nama   :', newUser.name)
    console.log('   Email  :', newUser.email)
    console.log('   Role   :', newUser.role)
  }

  // ── 4. Ringkasan credentials ────────────────────────
  console.log('\n' + '='.repeat(50))
  console.log('  ✅ CREDENTIALS OWNER')
  console.log('='.repeat(50))
  console.log('  Email    : owner@pigtownbarbershop.com')
  console.log('  Password : admin123')
  console.log('  PIN      : 123456')
  console.log('  Role     : owner')
  console.log('='.repeat(50) + '\n')
}

main().catch(console.error)
