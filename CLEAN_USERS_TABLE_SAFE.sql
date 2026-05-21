-- ========================================
-- CLEAN USERS TABLE - SAFE METHOD
-- ========================================
-- Menghapus semua data yang terkait dengan users
-- sebelum menghapus users itu sendiri
-- 
-- PERINGATAN: Script ini akan menghapus SEMUA data
-- kecuali user Owner (id=1)
-- ========================================

-- Step 1: Backup data Owner (jangan dihapus)
-- Catat ID Owner terlebih dahulu
SELECT id, email, name, role 
FROM users 
WHERE email = 'owner@pigtownbarbershop.com';

-- ========================================
-- Step 2: Hapus data di tabel yang mereferensi users
-- ========================================

-- Hapus attendance records (kecuali Owner)
DELETE FROM attendance 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- Hapus points records (kecuali Owner)
DELETE FROM points 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- Hapus kasbon records (kecuali Owner)
DELETE FROM kasbon 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- Update expenses: Set requested_by dan approved_by ke NULL
-- (Jangan hapus expenses, hanya update referensi)
UPDATE expenses 
SET requested_by = NULL 
WHERE requested_by IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

UPDATE expenses 
SET approved_by = NULL 
WHERE approved_by IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- Update transaction_items: Set barber_id ke NULL
-- (Jangan hapus transaksi, hanya update referensi)
UPDATE transaction_items 
SET barber_id = NULL 
WHERE barber_id IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- Update commission_rules: Hapus rules untuk user yang akan dihapus
DELETE FROM commission_rules 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email != 'owner@pigtownbarbershop.com'
);

-- ========================================
-- Step 3: Hapus users (kecuali Owner)
-- ========================================

DELETE FROM users 
WHERE email != 'owner@pigtownbarbershop.com';

-- ========================================
-- Step 4: Verifikasi - Hanya Owner yang tersisa
-- ========================================

SELECT 
  id, 
  email, 
  name, 
  role, 
  position,
  status
FROM users;

-- Expected result: Hanya 1 row (Owner)

-- ========================================
-- ALTERNATIVE: Hapus SEMUA users termasuk Owner
-- ========================================
-- HATI-HATI! Ini akan menghapus SEMUA data users
-- Uncomment jika Anda yakin ingin menghapus semua

/*
-- Hapus semua attendance
DELETE FROM attendance;

-- Hapus semua points
DELETE FROM points;

-- Hapus semua kasbon
DELETE FROM kasbon;

-- Update semua expenses
UPDATE expenses SET requested_by = NULL, approved_by = NULL;

-- Update semua transaction_items
UPDATE transaction_items SET barber_id = NULL;

-- Hapus semua commission_rules
DELETE FROM commission_rules;

-- Hapus SEMUA users
DELETE FROM users;

-- Reset sequence (agar ID mulai dari 1 lagi)
-- Cari nama sequence dengan query ini:
SELECT pg_get_serial_sequence('users', 'id');

-- Kemudian reset (ganti 'users_id_seq' dengan hasil query di atas):
ALTER SEQUENCE users_id_seq RESTART WITH 1;
*/

-- ========================================
-- SUMMARY
-- ========================================
-- Script ini akan:
-- 1. ✅ Hapus attendance records (kecuali Owner)
-- 2. ✅ Hapus points records (kecuali Owner)
-- 3. ✅ Hapus kasbon records (kecuali Owner)
-- 4. ✅ Set expenses.requested_by = NULL
-- 5. ✅ Set expenses.approved_by = NULL
-- 6. ✅ Set transaction_items.barber_id = NULL
-- 7. ✅ Hapus commission_rules
-- 8. ✅ Hapus users (kecuali Owner)
-- 
-- Setelah ini, Anda bisa insert data barbermen baru
-- ========================================
