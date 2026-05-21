// Check transactions table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransactionsSchema() {
  console.log('🔍 Checking transactions table schema...\n');

  // Try to get a sample transaction (if any)
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);

  if (error) {
    console.log('⚠️  No transactions yet or error:', error.message);
    console.log('\n📝 Creating a test transaction to see schema...\n');
    
    // Try to insert a test transaction to see what columns are expected
    const { data: testData, error: testError } = await supabase
      .from('transactions')
      .insert({
        transaction_number: 'TEST-001',
        branch_id: '35311060-97ab-4dcb-a9c6-11382d88e6f9', // Use first branch
        cashier_id: 1, // Owner
        subtotal: 100000,
        discount: 0,
        total: 100000,
        payment_method: 'cash',
        payment_amount: 100000,
        change_amount: 0,
        cashier_name: 'Owner',
        branch_name: 'Test Branch'
      })
      .select();

    if (testError) {
      console.error('❌ Error creating test transaction:', testError);
      console.log('\nError details:', JSON.stringify(testError, null, 2));
    } else {
      console.log('✅ Test transaction created successfully!');
      console.log('\n📊 Transaction columns:');
      if (testData && testData[0]) {
        Object.keys(testData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof testData[0][key]}`);
        });
      }
      
      // Delete test transaction
      await supabase
        .from('transactions')
        .delete()
        .eq('transaction_number', 'TEST-001');
      console.log('\n🗑️  Test transaction deleted');
    }
  } else {
    if (data && data.length > 0) {
      console.log('✅ Found existing transaction!');
      console.log('\n📊 Transaction columns:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]}`);
      });
    } else {
      console.log('⚠️  Transactions table is empty');
    }
  }
}

checkTransactionsSchema();
