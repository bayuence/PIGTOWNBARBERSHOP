# 🚀 Panduan Setup Database Supabase Baru

## PIGTOWNBARBERSHOP - Menghubungkan Project dengan Database Baru

---

## 📋 Langkah 1: Dapatkan Kredensial Supabase Baru

### 1.1 Buka Supabase Dashboard
1. Pergi ke: https://supabase.com/dashboard
2. Login dengan akun Anda
3. Pilih **project baru** yang sudah Anda buat

### 1.2 Dapatkan Project URL dan API Keys
1. Di sidebar kiri, klik **Settings** (icon gear ⚙️)
2. Klik **API**
3. Anda akan melihat:
   - **Project URL** - contoh: `https://abcdefgh.supabase.co`
   - **Project API keys:**
     - `anon` `public` - untuk client-side
     - `service_role` - untuk server-side (optional)

### 1.3 Copy Kredensial
Copy kedua nilai ini:
```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Langkah 2: Update Environment Variables

### 2.1 Edit File `.env.local`
File `.env.local` sudah dibuat di root project. Buka dan edit:

```env
# Ganti dengan Project URL Anda
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Ganti dengan anon public key Anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Simpan File
Setelah mengganti kedua nilai, **Save** file `.env.local`

---

## 🔧 Langkah 3: Update Kode (Opsional)

File `lib/supabase.ts` sudah dikonfigurasi untuk membaca dari environment variables, jadi **tidak perlu diubah**.

Tapi jika Anda ingin hardcode (tidak disarankan untuk production):

```typescript
// lib/supabase.ts
const supabaseUrl = "https://xxxxx.supabase.co"  // Ganti dengan URL baru
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Ganti dengan key baru
```

**⚠️ REKOMENDASI:** Gunakan `.env.local` untuk keamanan yang lebih baik!

---

## 🏃 Langkah 4: Restart Development Server

### 4.1 Stop Server yang Sedang Berjalan
Jika development server sedang berjalan, stop dengan:
- Tekan `Ctrl + C` di terminal

### 4.2 Start Server Lagi
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

### 4.3 Buka Browser
Buka: http://localhost:3000

---

## ✅ Langkah 5: Verifikasi Koneksi

### 5.1 Test Koneksi di Browser Console
1. Buka browser (Chrome/Edge)
2. Tekan `F12` untuk buka Developer Tools
3. Pergi ke tab **Console**
4. Paste dan jalankan:

```javascript
// Test koneksi Supabase
fetch('https://YOUR_PROJECT_URL.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Koneksi berhasil!', d))
.catch(e => console.error('❌ Koneksi gagal:', e))
```

### 5.2 Test Query Database
Buka halaman aplikasi dan coba:
- Login dengan user: `owner@pigtownbarbershop.com` / `pemilik123`
- Lihat menu di POS
- Cek data karyawan

### 5.3 Cek Console untuk Error
Jika ada error, akan muncul di browser console atau terminal.

---

## 🔐 Langkah 6: Setup Row Level Security (RLS)

Supabase menggunakan RLS untuk keamanan. Anda perlu setup policies:

### 6.1 Buka SQL Editor di Supabase
1. Di Supabase Dashboard, klik **SQL Editor**
2. Klik **New query**

### 6.2 Enable RLS untuk Tabel Public
```sql
-- Enable RLS untuk semua tabel
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi ENABLE ROW LEVEL SECURITY;
```

### 6.3 Buat Policies (Contoh untuk Development)
```sql
-- Policy untuk menu (semua user bisa read)
CREATE POLICY "Enable read access for all users" ON public.menu
FOR SELECT USING (true);

-- Policy untuk menu (authenticated user bisa insert/update)
CREATE POLICY "Enable insert for authenticated users" ON public.menu
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.menu
FOR UPDATE USING (auth.role() = 'authenticated');

-- Ulangi untuk tabel lain sesuai kebutuhan
```

**⚠️ PENTING:** Untuk production, buat policies yang lebih ketat!

---

## 🎯 Langkah 7: Setup Storage (Jika Diperlukan)

Jika aplikasi menggunakan upload foto (attendance photos):

### 7.1 Buat Storage Bucket
1. Di Supabase Dashboard, klik **Storage**
2. Klik **New bucket**
3. Nama: `attendance-photos`
4. Public: **Yes** (jika foto perlu diakses publik)
5. Klik **Create bucket**

### 7.2 Setup Storage Policies
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'attendance-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'attendance-photos');
```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- ✅ Pastikan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar
- ✅ Restart development server setelah update `.env.local`

### Error: "Failed to fetch"
- ✅ Cek `NEXT_PUBLIC_SUPABASE_URL` benar
- ✅ Cek koneksi internet
- ✅ Cek Supabase project masih aktif

### Error: "Row Level Security policy violation"
- ✅ Enable RLS policies seperti di Langkah 6
- ✅ Atau disable RLS untuk development (tidak disarankan):
  ```sql
  ALTER TABLE public.menu DISABLE ROW LEVEL SECURITY;
  ```

### Data tidak muncul
- ✅ Cek apakah data sudah di-restore (jalankan `verify_complete.sql`)
- ✅ Cek RLS policies
- ✅ Cek browser console untuk error

### Login tidak berfungsi
- ✅ User di `public.users` berbeda dengan `auth.users`
- ✅ Untuk Supabase Auth, user harus register dulu via Supabase Auth API
- ✅ Atau buat user manual di Supabase Dashboard > Authentication > Users

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js + Supabase:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist Setup

- [ ] Dapatkan Project URL dan API Key dari Supabase Dashboard
- [ ] Update `.env.local` dengan kredensial baru
- [ ] Restart development server
- [ ] Test koneksi di browser
- [ ] Verify data sudah ada (jalankan `verify_complete.sql`)
- [ ] Setup RLS policies
- [ ] Setup Storage bucket (jika perlu)
- [ ] Test login dan fitur aplikasi
- [ ] Deploy ke production (jika siap)

---

## 🎉 Selesai!

Jika semua langkah sudah diikuti, aplikasi Anda sekarang sudah terhubung dengan database Supabase baru!

**Happy coding! 🚀**
