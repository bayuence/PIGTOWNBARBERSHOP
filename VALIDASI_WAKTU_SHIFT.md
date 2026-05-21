# VALIDASI WAKTU SHIFT - Check-in Sesuai Jam Shift

## FITUR BARU: Validasi Waktu Check-in

Sekarang sistem akan **memvalidasi waktu check-in** sesuai dengan jam shift yang dipilih.

## ATURAN VALIDASI

### 1. Toleransi 30 Menit Sebelum Shift
User bisa check-in **30 menit sebelum** shift dimulai.

**Contoh:**
- Shift Pagi: 09:00 - 15:00
- Bisa check-in mulai: **08:30** (30 menit sebelum 09:00)
- Bisa check-in sampai: **15:00**

### 2. Tidak Bisa Check-in Di Luar Jam Shift
Jika user coba check-in di luar jam shift, akan ditolak dengan pesan error.

**Contoh:**
- Shift Pagi: 09:00 - 15:00
- User coba check-in jam **07:00** → ❌ DITOLAK
- User coba check-in jam **16:00** → ❌ DITOLAK
- User coba check-in jam **08:30** → ✅ BERHASIL (toleransi)
- User coba check-in jam **14:59** → ✅ BERHASIL

### 3. Support Shift Melewati Tengah Malam
Sistem bisa handle shift yang melewati tengah malam.

**Contoh:**
- Shift Malam: 21:00 - 03:00 (next day)
- Bisa check-in jam **20:30** → ✅ BERHASIL (toleransi)
- Bisa check-in jam **22:00** → ✅ BERHASIL
- Bisa check-in jam **02:00** → ✅ BERHASIL
- Bisa check-in jam **04:00** → ❌ DITOLAK

## IMPLEMENTASI

### Kode di `confirmCheckIn()`:

```typescript
const confirmCheckIn = () => {
  // ... validasi cabang ...

  // Validasi waktu check-in sesuai dengan jam shift
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute

  // Cari shift yang dipilih dari branchShifts
  const selectedShiftData = branchShifts.find(
    (shift) => shift.type === selectedShift || shift.id === selectedShift
  )

  if (selectedShiftData) {
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.split(":")
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      return hours * 60 + minutes
    }

    const shiftStartMinutes = parseTime(selectedShiftData.start_time)
    const shiftEndMinutes = parseTime(selectedShiftData.end_time)

    // Toleransi 30 menit sebelum shift dimulai
    const toleranceMinutes = 30
    const allowedStartMinutes = shiftStartMinutes - toleranceMinutes

    // Cek apakah waktu sekarang dalam range shift
    let isWithinShiftTime = false

    if (shiftEndMinutes > shiftStartMinutes) {
      // Shift normal (tidak melewati tengah malam)
      isWithinShiftTime =
        currentTimeInMinutes >= allowedStartMinutes && 
        currentTimeInMinutes < shiftEndMinutes
    } else {
      // Shift melewati tengah malam
      isWithinShiftTime =
        currentTimeInMinutes >= allowedStartMinutes || 
        currentTimeInMinutes < shiftEndMinutes
    }

    if (!isWithinShiftTime) {
      toast({
        title: "Waktu Check-in Tidak Sesuai",
        description: `Shift ${selectedShiftData.name} hanya bisa check-in mulai jam ${formatTime(allowedStartMinutes)} sampai ${selectedShiftData.end_time}`,
        variant: "destructive",
      })
      return  // BLOKIR check-in
    }
  }

  // Lanjut check-in jika waktu sesuai
}
```

## CONTOH SKENARIO

### Skenario 1: Check-in Shift Pagi (09:00-15:00)

| Waktu Sekarang | Hasil | Keterangan |
|----------------|-------|------------|
| 07:00 | ❌ DITOLAK | Terlalu pagi, belum masuk toleransi |
| 08:29 | ❌ DITOLAK | 1 menit sebelum toleransi |
| 08:30 | ✅ BERHASIL | Masuk toleransi 30 menit |
| 09:00 | ✅ BERHASIL | Tepat waktu shift dimulai |
| 12:00 | ✅ BERHASIL | Dalam jam shift |
| 14:59 | ✅ BERHASIL | Masih dalam jam shift |
| 15:00 | ❌ DITOLAK | Shift sudah berakhir |
| 16:00 | ❌ DITOLAK | Sudah lewat jam shift |

### Skenario 2: Check-in Shift Siang (15:00-21:00)

| Waktu Sekarang | Hasil | Keterangan |
|----------------|-------|------------|
| 14:00 | ❌ DITOLAK | Terlalu pagi |
| 14:30 | ✅ BERHASIL | Masuk toleransi 30 menit |
| 15:00 | ✅ BERHASIL | Tepat waktu shift dimulai |
| 18:00 | ✅ BERHASIL | Dalam jam shift |
| 20:59 | ✅ BERHASIL | Masih dalam jam shift |
| 21:00 | ❌ DITOLAK | Shift sudah berakhir |

### Skenario 3: Check-in Shift Malam (21:00-03:00)

| Waktu Sekarang | Hasil | Keterangan |
|----------------|-------|------------|
| 20:00 | ❌ DITOLAK | Terlalu pagi |
| 20:30 | ✅ BERHASIL | Masuk toleransi 30 menit |
| 21:00 | ✅ BERHASIL | Tepat waktu shift dimulai |
| 23:00 | ✅ BERHASIL | Dalam jam shift |
| 01:00 | ✅ BERHASIL | Dalam jam shift (next day) |
| 02:59 | ✅ BERHASIL | Masih dalam jam shift |
| 03:00 | ❌ DITOLAK | Shift sudah berakhir |
| 04:00 | ❌ DITOLAK | Sudah lewat jam shift |

## PESAN ERROR

Jika user coba check-in di luar jam shift, akan muncul toast error:

```
❌ Waktu Check-in Tidak Sesuai

Shift Pagi (09:00 - 15:00) hanya bisa check-in mulai jam 08:30 sampai 15:00.
Waktu sekarang: 07:30
```

## KONFIGURASI

### Mengubah Toleransi Waktu

Jika ingin mengubah toleransi (default: 30 menit), edit di `confirmCheckIn()`:

```typescript
const toleranceMinutes = 30  // Ubah nilai ini (dalam menit)
```

**Contoh:**
- `toleranceMinutes = 0` → Tidak ada toleransi, harus tepat waktu
- `toleranceMinutes = 15` → Toleransi 15 menit sebelum shift
- `toleranceMinutes = 60` → Toleransi 1 jam sebelum shift

### Menonaktifkan Validasi

Jika ingin menonaktifkan validasi (kembali ke behavior lama), hapus atau comment out blok validasi di `confirmCheckIn()`.

## TESTING

### Test Case 1: Check-in Tepat Waktu
1. Pilih shift "Pagi" (09:00-15:00)
2. Check-in jam 09:30
3. **Expected**: ✅ Berhasil

### Test Case 2: Check-in Dengan Toleransi
1. Pilih shift "Pagi" (09:00-15:00)
2. Check-in jam 08:45 (15 menit sebelum shift)
3. **Expected**: ✅ Berhasil (dalam toleransi 30 menit)

### Test Case 3: Check-in Terlalu Pagi
1. Pilih shift "Pagi" (09:00-15:00)
2. Check-in jam 07:00
3. **Expected**: ❌ DITOLAK dengan pesan error

### Test Case 4: Check-in Setelah Shift Berakhir
1. Pilih shift "Pagi" (09:00-15:00)
2. Check-in jam 16:00
3. **Expected**: ❌ DITOLAK dengan pesan error

### Test Case 5: Shift Malam (Melewati Tengah Malam)
1. Pilih shift "Malam" (21:00-03:00)
2. Check-in jam 01:00 (dini hari)
3. **Expected**: ✅ Berhasil (dalam jam shift)

## KEUNTUNGAN

✅ **Mencegah kesalahan pilih shift**
- User tidak bisa pilih shift "pagi" jam malam

✅ **Data lebih akurat**
- Shift yang tercatat sesuai dengan waktu kerja sebenarnya

✅ **Memudahkan laporan**
- Laporan shift lebih reliable

✅ **Fleksibilitas dengan toleransi**
- User bisa check-in sedikit lebih awal (30 menit)

## CATATAN PENTING

⚠️ **Validasi ini hanya berlaku untuk check-in, TIDAK untuk check-out**

User tetap bisa check-out kapan saja, tidak terbatas jam shift.

⚠️ **Waktu yang digunakan adalah waktu lokal browser**

Pastikan waktu di device user sudah benar.

## FILES MODIFIED

- `components/attendance-system.tsx`
  - Function `confirmCheckIn()`: Tambah validasi waktu shift

## NEXT STEPS

1. ✅ Code sudah diperbaiki
2. ⏳ **USER ACTION**: Refresh aplikasi
3. ⏳ **USER ACTION**: Test check-in di berbagai waktu
4. ⏳ **USER ACTION**: Verifikasi pesan error muncul jika check-in di luar jam shift
