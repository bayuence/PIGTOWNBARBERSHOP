const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected');
  
  await client.query(
    "ALTER TABLE kasbon ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash'"
  );
  console.log('payment_method column added');
  
  try {
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Schema cache reloaded');
  } catch(e) { 
    console.log('NOTIFY skipped:', e.message); 
  }
  
  // Verify
  const { rows } = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'kasbon' AND column_name = 'payment_method'"
  );
  console.log('Verification:', rows);
  
  await client.end();
  console.log('Done!');
}
run().catch(e => { console.error(e.message); process.exit(1); });
