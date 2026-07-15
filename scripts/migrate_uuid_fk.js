const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    // 1. Clean up invalid UUID values in cash_deposits(branch_id) if any
    // We'll set values that cannot be cast to UUID to NULL
    const cleanupQuery = `
      UPDATE cash_deposits 
      SET branch_id = NULL 
      WHERE branch_id IS NOT NULL AND branch_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
    `;
    await client.query(cleanupQuery);
    console.log("Cleaned up non-UUID branch_ids.");

    // 2. Alter column type to uuid
    const alterTypeQuery = `
      ALTER TABLE cash_deposits 
      ALTER COLUMN branch_id TYPE uuid USING branch_id::uuid;
    `;
    await client.query(alterTypeQuery);
    console.log("SUCCESS: Altered branch_id column to UUID type.");

    // 3. Clean up orphaned branch_ids that do not exist in branches
    const cleanOrphans = `
      UPDATE cash_deposits 
      SET branch_id = NULL 
      WHERE branch_id NOT IN (SELECT id FROM branches);
    `;
    await client.query(cleanOrphans);

    // 4. Add foreign key constraint
    const addFkQuery = `
      ALTER TABLE cash_deposits 
      DROP CONSTRAINT IF EXISTS fk_cash_deposits_branch,
      ADD CONSTRAINT fk_cash_deposits_branch 
      FOREIGN KEY (branch_id) 
      REFERENCES branches(id) 
      ON DELETE SET NULL;
    `;
    await client.query(addFkQuery);
    console.log("SUCCESS: Added foreign key constraint.");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

main();
