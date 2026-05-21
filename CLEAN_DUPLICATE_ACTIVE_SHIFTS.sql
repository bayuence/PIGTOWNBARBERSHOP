-- CLEAN DUPLICATE ACTIVE SHIFTS
-- Membersihkan shift aktif yang duplikat, hanya menyisakan 1 shift terakhir per user per hari

-- Step 1: Lihat shift aktif yang duplikat
SELECT 
    user_id,
    date,
    COUNT(*) as active_shifts_count,
    STRING_AGG(id::text, ', ') as shift_ids
FROM attendance
WHERE check_out_time IS NULL
GROUP BY user_id, date
HAVING COUNT(*) > 1
ORDER BY user_id, date;

-- Step 2: Hapus shift aktif duplikat, KECUALI yang paling baru (berdasarkan check_in_time)
-- UNCOMMENT BARIS DI BAWAH UNTUK MENJALANKAN DELETE:

/*
DELETE FROM attendance
WHERE id IN (
    SELECT a1.id
    FROM attendance a1
    WHERE a1.check_out_time IS NULL
    AND EXISTS (
        SELECT 1
        FROM attendance a2
        WHERE a2.user_id = a1.user_id
        AND a2.date = a1.date
        AND a2.check_out_time IS NULL
        AND a2.check_in_time > a1.check_in_time
    )
);
*/

-- Step 3: Verifikasi - seharusnya tidak ada lagi duplikat
SELECT 
    user_id,
    date,
    COUNT(*) as active_shifts_count
FROM attendance
WHERE check_out_time IS NULL
GROUP BY user_id, date
HAVING COUNT(*) > 1;

-- Step 4: Lihat shift aktif yang tersisa
SELECT 
    u.name,
    a.date,
    a.shift_type,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
ORDER BY a.date DESC, a.check_in_time DESC;
