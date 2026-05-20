# 🗄️ DATABASE SETUP GUIDE - PIGTOWN BARBERSHOP

## 📋 Prerequisites

1. ✅ Supabase account sudah dibuat
2. ✅ Project Supabase sudah dibuat
3. ✅ Drizzle ORM sudah terinstall

---

## 🔧 Step 1: Dapatkan Database Connection String

### Cara mendapatkan DATABASE_URL:

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda: **leoriloxnohuwzyapcou**
3. Klik **Settings** (⚙️) di sidebar kiri
4. Klik **Database**
5. Scroll ke bagian **Connection String**
6. Pilih tab **URI**
7. Copy connection string yang muncul

Format connection string:
```
postgresql://postgres.leoriloxnohuwzyapcou:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Update file `.env`:

Ganti `[YOUR-PASSWORD]` dengan password database Anda:

```env
DATABASE_URL=postgresql://postgres.leoriloxnohuwzyapcou:YOUR_ACTUAL_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **PENTING:** Password ini adalah password yang Anda buat saat membuat project Supabase!

---

## 🚀 Step 2: Push Schema ke Database

Setelah `DATABASE_URL` sudah benar, jalankan command ini:

```bash
npm run db:push
```

Command ini akan:
- ✅ Membaca schema dari `lib/db/schema.ts`
- ✅ Membuat semua tabel di Supabase
- ✅ Membuat semua enum types
- ✅ Membuat semua relations/foreign keys

---

## 📊 Step 3: Verifikasi Database

### Opsi 1: Menggunakan Drizzle Studio (Recommended)

```bash
npm run db:studio
```

Akan membuka browser di `https://local.drizzle.studio` dan Anda bisa:
- Lihat semua tabel
- Edit data langsung
- Run queries
- Lihat relations

### Opsi 2: Menggunakan Supabase Dashboard

1. Buka Supabase Dashboard
2. Klik **Table Editor**
3. Anda akan melihat semua tabel yang sudah dibuat:
   - ✅ users
   - ✅ branches
   - ✅ services
   - ✅ transactions
   - ✅ transaction_items
   - ✅ attendance
   - ✅ kasbon
   - ✅ expenses
   - ✅ points
   - ✅ receipt_templates

---

## 🌱 Step 4: Seed Data (Optional)

Untuk testing, Anda bisa menambahkan data awal. Saya akan buatkan seed script terpisah.

---

## 📝 Database Schema Overview

### **Users Table**
- Menyimpan semua user (owner, admin, cashier, barber, employee)
- Support PIN untuk quick login
- Branch assignment

### **Branches Table**
- Daftar cabang barbershop
- Setiap user bisa di-assign ke branch tertentu

### **Services Table**
- Daftar layanan (haircut, styling, treatment)
- Daftar produk (pomade, shampoo, dll)
- Stock management untuk produk
- Commission rate per service/product

### **Transactions Table**
- Semua transaksi POS
- Snapshot cashier & branch name (untuk historical accuracy)
- Support multiple payment methods

### **Transaction Items Table**
- Detail item per transaksi
- Barber assignment per item
- Commission calculation
- Snapshot service details

### **Attendance Table**
- Check-in/check-out karyawan
- Photo upload (selfie)
- Break time tracking
- Work hours calculation

### **Kasbon Table**
- Kasbon request dari karyawan
- Approval workflow
- Installment tracking

### **Expenses Table**
- Pengeluaran per cabang
- Receipt upload
- Approval workflow
- Category-based tracking

### **Points Table**
- Bonus/penalty system
- Track who gave the points
- Reason logging

### **Receipt Templates Table**
- Custom receipt design per branch
- JSON-based template storage

---

## 🔐 Security: Row Level Security (RLS)

Setelah schema di-push, Anda perlu setup RLS policies di Supabase:

### Cara setup RLS:

1. Buka **Supabase Dashboard**
2. Klik **Authentication** → **Policies**
3. Untuk setiap tabel, klik **New Policy**

### Contoh Policy untuk `transactions`:

**Policy Name:** `Users can view transactions from their branch`

**Policy Definition:**
```sql
CREATE POLICY "Users can view transactions from their branch"
ON transactions
FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM users WHERE id = auth.uid()
  )
);
```

**Policy Name:** `Cashiers can insert transactions`

```sql
CREATE POLICY "Cashiers can insert transactions"
ON transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('cashier', 'admin', 'owner')
  )
);
```

---

## 🛠️ Troubleshooting

### Error: "Connection refused"
- ✅ Pastikan `DATABASE_URL` sudah benar
- ✅ Pastikan password tidak ada karakter spesial yang perlu di-encode
- ✅ Cek apakah Supabase project masih aktif

### Error: "relation already exists"
- ✅ Tabel sudah ada di database
- ✅ Gunakan `db:push` untuk sync schema

### Error: "password authentication failed"
- ✅ Password salah
- ✅ Reset password di Supabase Dashboard > Settings > Database

### Cara reset database (HATI-HATI!):
```sql
-- Jalankan di Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Lalu jalankan `npm run db:push` lagi.

---

## 📚 Next Steps

1. ✅ Setup database schema (Step 1-3)
2. ✅ Seed initial data (owner account, branches, services)
3. ✅ Setup RLS policies
4. ✅ Test login & POS system
5. ✅ Deploy to Vercel

---

## 🆘 Need Help?

Jika ada error atau pertanyaan, screenshot error message dan tanyakan ke saya!

**Tim Pengembang:**
- Ari Setia Hinanda
- Bayu Nurcahyo
- M. Ari Affandi
- M. Risky Ardiansyah
