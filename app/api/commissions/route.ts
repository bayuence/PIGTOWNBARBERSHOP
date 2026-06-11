import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key - bypasses RLS and has full access
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, service_id, commission_type, commission_value } = body

    if (!user_id || !service_id || !commission_type || commission_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Cek duplikat
    const { data: existing } = await supabase
      .from('commission_rules')
      .select('id')
      .eq('user_id', parseInt(user_id))
      .eq('service_id', parseInt(service_id))

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'duplicate', code: '23505' }, { status: 409 })
    }

    // Insert baru menggunakan service role (bypass schema cache via auth header)
    const { data, error } = await supabase
      .from('commission_rules')
      .insert({
        user_id: parseInt(user_id),
        service_id: parseInt(service_id),
        commission_type,
        commission_value: String(commission_value),
        commission_rate: String(commission_value), // satisfy NOT NULL constraint
        is_active: true,
      })
      .select()

    if (error) {
      console.error('[POST /api/commissions] Supabase error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ data: data?.[0] })
  } catch (error: any) {
    console.error('[POST /api/commissions] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, commission_type, commission_value } = body

    if (!id || !commission_type || commission_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('commission_rules')
      .update({
        commission_type,
        commission_value: String(commission_value),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('[PUT /api/commissions] Supabase error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ data: data?.[0] })
  } catch (error: any) {
    console.error('[PUT /api/commissions] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { error } = await supabase
      .from('commission_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/commissions] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: true })
  } catch (error: any) {
    console.error('[DELETE /api/commissions] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.from('commission_rules').select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
