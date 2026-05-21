-- ========================================
-- DIAGNOSE LENGKAP MASALAH UUID
-- ========================================

-- 1. Cek tipe data service_id di tabel services
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'services' AND column_name = 'id';

-- 2. Cek sample data services (lihat format ID-nya)
SELECT id, name, price, type FROM services LIMIT 5;

-- 3. Cek tipe data di transaction_items
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'transaction_items'
  AND column_name IN ('service_id', 'barber_id', 'transaction_id');

-- 4. Cek tipe data user id
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';

-- 5. Cek sample data users
SELECT id, name, email FROM users LIMIT 3;
