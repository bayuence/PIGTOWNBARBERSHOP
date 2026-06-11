import postgres from 'postgres';

async function patchDatabase() {
  console.log('🔧 Adding shifts and settings columns to branches table...\n');

  // Direct URL to avoid pooler tenant/user issues
  const directUrl = 'postgresql://postgres:@15Mei2004354@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require';
  const sql = postgres(directUrl);

  const patches = [
    `ALTER TABLE branches ADD COLUMN IF NOT EXISTS shifts JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE branches ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;`
  ];

  try {
    for (const query of patches) {
      await sql.unsafe(query);
      console.log(`✅ Executed: ${query}`);
    }
    
    await sql.unsafe(`NOTIFY pgrst, 'reload schema'`);
    console.log(`✅ Schema cache reloaded`);

  } catch (error) {
    console.error('\n❌ Error executing patch:', error);
  } finally {
    await sql.end();
  }
}

patchDatabase();
