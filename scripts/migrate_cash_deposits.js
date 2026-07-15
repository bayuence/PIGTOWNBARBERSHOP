const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    // Alter table cash_deposits to add new columns
    const query = `
      ALTER TABLE cash_deposits 
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      ADD COLUMN IF NOT EXISTS verified_by uuid,
      ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS reject_reason text;
    `;

    await client.query(query);
    console.log("SUCCESS: Columns status, verified_by, verified_at, and reject_reason have been added to cash_deposits table.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

main();
