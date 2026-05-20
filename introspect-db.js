// Script untuk introspect database Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function introspectDatabase() {
  console.log('🔍 Introspecting Supabase Database...\n');

  try {
    // Query untuk mendapatkan semua tabel
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    
    if (tablesError) {
      // Fallback: Query langsung ke information_schema
      console.log('📋 Fetching tables from information_schema...\n');
      
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public');

      if (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Trying alternative method...\n');
        
        // Method 3: Check existing tables by trying to query them
        const commonTables = [
          'users', 'branches', 'services', 'transactions', 'transaction_items',
          'attendance', 'kasbon', 'expenses', 'points', 'receipt_templates',
          'profiles', 'customers', 'inventory', 'payments', 'settings'
        ];

        console.log('🔍 Checking common table names:\n');
        
        for (const tableName of commonTables) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error) {
            console.log(`✅ Table exists: ${tableName}`);
            
            // Get column info
            const { data: columns } = await supabase
              .from(tableName)
              .select('*')
              .limit(0);
            
            if (columns !== null) {
              console.log(`   Columns: ${Object.keys(columns).join(', ')}`);
            }
          }
        }
      } else {
        console.log('📊 Tables found:\n');
        data.forEach(table => {
          console.log(`- ${table.table_name} (${table.table_type})`);
        });
      }
    }

    // Try to get some sample data
    console.log('\n📦 Checking for existing data:\n');
    
    const tablesToCheck = ['users', 'branches', 'services', 'transactions'];
    
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`✅ ${table}: ${count} rows`);
      } else {
        console.log(`❌ ${table}: Table not found or error`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
  }
}

introspectDatabase();
