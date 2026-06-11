import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // The service role client talks to Supabase using the service key
    // We can trigger a schema reload by making a special admin API call
    const projectRef = 'leoriloxnohuwzyapcou'
    
    // Try Supabase Management API
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Service role key won't work here - need personal access token
        // But let's try the direct REST notification approach
      },
    })

    // Alternative: just return info about what needs to happen
    return NextResponse.json({
      message: 'Schema cache reload requires Supabase Dashboard access',
      instruction: `Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new and run: NOTIFY pgrst, 'reload schema';`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  // Health check for the API
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    
    // Test if commission_rules is accessible
    const { data, error } = await supabase
      .from('commission_rules')
      .select('id, commission_type, commission_value')
      .limit(1)
    
    return NextResponse.json({
      status: error ? 'error' : 'ok',
      error: error?.message,
      code: error?.code,
      sampleData: data
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
