-- ========================================
-- FIX SEMUA MASALAH transaction_items
-- JALANKAN SQL INI 1x SAJA!
-- ========================================

-- 1. Hapus data lama (jika ada)
TRUNCATE TABLE transaction_items CASCADE;

-- 2. Drop foreign key constraints yang menghalangi
ALTER TABLE transaction_items 
DROP CONSTRAINT IF EXISTS transaction_items_service_id_fkey;

ALTER TABLE transaction_items 
DROP CONSTRAINT IF EXISTS transaction_items_barber_id_fkey;

-- 3. Ubah service_id dari INTEGER ke UUID
ALTER TABLE transaction_items 
ALTER COLUMN service_id TYPE UUID USING NULL;

-- 4. Ubah barber_id dari INTEGER ke UUID
ALTER TABLE transaction_items 
ALTER COLUMN barber_id TYPE UUID USING NULL;

-- 5. Tambahkan kembali foreign key constraints (optional, bisa skip jika tidak perlu)
-- ALTER TABLE transaction_items 
-- ADD CONSTRAINT transaction_items_service_id_fkey 
-- FOREIGN KEY (service_id) REFERENCES services(id);

-- ALTER TABLE transaction_items 
-- ADD CONSTRAINT transaction_items_barber_id_fkey 
-- FOREIGN KEY (barber_id) REFERENCES users(id);

-- 6. Verifikasi perubahan
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transaction_items'
ORDER BY ordinal_position;

-- SELESAI! Sekarang coba buat transaksi lagi di aplikasi.
