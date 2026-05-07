// =====================================================
// TEST KONEKSI SUPABASE
// =====================================================
// 
// Jalankan dengan: node test-connection.js
//
// =====================================================

const SUPABASE_URL = 'https://leoriloxnohuwzyapcou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34';

console.log('🔍 Testing Supabase Connection...\n');
console.log('Project URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...\n');

// Test 1: Ping Supabase REST API
console.log('📡 Test 1: Ping REST API...');
fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ REST API: Connected!\n');
    return true;
  } else {
    console.log('❌ REST API: Failed!');
    console.log('Status:', response.status, response.statusText, '\n');
    return false;
  }
})
.then(success => {
  if (!success) return;
  
  // Test 2: Query menu table
  console.log('📊 Test 2: Query menu table...');
  return fetch(`${SUPABASE_URL}/rest/v1/menu?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
})
.then(response => {
  if (!response) return;
  return response.json();
})
.then(data => {
  if (!data) return;
  
  console.log('✅ Menu table: Found', data.length, 'items');
  if (data.length > 0) {
    console.log('   Sample:', data[0].nama, '-', 'Rp', data[0].harga);
  }
  console.log('');
  
  // Test 3: Query users table
  console.log('👤 Test 3: Query users table...');
  return fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
})
.then(response => {
  if (!response) return;
  return response.json();
})
.then(data => {
  if (!data) return;
  
  console.log('✅ Users table: Found', data.length, 'users');
  if (data.length > 0) {
    console.log('   Sample:', data[0].email, '-', data[0].role);
  }
  console.log('');
  
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Database connection is working!');
  console.log('✅ You can now run: npm run dev');
})
.catch(error => {
  console.error('❌ ERROR:', error.message);
  console.log('\n⚠️  Troubleshooting:');
  console.log('1. Check if Supabase project is active');
  console.log('2. Check if credentials are correct');
  console.log('3. Check internet connection');
  console.log('4. Run setup_rls_policies.sql if you get permission errors');
});
