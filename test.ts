import 'dotenv/config';
import { supabase } from './lib/supabase';
supabase.from('kasbon').select('*').limit(1).then(data => {
  console.log("DATA:");
  console.log(data);
});
