const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.leoriloxnohuwzyapcou:%4015Mei2004saja@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "cash_deposits" (
      "id" serial PRIMARY KEY NOT NULL,
      "branch_id" text NOT NULL,
      "amount" numeric(12, 2) NOT NULL,
      "deposit_date" timestamp DEFAULT now() NOT NULL,
      "submitted_by" integer NOT NULL,
      "submitter_name" text NOT NULL,
      "note" text,
      "proof_url" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('cash_deposits table created successfully');
  const { rows } = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'cash_deposits\'');
  console.log('Columns:', rows);
  await client.end();
}
run().catch(console.error);
