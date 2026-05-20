// Script untuk inspect schema detail
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log('🔍 Inspecting Database Schema in Detail...\n');

  const tables = [
    'users', 'branches', 'services', 'transactions', 'transaction_items',
    'attendance', 'kasbon', 'expenses', 'points', 'receipt_templates',
    'profiles', 'customers'
  ];

  for (const tableName of tables) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
    console.log('='.repeat(60));

    // Get sample data to see structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Error: ${error.message}\n`);
      continue;
    }

    if (data && data.length > 0) {
      const sample = data[0];
      console.log('\n📊 Columns:');
      
      Object.entries(sample).forEach(([key, value]) => {
        const type = value === null ? 'null' : typeof value;
        const valuePreview = value === null ? 'NULL' : 
                            typeof value === 'object' ? JSON.stringify(value).substring(0, 50) :
                            String(value).substring(0, 50);
        console.log(`  - ${key.padEnd(25)} | ${type.padEnd(10)} | ${valuePreview}`);
      });

      // Get row count
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      console.log(`\n📈 Total Rows: ${count}`);
    } else {
      console.log('\n⚠️  Table is empty, fetching structure differently...');
      
      // Try to get structure from empty table
      const { data: emptyData, error: emptyError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (!emptyError && emptyData !== null) {
        console.log('\n📊 Columns (from empty table):');
        console.log('  (No data to infer types)');
      }
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ Schema Inspection Complete!');
  console.log('='.repeat(60));
}

inspectSchema();
