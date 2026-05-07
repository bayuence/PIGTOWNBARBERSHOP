# ⚡ Quick Start - Hubungkan Project dengan Database Baru

## 3 Langkah Cepat untuk Menjalankan Project

---

## 1️⃣ Dapatkan Kredensial Supabase

1. Buka: https://supabase.com/dashboard
2. Pilih project baru Anda
3. Pergi ke: **Settings** > **API**
4. Copy:
   - **Project URL**
   - **anon public key**

---

## 2️⃣ Update Environment Variables

Edit file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ganti `xxxxx` dengan kredensial Anda!

---

## 3️⃣ Restart Server

```bash
# Stop server (Ctrl + C)
# Start lagi:
npm run dev
```

Buka: http://localhost:3000

---

## ✅ Test Aplikasi

1. **Login:**
   - Email: `owner@pigtownbarbershop.com`
   - Password: `pemilik123`

2. **Cek Menu:**
   - Pergi ke halaman POS
   - Lihat 2 menu items (Basic & Premium)

3. **Cek Console:**
   - Tekan F12
   - Lihat tab Console
   - Tidak ada error = ✅ Berhasil!

---

## 🔧 Setup Tambahan (Opsional)

### Setup RLS Policies
Jalankan file `setup_rls_policies.sql` di Supabase SQL Editor

### Setup Storage
1. Di Supabase Dashboard > **Storage**
2. Create bucket: `attendance-photos`
3. Set public: **Yes**

---

## 🐛 Troubleshooting

**Error "Invalid API key"?**
- Cek `.env.local` sudah benar
- Restart server

**Data tidak muncul?**
- Jalankan `verify_complete.sql` untuk cek data
- Setup RLS policies

**Login gagal?**
- User di `public.users` untuk data aplikasi
- Untuk Supabase Auth, perlu register dulu

---

## 📚 Dokumentasi Lengkap

Lihat file `SETUP_DATABASE_BARU.md` untuk panduan detail.

---

## 🎉 Selesai!

Project Anda sekarang terhubung dengan database Supabase baru! 🚀
