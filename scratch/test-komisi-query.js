const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
  const { data, error } = await supabase
    .from('transaction_items')
    .select(`
        id,
        barber_id,
        users:barber_id(name),
        transactions:transaction_id(server_id)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

testQuery();
