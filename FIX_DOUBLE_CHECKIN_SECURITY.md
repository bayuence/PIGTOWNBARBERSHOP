# FIX: Keamanan Check-in Ganda & Invalid Date

## MASALAH
1. ❌ User bisa check-in berkali-kali tanpa check-out shift sebelumnya
2. ❌ Muncul "Invalid Date" di tampilan waktu check-in/check-out
3. ❌ Ada 2 shift aktif bersamaan untuk user yang sama

## ATURAN BISNIS
✅ User **BOLEH** check-in berkali-kali dalam sehari
✅ User **BOLEH** pindah shift
✅ **TAPI** user **HARUS check-out** dari shift sebelumnya dulu sebelum check-in lagi

## AKAR MASALAH

### 1. Tidak Ada Validasi Database Real-time
- Validasi hanya menggunakan state `canCheckIn` dari `dailySummaries`
- State bisa tidak sinkron dengan database
- Tidak ada pengecekan langsung ke database sebelum check-in

### 2. Invalid Date
- Database menyimpan `check_in_time` sebagai `time without time zone` (format: "21:50:36")
- Code mencoba parse sebagai Date object: `new Date("21:50:36")` → **Invalid Date**
- Seharusnya langsung tampilkan string time, tidak perlu parse

## SOLUSI

### 1. Validasi Database Real-time di `openCheckInDialog()`

**SEBELUM:**
```typescript
const openCheckInDialog = (employee: Employee) => {
  const summary = dailySummaries.find((s) => s.employeeId === employee.id)
  if (!summary?.canCheckIn) {
    toast({ title: "Tidak Bisa Check-in" })
    return
  }
  // ... lanjut check-in
}
```

**SESUDAH:**
```typescript
const openCheckInDialog = async (employee: Employee) => {
  // Refresh data terbaru
  await fetchAttendanceRecords()
  
  // CEK LANGSUNG KE DATABASE
  const { data: activeShifts } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", parseInt(employee.id))
    .eq("date", selectedDate)
    .is("check_out_time", null)  // Shift yang belum check-out
  
  if (activeShifts && activeShifts.length > 0) {
    toast({
      title: "Tidak Bisa Check-in",
      description: `Masih ada ${activeShifts.length} shift aktif yang belum check-out`
    })
    return  // BLOKIR check-in
  }
  
  // Lanjut check-in jika aman
}
```

### 2. Fix Invalid Date - Tampilkan Time String Langsung

**SEBELUM:**
```typescript
{shift.checkIn && 
  `Masuk: ${new Date(shift.checkIn).toLocaleTimeString()}`  // ❌ Invalid Date
}
```

**SESUDAH:**
```typescript
{shift.checkIn && `Masuk: ${shift.checkIn}`}  // ✅ Tampilkan langsung "21:50:36"
```

Karena `check_in_time` sudah dalam format time string (HH:mm:ss), tidak perlu parse ke Date.

## MEMBERSIHKAN DATA DUPLIKAT

Jalankan SQL untuk membersihkan shift aktif yang duplikat:

```sql
-- File: CLEAN_DUPLICATE_ACTIVE_SHIFTS.sql

-- Step 1: Lihat duplikat
SELECT user_id, date, COUNT(*) 
FROM attendance
WHERE check_out_time IS NULL
GROUP BY user_id, date
HAVING COUNT(*) > 1;

-- Step 2: Hapus duplikat, sisakan yang terbaru
DELETE FROM attendance
WHERE id IN (
    SELECT a1.id
    FROM attendance a1
    WHERE a1.check_out_time IS NULL
    AND EXISTS (
        SELECT 1 FROM attendance a2
        WHERE a2.user_id = a1.user_id
        AND a2.date = a1.date
        AND a2.check_out_time IS NULL
        AND a2.check_in_time > a1.check_in_time  -- Yang lebih baru
    )
);
```

## FLOW KEAMANAN BARU

```
User klik "Check In"
    ↓
openCheckInDialog() dipanggil
    ↓
Refresh data dari database
    ↓
Query: SELECT * FROM attendance 
       WHERE user_id = X 
       AND date = today 
       AND check_out_time IS NULL
    ↓
Ada shift aktif? ──YES──> BLOKIR + Toast error
    ↓ NO
Buka dialog pilih cabang & shift
    ↓
User pilih & confirm
    ↓
Buka kamera untuk foto
    ↓
INSERT attendance baru
```

## TESTING

### Test Case 1: Check-in Pertama
1. User belum check-in hari ini
2. Klik "Check In" → ✅ Berhasil
3. Tombol berubah ke "Check Out"

### Test Case 2: Check-in Kedua (Sebelum Check-out)
1. User sudah check-in, belum check-out
2. Klik "Check In" → ❌ DITOLAK
3. Toast: "Masih ada 1 shift aktif yang belum check-out"

### Test Case 3: Check-in Setelah Check-out
1. User check-in → check-out (shift selesai)
2. Klik "Check In" lagi → ✅ Berhasil (shift baru)
3. Boleh check-in lagi karena shift sebelumnya sudah selesai

### Test Case 4: Tampilan Waktu
1. Check-in jam 21:50:36
2. Tampilan: "Masuk: 21:50:36" ✅ (bukan "Invalid Date")

## FILES MODIFIED
1. `components/attendance-system.tsx`
   - `openCheckInDialog()`: Tambah validasi database real-time
   - Tampilan waktu: Hapus `new Date()` parsing, tampilkan string langsung

2. `CLEAN_DUPLICATE_ACTIVE_SHIFTS.sql` (NEW)
   - SQL untuk membersihkan data duplikat yang sudah terlanjur masuk

## KEAMANAN TAMBAHAN
- ✅ Validasi di frontend (UI)
- ✅ Validasi database real-time sebelum check-in
- ✅ Refresh data sebelum validasi untuk data terbaru
- ✅ Error message yang jelas untuk user
- ⚠️ **REKOMENDASI**: Tambah database constraint atau trigger untuk mencegah duplikat di level database
