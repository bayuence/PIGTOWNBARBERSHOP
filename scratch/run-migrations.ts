import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  console.log('🚀 Running migrations via Drizzle ORM migrator...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('✅ Migrations applied successfully!');
  await sql.end();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
