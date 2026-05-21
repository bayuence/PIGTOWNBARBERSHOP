-- ADD ATTENDANCE SECURITY CONSTRAINT
-- Mencegah check-in ganda di level database

-- OPSI 1: Partial Unique Index (RECOMMENDED)
-- Hanya 1 shift aktif (check_out_time IS NULL) per user per hari
-- Tapi boleh banyak shift yang sudah check-out

CREATE UNIQUE INDEX idx_one_active_shift_per_user_per_day
ON attendance (user_id, date)
WHERE check_out_time IS NULL;

-- Penjelasan:
-- - Index ini hanya berlaku untuk row dengan check_out_time IS NULL (shift aktif)
-- - Jika user sudah punya 1 shift aktif, INSERT shift aktif baru akan DITOLAK
-- - Setelah check-out (check_out_time diisi), constraint tidak berlaku lagi
-- - User bisa check-in lagi setelah check-out

-- Test constraint:
-- 1. Check-in pertama → SUCCESS
-- 2. Check-in kedua (belum check-out) → ERROR: duplicate key value violates unique constraint
-- 3. Check-out → SUCCESS
-- 4. Check-in lagi → SUCCESS (karena shift sebelumnya sudah check-out)

-- OPSI 2: Database Trigger (ALTERNATIVE)
-- Jika ingin logic lebih kompleks

/*
CREATE OR REPLACE FUNCTION prevent_double_checkin()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek apakah user sudah punya shift aktif di tanggal yang sama
    IF EXISTS (
        SELECT 1 
        FROM attendance 
        WHERE user_id = NEW.user_id 
        AND date = NEW.date 
        AND check_out_time IS NULL
        AND id != NEW.id  -- Exclude current row untuk UPDATE
    ) THEN
        RAISE EXCEPTION 'User sudah memiliki shift aktif yang belum check-out di tanggal ini';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_double_checkin
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
WHEN (NEW.check_out_time IS NULL)
EXECUTE FUNCTION prevent_double_checkin();
*/

-- Verifikasi constraint sudah aktif:
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'attendance'
AND indexname = 'idx_one_active_shift_per_user_per_day';

-- Test constraint dengan data dummy:
-- (Uncomment untuk test, tapi JANGAN jalankan jika sudah ada data duplikat!)

/*
-- Test 1: Check-in pertama (harus berhasil)
INSERT INTO attendance (user_id, branch_id, date, check_in_time, shift_type, status)
VALUES (1, '93fc38c9-3de4-4f98-8bc1-a12b95538788', '2026-05-20', '10:00:00', 'pagi', 'checked_in');

-- Test 2: Check-in kedua tanpa check-out (harus GAGAL)
INSERT INTO attendance (user_id, branch_id, date, check_in_time, shift_type, status)
VALUES (1, '93fc38c9-3de4-4f98-8bc1-a12b95538788', '2026-05-20', '11:00:00', 'siang', 'checked_in');
-- Expected: ERROR: duplicate key value violates unique constraint

-- Test 3: Check-out shift pertama (harus berhasil)
UPDATE attendance 
SET check_out_time = '18:00:00', status = 'checked_out'
WHERE user_id = 1 AND date = '2026-05-20' AND check_out_time IS NULL;

-- Test 4: Check-in lagi setelah check-out (harus berhasil)
INSERT INTO attendance (user_id, branch_id, date, check_in_time, shift_type, status)
VALUES (1, '93fc38c9-3de4-4f98-8bc1-a12b95538788', '2026-05-20', '19:00:00', 'malam', 'checked_in');
*/

-- CATATAN PENTING:
-- Sebelum menambahkan constraint ini, HARUS membersihkan data duplikat dulu!
-- Jalankan CLEAN_DUPLICATE_ACTIVE_SHIFTS.sql terlebih dahulu.
