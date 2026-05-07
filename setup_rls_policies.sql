-- =====================================================
-- SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- PIGTOWNBARBERSHOP
-- =====================================================
-- 
-- Jalankan script ini di Supabase SQL Editor setelah restore database
-- untuk mengaktifkan keamanan Row Level Security
--
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS untuk semua tabel
-- =====================================================

ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLICIES untuk MENU
-- =====================================================

-- Semua user bisa read menu
CREATE POLICY "Enable read access for all users" 
ON public.menu FOR SELECT 
USING (true);

-- Authenticated user bisa insert menu
CREATE POLICY "Enable insert for authenticated users" 
ON public.menu FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Authenticated user bisa update menu
CREATE POLICY "Enable update for authenticated users" 
ON public.menu FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Authenticated user bisa delete menu
CREATE POLICY "Enable delete for authenticated users" 
ON public.menu FOR DELETE 
USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. POLICIES untuk USERS
-- =====================================================

-- Authenticated user bisa read semua users
CREATE POLICY "Enable read for authenticated users" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- Authenticated user bisa insert users
CREATE POLICY "Enable insert for authenticated users" 
ON public.users FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Authenticated user bisa update users
CREATE POLICY "Enable update for authenticated users" 
ON public.users FOR UPDATE 
USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. POLICIES untuk PROFILES
-- =====================================================

-- Authenticated user bisa read profiles
CREATE POLICY "Enable read for authenticated users" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Authenticated user bisa insert profiles
CREATE POLICY "Enable insert for authenticated users" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- User bisa update profile sendiri
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================================================
-- 5. POLICIES untuk TRANSAKSI
-- =====================================================

-- Authenticated user bisa read transaksi
CREATE POLICY "Enable read for authenticated users" 
ON public.transaksi FOR SELECT 
USING (auth.role() = 'authenticated');

-- Authenticated user bisa insert transaksi
CREATE POLICY "Enable insert for authenticated users" 
ON public.transaksi FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Authenticated user bisa update transaksi
CREATE POLICY "Enable update for authenticated users" 
ON public.transaksi FOR UPDATE 
USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. POLICIES untuk DETAIL_TRANSAKSI
-- =====================================================

-- Authenticated user bisa read detail transaksi
CREATE POLICY "Enable read for authenticated users" 
ON public.detail_transaksi FOR SELECT 
USING (auth.role() = 'authenticated');

-- Authenticated user bisa insert detail transaksi
CREATE POLICY "Enable insert for authenticated users" 
ON public.detail_transaksi FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 7. STORAGE POLICIES (untuk attendance photos)
-- =====================================================

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'attendance-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read
CREATE POLICY "Allow public read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'attendance-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'attendance-photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'attendance-photos' AND
  auth.role() = 'authenticated'
);

-- =====================================================
-- SELESAI!
-- =====================================================
-- 
-- Policies sudah diaktifkan untuk:
-- ✅ menu
-- ✅ users
-- ✅ profiles
-- ✅ transaksi
-- ✅ detail_transaksi
-- ✅ storage (attendance-photos)
--
-- CATATAN:
-- - Policies ini untuk development/testing
-- - Untuk production, buat policies yang lebih ketat
-- - Sesuaikan dengan kebutuhan bisnis Anda
--
-- =====================================================
