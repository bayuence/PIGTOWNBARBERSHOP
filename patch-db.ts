import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function patchDatabase() {
  console.log('🔧 Patching database columns...\n');

  // Gunakan connection URL dari .env
  const directUrl = 'postgresql://postgres:@15Mei2004354@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require';
  const sql = postgres(directUrl);

  const patches = [
    // users table - salary, commission_rate, max_absent_days, current_absent_days  
    `ALTER TABLE users 
     ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0,
     ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
     ADD COLUMN IF NOT EXISTS max_absent_days integer DEFAULT 4,
     ADD COLUMN IF NOT EXISTS current_absent_days integer DEFAULT 0,
     ADD COLUMN IF NOT EXISTS updated_at timestamp`,

    // services table  
    `ALTER TABLE services
     ADD COLUMN IF NOT EXISTS updated_at timestamp,
     ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 5`,

    // kasbon - add expense_date if missing
    `ALTER TABLE kasbon
     ADD COLUMN IF NOT EXISTS expense_date timestamp`,

    // expenses - ensure request_date exists
    `ALTER TABLE expenses
     ADD COLUMN IF NOT EXISTS request_date timestamp`,

    // transaction_items - ensure barber_name snapshot
    `ALTER TABLE transaction_items
     ADD COLUMN IF NOT EXISTS barber_name varchar`
  ];

  try {
    for (const query of patches) {
      await sql.unsafe(query);
      console.log(`✅ Executed: ${query.substring(0, 50).replace(/\n/g, '')}...`);
    }
    
    await sql.unsafe(`NOTIFY pgrst, 'reload schema'`);
    console.log(`✅ Schema cache reloaded`);

    const users = await sql.unsafe(`SELECT id, name, salary FROM users LIMIT 1`);
    console.log('\n✅ salary column verified! Sample:', users);

  } catch (error) {
    console.error('\n❌ Error executing patch:', error);
  } finally {
    await sql.end();
  }
}

patchDatabase();
