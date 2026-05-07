# 🔧 Fix Database Tables - Hilangkan Error 406

## Masalah
Setelah login berhasil, muncul error 406 (Not Acceptable) di console karena beberapa tabel belum ada di database baru:
- `receipt_templates`
- Dan tabel-tabel lain yang dibutuhkan aplikasi

## ✅ Solusi Sudah Selesai!

Jika Anda melihat output seperti ini setelah menjalankan `create_missing_tables.sql`:

```
table_name              | column_count
------------------------|-------------
attendance              | 16
branch_shifts           | 8
branches                | 9
commission_rules        | 7
expenses                | 15
kasbon                  | 12
points                  | 7
profiles                | 4
receipt_templates       | 14  ← Tabel ini yang tadinya error!
service_categories      | 6
services                | 12
transaction_items       | 13
transactions            | 17
users                   | 12
```

**Berarti database Anda sudah lengkap!** 🎉

## Cara Menjalankan Script (Jika Belum)

### Langkah 1: Buka Supabase SQL Editor
1. Pergi ke https://supabase.com/dashboard
2. Pilih project: **leoriloxnohuwzyapcou**
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Langkah 2: Copy & Paste SQL Script
1. Buka file `create_missing_tables.sql` di project ini
2. Copy **SEMUA ISI** file tersebut
3. Paste ke SQL Editor di Supabase
4. Klik tombol **Run** (atau tekan Ctrl+Enter)

### Langkah 3: Test Aplikasi
1. Refresh halaman aplikasi Anda (Ctrl+F5)
2. Login kembali
3. Error 406 seharusnya sudah hilang ✅
4. Semua fitur seharusnya berfungsi normal

## Tabel yang Dibuat

Script `create_missing_tables.sql` membuat/update tabel-tabel berikut:

1. **service_categories** - Kategori layanan (Potong Rambut, Styling, dll)
2. **services** - Layanan dan produk barbershop
3. **branches** - Data cabang
4. **branch_shifts** - Shift kerja per cabang
5. **attendance** - Sistem presensi karyawan
6. **transactions** - Transaksi penjualan
7. **transaction_items** - Detail item transaksi
8. **profiles** - Profil user
9. **points** - Sistem poin karyawan
10. **kasbon** - Pinjaman karyawan
11. **expenses** - Pengeluaran cabang
12. **receipt_templates** - Template struk (yang tadinya error 406!)
13. **commission_rules** - Aturan komisi

## Catatan Penting

- ✅ Script ini **aman dijalankan** - menggunakan `CREATE TABLE IF NOT EXISTS`
- ✅ Tidak akan menghapus data yang sudah ada
- ✅ Akan membuat tabel baru jika belum ada
- ✅ Akan menambah kolom yang kurang di tabel yang sudah ada
- ✅ Sudah disesuaikan dengan struktur database yang benar (users.id = INTEGER)

## Troubleshooting

### Jika masih ada error setelah run script:
1. Cek di Supabase SQL Editor apakah ada error message
2. Pastikan semua tabel sudah ter-create dengan query:
   ```sql
   SELECT table_name, 
          (SELECT COUNT(*) FROM information_schema.columns 
           WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
   FROM information_schema.tables t
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
3. Clear browser cache dan refresh aplikasi (Ctrl+F5)

### Jika error "permission denied":
- Pastikan Anda login sebagai owner/admin di Supabase
- Atau gunakan service role key untuk menjalankan script

## Setelah Selesai

Aplikasi Anda seharusnya sudah berfungsi 100% tanpa error! 🎉

Semua fitur akan berfungsi:
- ✅ Login/Authentication
- ✅ POS System
- ✅ Attendance/Presensi
- ✅ Points System
- ✅ Kasbon Management
- ✅ Expense Management
- ✅ Reports & Analytics
- ✅ Receipt Templates (tidak ada error 406 lagi!)
