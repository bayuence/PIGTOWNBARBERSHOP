import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://leoriloxnohuwzyapcou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NzI5NSwiZXhwIjoyMDkzNzQzMjk1fQ.3lqHvz84G4D1_wxzq-MUwQIl_m6l6Fnd20cNM12Ev5A'
)

async function checkUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, status, pin')
    .order('id')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Users in database:')
    console.table(data)
  }
}

checkUsers()
