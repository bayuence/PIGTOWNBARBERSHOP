import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCols() {
  const tables = ['employee_salaries', 'employee_commissions', 'expenses', 'users'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ ${t}: ${error.message}`);
    } else {
      console.log(`✅ ${t} columns: ${Object.keys(data?.[0] || {}).join(', ')}`);
      // Use swagger to get schema
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
      const schema = await res.json();
      const tableDef = schema.definitions[t];
      if (tableDef) {
        console.log(`Schema for ${t}:`, Object.keys(tableDef.properties).join(', '));
      }
    }
  }
}
checkCols();
