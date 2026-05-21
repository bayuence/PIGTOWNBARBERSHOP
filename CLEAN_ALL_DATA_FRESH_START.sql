-- ========================================
-- CLEAN ALL DATA - FRESH START
-- ========================================
-- Script ini akan menghapus SEMUA data dari database
-- dan reset sequence agar ID mulai dari 1 lagi
-- 
-- ⚠️ PERINGATAN: TIDAK BISA DI-UNDO!
-- ⚠️ Backup database terlebih dahulu jika perlu
-- ========================================

-- Step 1: Hapus semua data di tabel child (yang punya foreign key)
DELETE FROM attendance;
DELETE FROM points;
DELETE FROM kasbon;
DELETE FROM commission_rules;
DELETE FROM transaction_items;
DELETE FROM transactions;
DELETE FROM expenses;

-- Step 2: Hapus semua users
DELETE FROM users;

-- Step 3: Reset sequence agar ID mulai dari 1 lagi
-- (Uncomment jika tabel users menggunakan serial/auto-increment)
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Step 4: Verifikasi - Semua tabel kosong
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'points', COUNT(*) FROM points
UNION ALL
SELECT 'kasbon', COUNT(*) FROM kasbon
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'transaction_items', COUNT(*) FROM transaction_items
UNION ALL
SELECT 'commission_rules', COUNT(*) FROM commission_rules;

-- Expected result: Semua row_count = 0

-- ========================================
-- Step 5: Insert Owner kembali
-- ========================================

INSERT INTO users (
  email, 
  password, 
  name, 
  pin, 
  role, 
  position,
  status, 
  created_at
) VALUES (
  'owner@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6', -- password: pemilik123
  'Owner',
  '123456',
  'owner',
  'Owner',
  'active',
  NOW()
);

-- Verifikasi Owner berhasil diinsert
SELECT id, email, name, role FROM users;

-- ========================================
-- SELESAI!
-- ========================================
-- Sekarang database sudah bersih dan siap untuk:
-- 1. Insert data barbermen (INSERT_BARBERMEN_DATA.sql)
-- 2. Insert data branches (jika belum ada)
-- 3. Insert data services (jika belum ada)
-- ========================================
