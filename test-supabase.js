// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return;
  
  const equalIndex = line.indexOf('=');
  if (equalIndex > 0) {
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseKey ? '✅ Configured' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to Supabase...\n');
    
    // Test 1: Check if we can query the database
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .limit(5);
    
    if (branchError) {
      console.log('⚠️  Branches table:', branchError.message);
    } else {
      console.log('✅ Branches table: Connected successfully');
      console.log(`   Found ${branches?.length || 0} branches`);
    }
    
    // Test 2: Check users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (userError) {
      console.log('⚠️  Users table:', userError.message);
    } else {
      console.log('✅ Users table: Connected successfully');
      console.log(`   Found ${users?.length || 0} users`);
    }
    
    // Test 3: Check services table
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .limit(5);
    
    if (serviceError) {
      console.log('⚠️  Services table:', serviceError.message);
    } else {
      console.log('✅ Services table: Connected successfully');
      console.log(`   Found ${services?.length || 0} services`);
    }
    
    // Test 4: Check transactions table
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (transError) {
      console.log('⚠️  Transactions table:', transError.message);
    } else {
      console.log('✅ Transactions table: Connected successfully');
      console.log(`   Found ${transactions?.length || 0} transactions`);
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
