# 🚀 Setup Environment Variables di Vercel

## Masalah
Error `ERR_NAME_NOT_RESOLVED` terjadi karena environment variables Supabase tidak ter-set di Vercel.

## Solusi: Set Environment Variables di Vercel

### Langkah 1: Buka Vercel Dashboard
1. Pergi ke https://vercel.com/dashboard
2. Pilih project **finalcode** (atau nama project Anda)
3. Klik tab **Settings**
4. Klik **Environment Variables** di sidebar kiri

### Langkah 2: Tambahkan Environment Variables

Tambahkan 3 environment variables berikut:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://leoriloxnohuwzyapcou.supabase.co`
- **Environment:** Centang semua (Production, Preview, Development)

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcyOTUsImV4cCI6MjA5Mzc0MzI5NX0.g0FEx9DeD-Lfi6ZFZcFu14iswzhAGKa0Z9SHuk03S34`
- **Environment:** Centang semua (Production, Preview, Development)

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY (Optional)
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3JpbG94bm9odXd6eWFwY291Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NzI5NSwiZXhwIjoyMDkzNzQzMjk1fQ.3lqHvz84G4D1_wxzq-MUwQIl_m6l6Fnd20cNM12Ev5A`
- **Environment:** Centang semua (Production, Preview, Development)

### Langkah 3: Redeploy
Setelah menambahkan environment variables:
1. Klik **Save** untuk setiap variable
2. Pergi ke tab **Deployments**
3. Klik titik tiga (...) pada deployment terakhir
4. Klik **Redeploy**
5. Tunggu proses deployment selesai

### Langkah 4: Test
Setelah deployment selesai:
1. Buka website Anda
2. Coba login
3. Error `ERR_NAME_NOT_RESOLVED` seharusnya sudah hilang ✅

## Catatan Keamanan
- ⚠️ **JANGAN** commit file `.env.local` ke Git (sudah ada di .gitignore)
- ✅ File `.env.example` aman untuk di-commit (tidak berisi key asli)
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server-side operations

## Troubleshooting

### Jika masih error setelah set environment variables:
1. Pastikan semua 3 environment variables sudah ter-save
2. Pastikan tidak ada typo di key name (harus EXACT)
3. Lakukan **hard refresh** di browser (Ctrl + Shift + R)
4. Clear browser cache
5. Coba di incognito/private window

### Jika URL Supabase berubah:
1. Update di Vercel Environment Variables
2. Update di file `.env.local` lokal
3. Redeploy di Vercel
