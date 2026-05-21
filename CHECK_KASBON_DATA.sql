-- CHECK KASBON DATA
-- Cek apakah data kasbon tersimpan di database

-- 1. Lihat semua data kasbon
SELECT 
    k.id,
    k.user_id,
    u.name as employee_name,
    k.amount,
    k.status,
    k.request_date,
    k.created_at
FROM kasbon k
LEFT JOIN users u ON u.id = k.user_id
ORDER BY k.created_at DESC
LIMIT 20;

-- 2. Cek schema table kasbon
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kasbon'
ORDER BY ordinal_position;

-- 3. Hitung total kasbon per status
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM kasbon
GROUP BY status;

-- 4. Lihat kasbon terbaru (5 terakhir)
SELECT 
    k.*,
    u.name as employee_name
FROM kasbon k
LEFT JOIN users u ON u.id = k.user_id
ORDER BY k.created_at DESC
LIMIT 5;
