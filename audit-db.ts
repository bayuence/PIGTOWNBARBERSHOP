import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDatabase() {
  console.log('=== DATABASE AUDIT ===\n');

  // 1. Get all tables
  const { data: tables } = await supabase
    .from('information_schema.tables' as any)
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  // Use alternative approach with rpc or direct query
  // Since RPC isn't available, let's check each critical table

  const criticalTables = [
    'users', 'branches', 'services', 'service_categories',
    'transactions', 'transaction_items', 'attendance',
    'kasbon', 'expenses', 'points', 'commission_rules',
    'receipt_templates', 'branch_shifts', 'outlet_stock',
    'employee_commissions', 'employee_salaries', 'customers',
    'profiles', 'inventory_movements'
  ];

  for (const table of criticalTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${table}: ${error.message} (code: ${error.code})`);
    } else {
      const columns = data && data.length > 0 ? Object.keys(data[0]).join(', ') : '(empty table)';
      console.log(`✅ ${table}: OK - columns sample: ${columns}`);
    }
  }

  // 2. Test key operations
  console.log('\n=== TESTING KEY OPERATIONS ===\n');

  // Test users read
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, name, email, position, role, branch_id, status')
    .limit(3);
  console.log(`Users (3 sample): ${usersErr ? '❌ ' + usersErr.message : '✅ ' + users?.length + ' records - IDs: ' + users?.map(u => u.id).join(', ')}`);

  // Test services read
  const { data: services, error: servErr } = await supabase
    .from('services')
    .select('id, name, type, price')
    .limit(3);
  console.log(`Services: ${servErr ? '❌ ' + servErr.message : '✅ ' + services?.length + ' records'}`);

  // Test branches
  const { data: branches, error: branchErr } = await supabase
    .from('branches')
    .select('id, name')
    .limit(3);
  console.log(`Branches: ${branchErr ? '❌ ' + branchErr.message : '✅ ' + branches?.length + ' records'}`);

  // Test commission_rules insert with correct fields
  const { data: commInsert, error: commErr } = await supabase
    .from('commission_rules')
    .select('id, user_id, service_id, commission_type, commission_value, commission_rate')
    .limit(3);
  console.log(`Commission Rules: ${commErr ? '❌ ' + commErr.message : '✅ ' + commInsert?.length + ' records, columns OK'}`);

  // Test attendance
  const { data: att, error: attErr } = await supabase
    .from('attendance')
    .select('*')
    .limit(1);
  if (attErr) {
    console.log(`❌ Attendance: ${attErr.message}`);
  } else {
    const cols = att && att.length > 0 ? Object.keys(att[0]).join(', ') : '(empty)';
    console.log(`✅ Attendance columns: ${cols}`);
  }

  // Test kasbon
  const { data: kasbon, error: kasbonErr } = await supabase
    .from('kasbon')
    .select('*')
    .limit(1);
  if (kasbonErr) {
    console.log(`❌ Kasbon: ${kasbonErr.message}`);
  } else {
    const cols = kasbon && kasbon.length > 0 ? Object.keys(kasbon[0]).join(', ') : '(empty)';
    console.log(`✅ Kasbon columns: ${cols}`);
  }

  // Test expenses
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);
  if (expErr) {
    console.log(`❌ Expenses: ${expErr.message}`);
  } else {
    const cols = expenses && expenses.length > 0 ? Object.keys(expenses[0]).join(', ') : '(empty)';
    console.log(`✅ Expenses columns: ${cols}`);
  }

  // Test points
  const { data: points, error: pointsErr } = await supabase
    .from('points')
    .select('*')
    .limit(1);
  if (pointsErr) {
    console.log(`❌ Points: ${pointsErr.message}`);
  } else {
    const cols = points && points.length > 0 ? Object.keys(points[0]).join(', ') : '(empty)';
    console.log(`✅ Points columns: ${cols}`);
  }

  // Test transaction_items
  const { data: txItems, error: txErr } = await supabase
    .from('transaction_items')
    .select('*')
    .limit(1);
  if (txErr) {
    console.log(`❌ Transaction Items: ${txErr.message}`);
  } else {
    const cols = txItems && txItems.length > 0 ? Object.keys(txItems[0]).join(', ') : '(empty)';
    console.log(`✅ Transaction Items columns: ${cols}`);
  }

  console.log('\n=== AUDIT COMPLETE ===');
}

auditDatabase();
