-- Check transaction_items table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'transaction_items'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'transaction_items'
) as table_exists;

-- Check recent transaction_items
SELECT * FROM transaction_items
ORDER BY created_at DESC
LIMIT 5;
