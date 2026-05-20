// Script to hash owner password
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function hashOwnerPassword() {
  console.log('🔐 Hashing Owner Password...\n');

  // Current plain text password
  const plainPassword = 'pemilik123';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  console.log('Plain Password:', plainPassword);
  console.log('Hashed Password:', hashedPassword);
  console.log('');

  // Update password in database
  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', 'owner@pigtownbarbershop.com')
    .select();

  if (error) {
    console.error('❌ Error updating password:', error.message);
    return;
  }

  console.log('✅ Password successfully hashed and updated!');
  console.log('');
  console.log('📝 Updated user:', data[0]);
  console.log('');
  console.log('⚠️  IMPORTANT: Update your login form to use bcrypt.compare()');
  console.log('');
  console.log('Example:');
  console.log('```typescript');
  console.log('import bcrypt from "bcryptjs";');
  console.log('');
  console.log('const isValid = await bcrypt.compare(inputPassword, user.password);');
  console.log('if (isValid) {');
  console.log('  // Login success');
  console.log('}');
  console.log('```');
}

hashOwnerPassword();
