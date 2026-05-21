-- ========================================
-- FIX DATA TYPES IN transaction_items
-- ========================================
-- Change service_id and barber_id from INTEGER to UUID

-- Step 1: Drop existing data (if any) to avoid conversion errors
-- TRUNCATE TABLE transaction_items;

-- Step 2: Change service_id from INTEGER to UUID
ALTER TABLE transaction_items 
ALTER COLUMN service_id TYPE UUID USING service_id::text::uuid;

-- Step 3: Change barber_id from INTEGER to UUID  
ALTER TABLE transaction_items 
ALTER COLUMN barber_id TYPE UUID USING barber_id::text::uuid;

-- Step 4: Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transaction_items'
  AND column_name IN ('service_id', 'barber_id', 'transaction_id')
ORDER BY ordinal_position;
