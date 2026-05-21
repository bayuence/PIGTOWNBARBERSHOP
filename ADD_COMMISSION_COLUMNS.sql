-- ========================================
-- ADD MISSING COMMISSION COLUMNS TO transaction_items
-- ========================================

-- Add commission columns if they don't exist
ALTER TABLE transaction_items 
ADD COLUMN IF NOT EXISTS commission_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10, 2);

-- Add barber_id if it doesn't exist
ALTER TABLE transaction_items 
ADD COLUMN IF NOT EXISTS barber_id UUID;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transaction_items'
ORDER BY ordinal_position;
