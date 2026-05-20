// Get full schema using SQL query
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

async function getFullSchema() {
  console.log('🔍 Getting Full Database Schema...\n');

  const tables = [
    'users', 'branches', 'services', 'transactions', 'transaction_items',
    'attendance', 'kasbon', 'expenses', 'points', 'receipt_templates',
    'profiles', 'customers'
  ];

  const schemaInfo = {};

  for (const tableName of tables) {
    console.log(`\n📋 Analyzing: ${tableName}`);
    
    // Use SQL query to get column information
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      // Fallback: Get from sample data or empty query
      const { data: sampleData } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`  ✅ Columns (${columns.length}): ${columns.join(', ')}`);
        schemaInfo[tableName] = columns;
      } else {
        console.log(`  ⚠️  Empty table, trying to infer...`);
        schemaInfo[tableName] = [];
      }
    } else {
      console.log(`  ✅ Got schema via SQL`);
      schemaInfo[tableName] = data;
    }
  }

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'database-schema-analysis.json',
    JSON.stringify(schemaInfo, null, 2)
  );

  console.log('\n✅ Schema saved to: database-schema-analysis.json');
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE SUMMARY');
  console.log('='.repeat(60));
  
  for (const [table, info] of Object.entries(schemaInfo)) {
    const columnCount = Array.isArray(info) ? info.length : 'unknown';
    console.log(`  ${table.padEnd(25)} | ${columnCount} columns`);
  }
}

getFullSchema();
