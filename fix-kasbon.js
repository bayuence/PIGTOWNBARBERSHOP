const { Client } = require('pg');

async function fixKasbonSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004354@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database. Modifying schema...");

    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE kasbon 
      ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC;
    `);
    console.log("Columns added.");

    // Update existing records
    await client.query(`
      UPDATE kasbon SET remaining_amount = amount WHERE status != 'paid' AND remaining_amount IS NULL;
      UPDATE kasbon SET remaining_amount = 0, paid_amount = amount WHERE status = 'paid';
    `);
    console.log("Existing records updated successfully.");

    // Important: Refresh PostgREST schema cache
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log("PostgREST schema cache reloaded.");
    
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

fixKasbonSchema();
