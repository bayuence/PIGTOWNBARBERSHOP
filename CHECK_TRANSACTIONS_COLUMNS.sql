-- ========================================
-- CEK STRUKTUR TABEL TRANSACTIONS
-- ========================================
-- Jalankan SQL ini di Supabase SQL Editor untuk melihat
-- nama kolom yang sebenarnya di tabel transactions

SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- ========================================
-- Hasil yang diharapkan akan menunjukkan
-- nama kolom yang benar untuk:
-- - subtotal
-- - discount
-- - total/final_amount
-- ========================================
