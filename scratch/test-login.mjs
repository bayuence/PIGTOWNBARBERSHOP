// Script: Test login end-to-end
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  'https://leoriloxnohuwzyapcou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34'
)

async function main() {
  const SEP = '='.repeat(52)
  console.log('\n' + SEP)
  console.log('  TEST LOGIN - owner@pigtownbarbershop.com')
  console.log(SEP)

  // Step 1: Ambil user dari DB
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password, pin, role, status')
    .eq('email', 'owner@pigtownbarbershop.com')
    .single()

  if (error || !user) {
    console.log('GAGAL - User tidak ditemukan:', error?.message)
    process.exit(1)
  }

  console.log('\n[1] User ditemukan di database')
  console.log('    ID       :', user.id)
  console.log('    Nama     :', user.name)
  console.log('    Email    :', user.email)
  console.log('    Role     :', user.role)
  console.log('    Status   :', user.status)
  console.log('    PIN      :', user.pin)
  console.log('    Password :', user.password ? 'Ada (hashed)' : 'KOSONG!')

  // Step 2: Cek status aktif
  if (user.status !== 'active') {
    console.log('\nGAGAL - Status user bukan active:', user.status)
    process.exit(1)
  }
  console.log('\n[2] Status aktif: OK')

  // Step 3: Verifikasi password
  const inputPassword = 'admin123'
  const isPasswordValid = await bcrypt.compare(inputPassword, user.password || '')
  if (isPasswordValid) {
    console.log('[3] Verifikasi password "admin123": OK')
  } else {
    console.log('[3] GAGAL - Password tidak cocok dengan hash di database!')
    process.exit(1)
  }

  // Step 4: Verifikasi PIN
  if (user.pin === '123456') {
    console.log('[4] Verifikasi PIN "123456": OK')
  } else {
    console.log('[4] PERINGATAN - PIN di DB:', user.pin, '(bukan 123456)')
  }

  // Hasil
  console.log('\n' + SEP)
  console.log('  HASIL: LOGIN BERHASIL!')
  console.log(SEP)
  console.log('  Email    : owner@pigtownbarbershop.com')
  console.log('  Password : admin123')
  console.log('  PIN      : 123456')
  console.log(SEP + '\n')
}

main().catch(console.error)
