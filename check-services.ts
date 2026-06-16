import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://leoriloxnohuwzyapcou.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('services').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in services table:', Object.keys(data[0] || {}));
  }
}
run();
