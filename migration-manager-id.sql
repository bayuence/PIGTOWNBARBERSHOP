-- Migration: Fix manager_id column type mismatch
-- Problem: branches.manager_id is UUID but users.id is INTEGER
-- Solution: Drop and recreate manager_id as INTEGER with foreign key

-- Step 1: Drop the existing manager_id column
ALTER TABLE branches DROP COLUMN IF EXISTS manager_id;

-- Step 2: Add manager_id column as INTEGER with foreign key to users
ALTER TABLE branches ADD COLUMN manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN branches.manager_id IS 'Foreign key to users.id - the manager of this branch';

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);

-- Step 5: Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'branches' AND column_name = 'manager_id';

-- Expected result:
-- column_name  | data_type | is_nullable | column_default
-- manager_id   | integer   | YES         | NULL
