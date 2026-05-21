# Cara Fix Error 406 (Not Acceptable) dari Supabase

## Masalah
Error `406 (Not Acceptable)` terjadi karena **Row Level Security (RLS)** di Supabase memblokir akses ke tabel.

## Screenshot Error
```
GET https://leoriloxnohuwzyapcou.supabase.co/rest/v1/receipt_templates?select=* 406 (Not Acceptable)
```

## Penyebab
- Tabel memiliki RLS enabled
- Tidak ada policy yang mengizinkan akses
- Aplikasi menggunakan `anon` key yang tidak punya permission

## Solusi (Pilih salah satu)

### ✅ Solusi 1: Disable RLS (PALING MUDAH - RECOMMENDED)

1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Copy paste SQL dari file `FIX_RLS_POLICIES.sql`
5. Klik **Run**
6. Refresh aplikasi Anda

**SQL untuk disable RLS:**
```sql
ALTER TABLE receipt_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE points DISABLE ROW LEVEL SECURITY;
ALTER TABLE kasbon DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
```

### Solusi 2: Enable RLS dengan Permissive Policy

Jika Anda ingin tetap menggunakan RLS untuk keamanan:

```sql
-- Enable RLS
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Create policy yang allow semua operasi
CREATE POLICY "Allow all operations" 
ON receipt_templates 
FOR ALL 
USING (true) 
WITH CHECK (true);
```

Ulangi untuk semua tabel yang error.

## Verifikasi

Setelah menjalankan SQL:

1. Refresh browser (F5)
2. Buka Console (F12)
3. Error 406 seharusnya hilang
4. Coba lakukan transaksi di POS

## Catatan

- **Disable RLS** cocok untuk aplikasi internal/private
- **Enable RLS dengan policy** cocok untuk aplikasi public
- Untuk aplikasi barbershop internal, disable RLS adalah pilihan terbaik

## Tabel yang Perlu Di-fix

Berdasarkan screenshot database Anda:
- ✅ attendance
- ✅ branch_shifts
- ✅ branches
- ✅ commission_rules
- ✅ customers
- ✅ employee_commissions
- ✅ employee_salaries
- ✅ employee_shifts
- ✅ expenses
- ✅ inventory_movements
- ✅ kasbon
- ✅ outlet_stock
- ✅ points
- ✅ profiles
- ✅ receipt_templates
- ✅ service_categories
- ✅ services
- ✅ transaction_items
- ✅ transactions
- ✅ users

## Setelah Fix

Aplikasi akan berfungsi normal tanpa error 406.
