import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixManagerIdColumn() {
  console.log('🔧 Starting database migration...\n');

  try {
    // Step 1: Check current manager_id values
    console.log('Step 1: Checking current manager_id values...');
    const { data: branches, error: fetchError } = await supabase
      .from('branches')
      .select('id, name, manager_id');

    if (fetchError) {
      console.error('❌ Error fetching branches:', fetchError);
      return;
    }

    console.log(`Found ${branches?.length || 0} branches`);
    console.log('Current manager_id values:', branches?.map(b => ({ name: b.name, manager_id: b.manager_id })));

    // Step 2: Execute SQL to alter column type
    console.log('\nStep 2: Altering manager_id column type from UUID to INTEGER...');
    
    // Note: Supabase client doesn't support raw SQL DDL commands
    // We need to use Supabase SQL Editor or pg client
    console.log('\n⚠️  IMPORTANT: You need to run this SQL in Supabase SQL Editor:\n');
    console.log('--------------------------------------------------');
    console.log(`
-- Drop the existing manager_id column if it exists
ALTER TABLE branches DROP COLUMN IF EXISTS manager_id;

-- Add manager_id column as INTEGER with foreign key to users
ALTER TABLE branches ADD COLUMN manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'branches' AND column_name = 'manager_id';
`);
    console.log('--------------------------------------------------\n');

    console.log('📋 Instructions:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the SQL above');
    console.log('3. Click "Run" to execute');
    console.log('4. Come back here and press Enter to verify\n');

    // Wait for user confirmation
    await new Promise<void>((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Press Enter after running the SQL in Supabase Dashboard...', () => {
        readline.close();
        resolve();
      });
    });

    // Step 3: Verify the change
    console.log('\nStep 3: Verifying the change...');
    const { data: updatedBranches, error: verifyError } = await supabase
      .from('branches')
      .select('id, name, manager_id');

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      return;
    }

    console.log('✅ Verification successful!');
    console.log('Updated manager_id values:', updatedBranches?.map(b => ({ name: b.name, manager_id: b.manager_id })));

    // Step 4: Test assigning a manager
    console.log('\nStep 4: Testing manager assignment...');
    const { data: testUser } = await supabase
      .from('users')
      .select('id, name')
      .limit(1)
      .single();

    if (testUser && updatedBranches && updatedBranches[0]) {
      const { error: updateError } = await supabase
        .from('branches')
        .update({ manager_id: testUser.id })
        .eq('id', updatedBranches[0].id);

      if (updateError) {
        console.error('❌ Error testing manager assignment:', updateError);
      } else {
        console.log(`✅ Successfully assigned ${testUser.name} as manager of ${updatedBranches[0].name}`);
        
        // Verify
        const { data: verifiedBranch } = await supabase
          .from('branches')
          .select('name, manager_id')
          .eq('id', updatedBranches[0].id)
          .single();

        console.log('Verified:', verifiedBranch);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Now you can use the manager dropdown in the UI.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixManagerIdColumn();
