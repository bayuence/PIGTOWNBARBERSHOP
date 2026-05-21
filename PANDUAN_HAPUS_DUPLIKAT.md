# PANDUAN: Hapus Duplikat Ahmad Rizki

## ⚠️ PENTING: Cara Menjalankan SQL

**JANGAN** copy-paste hasil output query (seperti "Success. No rows returned") ke SQL editor!

**HANYA** copy-paste **SQL command** (yang dimulai dengan SELECT, DELETE, dll).

---

## 📋 LANGKAH-LANGKAH

### STEP 1: Lihat Duplikat Ahmad Rizki

1. Buka Supabase SQL Editor
2. Copy dan paste query ini:

```sql
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
```

3. Klik **Run**
4. Anda akan melihat 2 rows:
   - Row 1: check_in_time = `21:32:07` ← **YANG INI AKAN DIHAPUS**
   - Row 2: check_in_time = `21:44:06` ← **YANG INI DISIMPAN**

---

### STEP 2: Hapus Duplikat (Yang Lama)

1. **Buka tab SQL editor BARU** (atau clear editor sebelumnya)
2. Copy dan paste query ini:

```sql
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
```

3. Klik **Run**
4. Anda akan melihat hasil: **"DELETE 1"** atau **"Success. 1 rows affected"**
5. Ini artinya 1 row (check-in lama) sudah terhapus ✅

---

### STEP 3: Verifikasi - Seharusnya Hanya 1 Row

1. **Buka tab SQL editor BARU** (atau clear editor sebelumnya)
2. Copy dan paste query ini:

```sql
SELECT 
    u.name,
    a.check_in_time,
    a.status
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE u.name = 'Ahmad Rizki'
AND a.date = '2026-05-20'
AND a.check_out_time IS NULL;
```

3. Klik **Run**
4. Anda akan melihat **HANYA 1 row**:
   - Ahmad Rizki | 21:44:06 | checked_in ✅

---

### STEP 4: Cek Semua User - Tidak Ada Duplikat Lagi

1. **Buka tab SQL editor BARU** (atau clear editor sebelumnya)
2. Copy dan paste query ini:

```sql
SELECT 
    u.name,
    a.date,
    COUNT(*) as active_shifts_count
FROM attendance a
JOIN users u ON u.id = a.user_id
WHERE a.check_out_time IS NULL
GROUP BY u.name, a.date
HAVING COUNT(*) > 1;
```

3. Klik **Run**
4. Anda akan melihat: **"Success. No rows returned"** ✅
5. Ini artinya **TIDAK ADA** user yang punya duplikat shift aktif

---

## ✅ HASIL AKHIR

Setelah semua langkah di atas:

| User | Shift Aktif | Status |
|------|-------------|--------|
| Ahmad Rizki | 1 (21:44:06) | ✅ OK |
| Budi Santoso | 1 (21:44:51) | ✅ OK |
| Rudi Hartono | 1 (21:32:31) | ✅ OK |
| Owner | 1 (21:26:31) | ✅ OK |
| Fajar Nugroho | 1 (14:00:00) | ✅ OK |

**Semua user hanya punya 1 shift aktif!** ✅

---

## ❌ KESALAHAN UMUM

### Error: "syntax error at or near 'Success'"

**Penyebab**: Anda copy-paste hasil output query, bukan SQL command.

**Contoh SALAH:**
```
Success. No rows returned  ← INI BUKAN SQL COMMAND!
```

**Contoh BENAR:**
```sql
SELECT * FROM attendance;  ← INI SQL COMMAND
```

**Solusi**: Hanya copy SQL command (yang dimulai dengan SELECT, DELETE, INSERT, dll).

---

## 📄 FILE YANG BISA DIGUNAKAN

Gunakan file: **`DELETE_AHMAD_RIZKI_DUPLICATE_SIMPLE.sql`**

File ini berisi semua query yang sudah dipisah dengan jelas per step.

---

## 🔄 NEXT STEPS SETELAH CLEANUP

1. ✅ Duplikat sudah terhapus
2. ⏳ Jalankan `ADD_ATTENDANCE_SECURITY_CONSTRAINT.sql` untuk mencegah duplikat baru
3. ⏳ Refresh aplikasi (F5)
4. ⏳ Test validasi waktu shift

---

## ❓ BUTUH BANTUAN?

Jika masih ada error, screenshot error message dan beritahu saya!
