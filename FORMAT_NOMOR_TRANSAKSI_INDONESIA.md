# 🇮🇩 FORMAT NOMOR TRANSAKSI - INDONESIA

## 📋 Format yang Digunakan

```
TRX-DDMMYYYY-NNNN
    │││││││  │││└─ Digit ke-4 nomor urut
    │││││││  ││└── Digit ke-3 nomor urut
    │││││││  │└─── Digit ke-2 nomor urut
    │││││││  └──── Digit ke-1 nomor urut (0001-9999)
    │││││││
    ││││└└└─────── Tahun (4 digit)
    ││└└────────── Bulan (2 digit, 01-12)
    └└──────────── Tanggal (2 digit, 01-31)
```

## 📅 Contoh Nyata

### Tanggal 20 Mei 2026:
```
TRX-20052026-0001  ← Transaksi pertama hari ini
TRX-20052026-0002  ← Transaksi kedua
TRX-20052026-0003  ← Transaksi ketiga
TRX-20052026-0004  ← Transaksi keempat
...
TRX-20052026-0050  ← Transaksi ke-50
TRX-20052026-0100  ← Transaksi ke-100
```

### Tanggal 21 Mei 2026 (Hari Baru):
```
TRX-21052026-0001  ← Reset! Transaksi pertama hari baru
TRX-21052026-0002  ← Transaksi kedua
TRX-21052026-0003  ← Transaksi ketiga
```

### Tanggal 01 Juni 2026 (Bulan Baru):
```
TRX-01062026-0001  ← Reset! Transaksi pertama bulan baru
TRX-01062026-0002  ← Transaksi kedua
```

### Tanggal 17 Agustus 2026 (Hari Kemerdekaan):
```
TRX-17082026-0001  ← Transaksi pertama
TRX-17082026-0002  ← Transaksi kedua
```

### Tanggal 31 Desember 2026 (Akhir Tahun):
```
TRX-31122026-0001  ← Transaksi pertama
TRX-31122026-0002  ← Transaksi kedua
```

### Tanggal 01 Januari 2027 (Tahun Baru):
```
TRX-01012027-0001  ← Reset! Transaksi pertama tahun baru
TRX-01012027-0002  ← Transaksi kedua
```

## 🔍 Cara Membaca Nomor Transaksi

### Contoh: `TRX-20052026-0123`

**Breakdown:**
- `TRX` = Prefix (Transaction)
- `20` = Tanggal (20)
- `05` = Bulan (Mei)
- `2026` = Tahun (2026)
- `0123` = Transaksi ke-123 pada hari itu

**Artinya:** Transaksi ke-123 pada tanggal 20 Mei 2026

### Contoh: `TRX-01012027-0001`

**Breakdown:**
- `TRX` = Prefix (Transaction)
- `01` = Tanggal (1)
- `01` = Bulan (Januari)
- `2027` = Tahun (2027)
- `0001` = Transaksi pertama hari itu

**Artinya:** Transaksi pertama pada tanggal 1 Januari 2027

## 📊 Keuntungan Format Indonesia

### ✅ Mudah Dibaca Orang Indonesia
```
TRX-20052026-0001
     ↓
20 Mei 2026, transaksi ke-1
```

### ✅ Urutan Natural untuk Indonesia
- Tanggal dulu (seperti kita bicara: "20 Mei")
- Bukan bulan dulu (seperti Amerika: "May 20")

### ✅ Mudah Sorting
```
TRX-20052026-0001
TRX-20052026-0002
TRX-21052026-0001  ← Otomatis terurut by tanggal
TRX-22052026-0001
```

### ✅ Mudah Filtering
```sql
-- Cari transaksi tanggal 20 Mei 2026
SELECT * FROM transactions 
WHERE transaction_number LIKE 'TRX-20052026-%'

-- Cari transaksi bulan Mei 2026
SELECT * FROM transactions 
WHERE transaction_number LIKE 'TRX-__052026-%'

-- Cari transaksi tahun 2026
SELECT * FROM transactions 
WHERE transaction_number LIKE 'TRX-____2026-%'
```

## 🎯 Perbandingan Format

### Format Amerika (YYYYMMDD):
```
TRX-20260520-0001  ← Tahun-Bulan-Tanggal
     ↓
Sulit dibaca: "2026-05-20" (tidak natural untuk orang Indonesia)
```

### Format Indonesia (DDMMYYYY):
```
TRX-20052026-0001  ← Tanggal-Bulan-Tahun
     ↓
Mudah dibaca: "20-05-2026" atau "20 Mei 2026" (natural!)
```

## 📈 Kapasitas Sistem

### Per Hari:
- Maksimal: **9,999 transaksi per hari**
- Format: `0001` sampai `9999`

### Per Bulan:
- Maksimal: **~300,000 transaksi per bulan** (9,999 × 30 hari)

### Per Tahun:
- Maksimal: **~3,600,000 transaksi per tahun** (9,999 × 365 hari)

**Kesimpulan:** Lebih dari cukup untuk barbershop! 🎉

## 🔄 Reset Counter

Counter **otomatis reset setiap hari**:

```
20 Mei 2026:
- TRX-20052026-0001
- TRX-20052026-0002
- TRX-20052026-9999  ← Maksimal

21 Mei 2026:
- TRX-21052026-0001  ← Reset ke 0001
- TRX-21052026-0002
```

## 📝 Contoh Struk

```
========================================
        PIGTOWN BARBERSHOP
========================================

No. Transaksi : TRX-20052026-0123
No. Struk     : RCP-20052026-0123
Tanggal       : 20 Mei 2026, 14:30 WIB
Kasir         : Budi
Pelayan       : Andi

----------------------------------------
LAYANAN:
1. Haircut                   Rp  50.000
2. Shaving                   Rp  30.000
----------------------------------------
Subtotal                     Rp  80.000
Diskon                       Rp       0
----------------------------------------
TOTAL                        Rp  80.000
Bayar (Tunai)                Rp 100.000
Kembali                      Rp  20.000
========================================

Terima kasih atas kunjungan Anda!
Sampai jumpa kembali!

Follow us: @pigtownbarbershop
========================================
```

## 🚀 Cara Setup

1. **Jalankan SQL** di Supabase:
   ```sql
   -- File: CREATE_TRANSACTION_SEQUENCE.sql
   -- (Copy dan paste ke Supabase SQL Editor)
   ```

2. **Test**:
   - Buat transaksi pertama
   - Cek nomor: `TRX-20052026-0001`
   - Buat transaksi kedua
   - Cek nomor: `TRX-20052026-0002`

3. **Done!** ✅

---

**Format:** TRX-DDMMYYYY-NNNN (Format Indonesia)  
**Status:** ✅ SIAP DIGUNAKAN  
**Dibuat:** 20 Mei 2026
