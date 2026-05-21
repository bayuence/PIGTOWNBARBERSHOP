-- CHECK TIMEZONE AND DUPLICATES

-- 1. Cek timezone database
SHOW timezone;

-- 2. Cek waktu sekarang di database
SELECT 
    NOW() as db_time_with_tz,
    CURRENT_TIMESTAMP as current_timestamp,
    CURRENT_TIME as current_time,
    CURRENT_DATE as current_date,
    LOCALTIME as local_time,
    LOCALTIMESTAMP as local_timestamp;

-- 3. Lihat semua shift aktif yang duplikat
SELECT 
    u.name,
    a.date,
    a.shift_type,
    a.check_in_time,
    a.status,
    a.created_at,
    a.id
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
ORDER BY u.name, a.check_in_time;

-- 4. Hitung duplikat per user
SELECT 
    u.name,
    a.date,
    COUNT(*) as active_shifts_count
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
GROUP BY u.name, a.date
HAVING COUNT(*) > 1
ORDER BY active_shifts_count DESC;

-- 5. HAPUS DUPLIKAT - Sisakan yang paling baru berdasarkan check_in_time
-- UNCOMMENT untuk menjalankan:

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
        AND a2.check_in_time > a1.check_in_time  -- Sisakan yang lebih baru
    )
);
*/

-- 6. Verifikasi setelah delete - seharusnya tidak ada duplikat
SELECT 
    u.name,
    a.date,
    COUNT(*) as active_shifts_count
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
GROUP BY u.name, a.date
HAVING COUNT(*) > 1;

-- 7. Lihat hasil akhir - 1 shift aktif per user
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
