const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    // 1. Drop the columns verified_by to recreate it with integer type
    const query = `
      ALTER TABLE cash_deposits 
      DROP COLUMN IF EXISTS verified_by;
      
      ALTER TABLE cash_deposits 
      ADD COLUMN verified_by integer;
    `;

    await client.query(query);
    console.log("SUCCESS: Changed verified_by column type to integer in cash_deposits table.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

main();
