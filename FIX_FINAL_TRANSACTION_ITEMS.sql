-- ========================================
-- FIX FINAL - UBAH KEMBALI KE INTEGER
-- ========================================
-- Ternyata services.id dan users.id adalah INTEGER, bukan UUID!

-- 1. Hapus data (jika ada)
TRUNCATE TABLE transaction_items CASCADE;

-- 2. Ubah service_id dari UUID ke INTEGER
ALTER TABLE transaction_items 
ALTER COLUMN service_id TYPE INTEGER USING NULL;

-- 3. Ubah barber_id dari UUID ke INTEGER
ALTER TABLE transaction_items 
ALTER COLUMN barber_id TYPE INTEGER USING NULL;

-- 4. Tambahkan kembali foreign keys
ALTER TABLE transaction_items 
ADD CONSTRAINT transaction_items_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES services(id);

ALTER TABLE transaction_items 
ADD CONSTRAINT transaction_items_barber_id_fkey 
FOREIGN KEY (barber_id) REFERENCES users(id);

-- 5. Verifikasi
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transaction_items'
ORDER BY ordinal_position;

-- SELESAI! Sekarang coba buat transaksi lagi.
