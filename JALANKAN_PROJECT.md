# 🚀 Cara Menjalankan Project dengan Database Baru

## PIGTOWNBARBERSHOP - Sudah Siap Jalan!

---

## ✅ Kredensial Sudah Dikonfigurasi!

File `.env.local` sudah diupdate dengan kredensial Supabase baru Anda:
- **Project URL:** `https://leoriloxnohuwzyapcou.supabase.co`
- **Anon Key:** Sudah dikonfigurasi ✅
- **Service Role Key:** Sudah dikonfigurasi ✅

---

## 🏃 Langkah-Langkah Menjalankan Project

### 1. Test Koneksi Database (Opsional)

```bash
node test-connection.js
```

Jika berhasil, Anda akan melihat:
```
✅ REST API: Connected!
✅ Menu table: Found 2 items
✅ Users table: Found 1 users
🎉 ALL TESTS PASSED!
```

### 2. Install Dependencies (Jika Belum)

```bash
npm install
```

atau

```bash
yarn install
```

atau

```bash
pnpm install
```

### 3. Jalankan Development Server

```bash
npm run dev
```

atau

```bash
yarn dev
```

atau

```bash
pnpm dev
```

### 4. Buka Browser

Buka: **http://localhost:3000**

---

## 🔐 Login ke Aplikasi

### Kredensial Default:
- **Email:** `owner@pigtownbarbershop.com`
- **Password:** `pemilik123`
- **PIN:** `123456`

---

## ✅ Verifikasi Aplikasi Berjalan

### 1. Cek Halaman POS
- Pergi ke menu **POS**
- Anda harus melihat 2 menu items:
  - Potong Rambut Basic (Rp 25.000)
  - Potong Rambut Premium (Rp 45.000)

### 2. Cek Console Browser
- Tekan **F12** untuk buka Developer Tools
- Pergi ke tab **Console**
- Tidak ada error merah = ✅ Berhasil!

### 3. Test Fitur
- ✅ Login/Logout
- ✅ Lihat menu
- ✅ Buat transaksi (jika ada)
- ✅ Lihat data karyawan

---

## 🔧 Setup Tambahan (Penting!)

### Setup Row Level Security (RLS)

Untuk keamanan database, jalankan script RLS:

1. Buka **Supabase Dashboard:** https://supabase.com/dashboard
2. Pilih project: **leoriloxnohuwzyapcou**
3. Klik **SQL Editor**
4. Klik **New query**
5. Copy semua isi file `setup_rls_policies.sql`
6. Paste dan klik **Run**

Atau disable RLS untuk development (tidak disarankan):

```sql
ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi DISABLE ROW LEVEL SECURITY;
```

### Setup Storage Bucket (Untuk Upload Foto)

1. Di Supabase Dashboard, klik **Storage**
2. Klik **New bucket**
3. Nama: `attendance-photos`
4. Public: **Yes**
5. Klik **Create bucket**

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
```bash
# Restart development server
# Ctrl + C untuk stop
npm run dev
```

### Error: "Failed to fetch"
- ✅ Cek koneksi internet
- ✅ Cek Supabase project masih aktif
- ✅ Jalankan `node test-connection.js`

### Error: "Row Level Security policy violation"
- ✅ Jalankan `setup_rls_policies.sql` di Supabase SQL Editor
- ✅ Atau disable RLS untuk development

### Data tidak muncul
- ✅ Jalankan `verify_complete.sql` untuk cek data
- ✅ Cek RLS policies
- ✅ Cek browser console untuk error

### Port 3000 sudah digunakan
```bash
# Gunakan port lain
npm run dev -- -p 3001
```

---

## 📊 Verifikasi Database

Jalankan query ini di Supabase SQL Editor untuk verifikasi:

```sql
-- Cek menu
SELECT * FROM public.menu;

-- Cek users
SELECT * FROM public.users;

-- Cek semua tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Atau jalankan file `verify_complete.sql` untuk verifikasi lengkap.

---

## 🎯 Next Steps

1. ✅ **Test semua fitur aplikasi**
2. ✅ **Setup RLS policies** (penting untuk keamanan!)
3. ✅ **Setup Storage bucket** (jika ada upload foto)
4. ✅ **Customize aplikasi** sesuai kebutuhan
5. ✅ **Deploy ke production** (jika siap)

---

## 📚 File Penting

- **`.env.local`** - Kredensial Supabase (sudah dikonfigurasi)
- **`test-connection.js`** - Script test koneksi
- **`setup_rls_policies.sql`** - Script setup keamanan
- **`verify_complete.sql`** - Script verifikasi database
- **`SETUP_DATABASE_BARU.md`** - Panduan lengkap

---

## 🎉 Selesai!

Project Anda sekarang sudah terhubung dengan database Supabase baru dan siap digunakan!

**Selamat coding! 🚀**

---

## 📞 Support

Jika ada masalah:
1. Cek file `SETUP_DATABASE_BARU.md` untuk panduan detail
2. Jalankan `node test-connection.js` untuk test koneksi
3. Cek Supabase Dashboard untuk monitoring

**Database Status:** ✅ Connected  
**Project URL:** https://leoriloxnohuwzyapcou.supabase.co  
**Tables:** 5 ✅  
**Data:** Menu (2), Users (1) ✅
