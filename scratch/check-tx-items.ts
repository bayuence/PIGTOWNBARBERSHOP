import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'transaction_items'
  `;
  console.log('Columns in transaction_items:', columns.map(c => `${c.column_name} (${c.data_type})`));
  await sql.end();
}

run().catch(console.error);
