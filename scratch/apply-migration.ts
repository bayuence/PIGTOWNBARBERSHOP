import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  console.log('🚀 Applying migration 0001 columns to Supabase database...');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  
  const sql = postgres(connectionString);
  
  try {
    await sql.unsafe(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL`);
    console.log('✅ Column cost_price added to services');
  } catch (err: any) {
    console.error('❌ Failed adding cost_price to services:', err.message);
  }

  try {
    await sql.unsafe(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "image_url" text`);
    console.log('✅ Column image_url added to services');
  } catch (err: any) {
    console.error('❌ Failed adding image_url to services:', err.message);
  }

  try {
    await sql.unsafe(`ALTER TABLE "transaction_items" ADD COLUMN IF NOT EXISTS "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL`);
    console.log('✅ Column cost_price added to transaction_items');
  } catch (err: any) {
    console.error('❌ Failed adding cost_price to transaction_items:', err.message);
  }
  
  try {
    await sql.unsafe(`NOTIFY pgrst, 'reload schema'`);
    console.log('✅ Reloaded schema cache');
  } catch (err: any) {
    console.error('❌ Failed to reload schema cache:', err.message);
  }

  await sql.end();
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
