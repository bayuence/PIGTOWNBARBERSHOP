const { Client } = require('pg');

async function runKasbonMigration() {
  // Use the DATABASE_URL from .env
  const connectionString = process.env.DATABASE_URL || 
    "postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to database.");

    // Check current kasbon columns
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'kasbon'
      ORDER BY ordinal_position;
    `);
    console.log("\n📋 Current kasbon columns:");
    cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) default: ${c.column_default}`));

    // Add paid_amount column if not exists
    console.log("\n🔧 Running migration: ADD COLUMN paid_amount...");
    await client.query(`
      ALTER TABLE "kasbon" 
      ADD COLUMN IF NOT EXISTS "paid_amount" numeric(12, 2) DEFAULT '0';
    `);
    console.log("✅ paid_amount column added (or already exists).");

    // Add remaining_amount column if not exists
    console.log("🔧 Running migration: ADD COLUMN remaining_amount...");
    await client.query(`
      ALTER TABLE "kasbon" 
      ADD COLUMN IF NOT EXISTS "remaining_amount" numeric(12, 2) DEFAULT '0';
    `);
    console.log("✅ remaining_amount column added (or already exists.");

    // Update existing records: set paid_amount and remaining_amount correctly
    await client.query(`
      UPDATE kasbon 
      SET paid_amount = 0 
      WHERE paid_amount IS NULL;
    `);
    await client.query(`
      UPDATE kasbon 
      SET remaining_amount = amount - COALESCE(paid_amount, 0)
      WHERE remaining_amount IS NULL OR remaining_amount = 0 AND status != 'paid';
    `);
    await client.query(`
      UPDATE kasbon 
      SET paid_amount = amount, remaining_amount = 0 
      WHERE status = 'paid' AND paid_amount = 0;
    `);
    console.log("✅ Existing records updated.");

    // Reload PostgREST schema cache so Supabase REST API picks up new columns
    try {
      await client.query(`NOTIFY pgrst, 'reload schema'`);
      console.log("✅ PostgREST schema cache reloaded.");
    } catch(e) {
      console.log("ℹ️  Could not send NOTIFY (this is OK for transaction pooler connections).");
    }

    // Verify columns after migration
    const { rows: newCols } = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'kasbon'
      ORDER BY ordinal_position;
    `);
    console.log("\n✅ kasbon columns after migration:");
    newCols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) default: ${c.column_default}`));

    console.log("\n🎉 Migration completed successfully! The app should work now.");

  } catch (err) {
    console.error("❌ Migration error:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runKasbonMigration();
