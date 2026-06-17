import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Gunakan service role key di sisi server untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://leoriloxnohuwzyapcou.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: 'PIN tidak valid' }, { status: 400 })
    }

    // Cari user berdasarkan PIN - berjalan di server sehingga bypass RLS
    // Gunakan .limit(1) bukan .single() karena bisa ada banyak user dengan PIN sama
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, position, branch_id, status, pin')
      .eq('pin', pin)
      .eq('status', 'active')
      .limit(1)

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'PIN tidak ditemukan' }, { status: 401 })
    }

    // Ambil user pertama yang cocok
    const user = data[0]

    // Jangan kirim PIN ke klien
    const { pin: _, ...userWithoutPin } = user

    return NextResponse.json({ user: userWithoutPin })
  } catch (err) {
    console.error('[verify-pin] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
