-- CLEAN AHMAD RIZKI DUPLICATE
-- Membersihkan duplikat check-in Ahmad Rizki, sisakan yang terbaru

-- Step 1: Lihat data Ahmad Rizki yang duplikat
SELECT 
    u.name,
    a.id,
    a.date,
    a.shift_type,
    a.check_in_time,
    a.status,
    a.created_at
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE u.name = 'Ahmad Rizki'
AND a.date = '2026-05-20'
AND a.check_out_time IS NULL
ORDER BY a.check_in_time;

-- Step 2: Hapus yang lama (21:32:07), sisakan yang baru (21:44:06)
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

-- Step 3: Verifikasi - seharusnya Ahmad Rizki hanya punya 1 check-in
SELECT 
    u.name,
    a.date,
    a.shift_type,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE u.name = 'Ahmad Rizki'
AND a.date = '2026-05-20'
AND a.check_out_time IS NULL;

-- Step 4: Lihat semua shift aktif setelah cleanup
SELECT 
    u.name,
    a.date,
    a.shift_type,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
ORDER BY u.name, a.check_in_time;

-- Step 5: Cek apakah masih ada duplikat lain
SELECT 
    u.name,
    a.date,
    COUNT(*) as active_shifts_count
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
GROUP BY u.name, a.date
HAVING COUNT(*) > 1;
