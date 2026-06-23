import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('🚀 Starting database migration for cost_price columns...');

    console.log('  [1/3] Adding cost_price to services table...');
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;`;
    console.log('  ✅ cost_price added to services');

    console.log('  [2/3] Adding cost_price to transaction_items table...');
    await sql`ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;`;
    console.log('  ✅ cost_price added to transaction_items');

    console.log('  [3/3] Notifying PostgREST to reload schema...');
    await sql`NOTIFY pgrst, 'reload schema';`;
    console.log('  ✅ Schema reloaded');

    console.log('\n✅ Migration completed successfully!');
    console.log('   - services.cost_price     : numeric, default 0');
    console.log('   - transaction_items.cost_price : numeric, default 0');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
