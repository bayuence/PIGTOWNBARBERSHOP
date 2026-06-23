const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://leoriloxnohuwzyapcou.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log('Checking columns in services...');
    const { data: services, error: sErr } = await supabase.from('services').select('id, name, price, cost_price').limit(1);
    if (sErr) {
      console.error('❌ Services check failed:', sErr.message);
    } else {
      console.log('✅ Services check success! Columns exist. Sample:', services);
    }

    console.log('Checking columns in transaction_items...');
    const { data: items, error: iErr } = await supabase.from('transaction_items').select('id, quantity, unit_price, cost_price').limit(1);
    if (iErr) {
      console.error('❌ Transaction items check failed:', iErr.message);
    } else {
      console.log('✅ Transaction items check success! Columns exist. Sample:', items);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
