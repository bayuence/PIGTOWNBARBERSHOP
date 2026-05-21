-- FIX expenses table - Hapus constraint NOT NULL yang tidak perlu
ALTER TABLE expenses 
ALTER COLUMN requested_by DROP NOT NULL;

ALTER TABLE expenses 
ALTER COLUMN expense_date DROP NOT NULL;

-- Atau jika kolom expense_date tidak ada, hapus saja
-- ALTER TABLE expenses DROP COLUMN IF EXISTS expense_date;
