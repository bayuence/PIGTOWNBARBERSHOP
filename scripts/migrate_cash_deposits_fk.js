const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    // Add foreign key constraint between cash_deposits(branch_id) and branches(id)
    // First, ensure all existing branch_ids in cash_deposits actually exist in branches table to prevent constraint violation
    // (If there are orphans, we set them to NULL or handle them)
    const fixOrphansQuery = `
      UPDATE cash_deposits 
      SET branch_id = NULL 
      WHERE branch_id NOT IN (SELECT id FROM branches);
    `;
    await client.query(fixOrphansQuery);
    console.log("Cleaned up orphaned branch_ids if any.");

    const addFkQuery = `
      ALTER TABLE cash_deposits 
      DROP CONSTRAINT IF EXISTS fk_cash_deposits_branch,
      ADD CONSTRAINT fk_cash_deposits_branch 
      FOREIGN KEY (branch_id) 
      REFERENCES branches(id) 
      ON DELETE SET NULL;
    `;
    await client.query(addFkQuery);
    console.log("SUCCESS: Foreign key constraint added between cash_deposits and branches.");

    // Let's also check if supabase cache reloading is needed (it will automatically reload when schema changes)
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

main();
