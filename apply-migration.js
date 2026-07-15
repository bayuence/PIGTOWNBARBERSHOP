const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "kasbon_payments" (
      "id" serial PRIMARY KEY NOT NULL,
      "kasbon_id" integer NOT NULL,
      "amount" numeric(12, 2) NOT NULL,
      "payment_method" text NOT NULL,
      "payment_type" text NOT NULL,
      "payment_date" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('Migration applied successfully');
  await client.end();
}
run().catch(console.error);
