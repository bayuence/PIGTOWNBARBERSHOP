-- ========================================
-- INSERT BARBERMEN DATA
-- ========================================
-- Password untuk semua barber: "barber123"
-- Hash: $2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6

-- Catatan: 
-- - ID akan auto-increment (serial/integer)
-- - Setiap barber punya email, password, dan PIN unik
-- - Branch_id disesuaikan dengan cabang yang ada

-- ========================================
-- CABANG SUDIRMAN (branch-1)
-- ========================================

INSERT INTO users (
  email, 
  password, 
  name, 
  pin, 
  role, 
  position, 
  status, 
  branch_id,
  salary,
  commission_rate,
  phone,
  created_at
) VALUES 
-- Senior Barber Sudirman
(
  'ahmad.rizki@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Ahmad Rizki',
  '111111',
  'barber',
  'Senior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Sudirman' LIMIT 1),
  5000000,
  0.15,
  '081234567801',
  NOW()
),
-- Barber Sudirman
(
  'fajar.nugroho@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Fajar Nugroho',
  '111112',
  'barber',
  'Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Sudirman' LIMIT 1),
  4000000,
  0.12,
  '081234567802',
  NOW()
),
-- Junior Barber Sudirman
(
  'rudi.hartono@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Rudi Hartono',
  '111113',
  'barber',
  'Junior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Sudirman' LIMIT 1),
  3500000,
  0.10,
  '081234567803',
  NOW()
);

-- ========================================
-- CABANG KEMANG (branch-2)
-- ========================================

INSERT INTO users (
  email, 
  password, 
  name, 
  pin, 
  role, 
  position, 
  status, 
  branch_id,
  salary,
  commission_rate,
  phone,
  created_at
) VALUES 
-- Senior Barber Kemang
(
  'budi.santoso@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Budi Santoso',
  '222221',
  'barber',
  'Senior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kemang' LIMIT 1),
  5000000,
  0.15,
  '081234567804',
  NOW()
),
-- Barber Kemang
(
  'agus.setiawan@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Agus Setiawan',
  '222222',
  'barber',
  'Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kemang' LIMIT 1),
  4000000,
  0.12,
  '081234567805',
  NOW()
),
-- Junior Barber Kemang
(
  'doni.prasetyo@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Doni Prasetyo',
  '222223',
  'barber',
  'Junior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kemang' LIMIT 1),
  3500000,
  0.10,
  '081234567806',
  NOW()
);

-- ========================================
-- CABANG SENAYAN (branch-3)
-- ========================================

INSERT INTO users (
  email, 
  password, 
  name, 
  pin, 
  role, 
  position, 
  status, 
  branch_id,
  salary,
  commission_rate,
  phone,
  created_at
) VALUES 
-- Senior Barber Senayan
(
  'dedi.kurniawan@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Dedi Kurniawan',
  '333331',
  'barber',
  'Senior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Senayan' LIMIT 1),
  5000000,
  0.15,
  '081234567807',
  NOW()
),
-- Barber Senayan
(
  'hendra.wijaya@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Hendra Wijaya',
  '333332',
  'barber',
  'Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Senayan' LIMIT 1),
  4000000,
  0.12,
  '081234567808',
  NOW()
),
-- Junior Barber Senayan
(
  'irfan.maulana@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Irfan Maulana',
  '333333',
  'barber',
  'Junior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Senayan' LIMIT 1),
  3500000,
  0.10,
  '081234567809',
  NOW()
);

-- ========================================
-- CABANG KELAPA GADING (branch-4)
-- ========================================

INSERT INTO users (
  email, 
  password, 
  name, 
  pin, 
  role, 
  position, 
  status, 
  branch_id,
  salary,
  commission_rate,
  phone,
  created_at
) VALUES 
-- Senior Barber Kelapa Gading
(
  'eko.prasetyo@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Eko Prasetyo',
  '444441',
  'barber',
  'Senior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kelapa Gading' LIMIT 1),
  5000000,
  0.15,
  '081234567810',
  NOW()
),
-- Barber Kelapa Gading
(
  'joko.susilo@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Joko Susilo',
  '444442',
  'barber',
  'Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kelapa Gading' LIMIT 1),
  4000000,
  0.12,
  '081234567811',
  NOW()
),
-- Junior Barber Kelapa Gading
(
  'kevin.ananda@pigtownbarbershop.com',
  '$2b$10$Vxwsg04KAJDHhThVix1Mee.4vxMoULN8U/j2xvF8e4A8QBHxJzxQ6',
  'Kevin Ananda',
  '444443',
  'barber',
  'Junior Barber',
  'active',
  (SELECT id FROM branches WHERE name = 'Cabang Kelapa Gading' LIMIT 1),
  3500000,
  0.10,
  '081234567812',
  NOW()
);

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Jalankan query ini untuk verifikasi data berhasil diinsert:

SELECT 
  id,
  name,
  email,
  pin,
  role,
  position,
  status,
  branch_id,
  salary,
  commission_rate,
  phone
FROM users 
WHERE role = 'barber'
ORDER BY branch_id, position DESC, name;

-- ========================================
-- SUMMARY
-- ========================================
-- Total Barbermen: 12 orang
-- - Cabang Sudirman: 3 barber (1 Senior, 1 Regular, 1 Junior)
-- - Cabang Kemang: 3 barber (1 Senior, 1 Regular, 1 Junior)
-- - Cabang Senayan: 3 barber (1 Senior, 1 Regular, 1 Junior)
-- - Cabang Kelapa Gading: 3 barber (1 Senior, 1 Regular, 1 Junior)

-- Login Credentials (semua barber):
-- Password: barber123
-- PIN: Lihat di kolom 'pin' masing-masing

-- Salary Structure:
-- - Senior Barber: Rp 5.000.000 (komisi 15%)
-- - Barber: Rp 4.000.000 (komisi 12%)
-- - Junior Barber: Rp 3.500.000 (komisi 10%)
