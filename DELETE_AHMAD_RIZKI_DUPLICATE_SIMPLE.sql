-- HAPUS DUPLIKAT AHMAD RIZKI - SIMPLE VERSION
-- Copy dan paste HANYA query yang Anda butuhkan

-- ========================================
-- STEP 1: LIHAT DUPLIKAT AHMAD RIZKI
-- ========================================
SELECT 
    u.name,
    a.id,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE u.name = 'Ahmad Rizki'
AND a.date = '2026-05-20'
AND a.check_out_time IS NULL
ORDER BY a.check_in_time;

-- Hasil yang diharapkan:
-- Ahmad Rizki | id-xxx | 21:32:07 | checked_in  <- YANG INI AKAN DIHAPUS
-- Ahmad Rizki | id-yyy | 21:44:06 | checked_in  <- YANG INI DISIMPAN


-- ========================================
-- STEP 2: HAPUS YANG LAMA (21:32:07)
-- ========================================
-- Copy dan jalankan query ini di SQL editor baru:

DELETE FROM attendance
WHERE id IN (
    SELECT a.id
    FROM attendance a
    JOIN users u ON u.id = a.user_id
    WHERE u.name = 'Ahmad Rizki'
    AND a.date = '2026-05-20'
    AND a.check_in_time = '21:32:07'
    AND a.check_out_time IS NULL
);

-- Hasil yang diharapkan: "DELETE 1" (1 row terhapus)


-- ========================================
-- STEP 3: VERIFIKASI - SEHARUSNYA HANYA 1
-- ========================================
-- Copy dan jalankan query ini untuk verifikasi:

SELECT 
    u.name,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE u.name = 'Ahmad Rizki'
AND a.date = '2026-05-20'
AND a.check_out_time IS NULL;

-- Hasil yang diharapkan: Hanya 1 row (21:44:06)


-- ========================================
-- STEP 4: CEK SEMUA USER - TIDAK ADA DUPLIKAT
-- ========================================
-- Copy dan jalankan query ini untuk cek semua user:

SELECT 
    u.name,
    a.date,
    COUNT(*) as active_shifts_count
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
GROUP BY u.name, a.date
HAVING COUNT(*) > 1;

-- Hasil yang diharapkan: Tidak ada hasil (no rows)
-- Artinya tidak ada user yang punya duplikat shift aktif
