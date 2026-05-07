-- =====================================================
-- CREATE MISSING TABLES - FIXED VERSION
-- Tabel yang dibutuhkan aplikasi tapi tidak ada di backup
-- PENTING: users.id dan services.id adalah INTEGER, bukan UUID!
-- =====================================================

-- =====================================================
-- 1. SERVICE_CATEGORIES (Kategori Layanan)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.service_categories (name, description, is_active) VALUES
('Potong Rambut', 'Layanan potong rambut', true),
('Styling', 'Layanan styling rambut', true),
('Perawatan', 'Layanan perawatan rambut', true),
('Produk', 'Produk barbershop', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. SERVICES (Rename dari menu dan update struktur)
-- CATATAN: Tabel menu menggunakan kolom bahasa Indonesia (nama, harga, deskripsi)
-- =====================================================

-- Rename tabel menu menjadi services jika belum
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'services'
    ) THEN
        ALTER TABLE public.menu RENAME TO services;
    END IF;
END $$;

-- Rename kolom bahasa Indonesia ke bahasa Inggris untuk konsistensi dengan aplikasi
DO $$ 
BEGIN
    -- Rename nama -> name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'nama'
    ) THEN
        ALTER TABLE public.services RENAME COLUMN nama TO name;
    END IF;
    
    -- Rename harga -> price
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'harga'
    ) THEN
        ALTER TABLE public.services RENAME COLUMN harga TO price;
    END IF;
    
    -- Rename deskripsi -> description
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'deskripsi'
    ) THEN
        ALTER TABLE public.services RENAME COLUMN deskripsi TO description;
    END IF;
    
    -- Rename durasi -> duration (jika ada)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'durasi'
    ) THEN
        ALTER TABLE public.services RENAME COLUMN durasi TO duration;
    END IF;
END $$;

-- Tambah kolom category_id jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.services ADD COLUMN category_id UUID;
        ALTER TABLE public.services ADD CONSTRAINT services_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.service_categories(id);
    END IF;
END $$;

-- Tambah kolom commission_rate jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE public.services ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- Tambah kolom type jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.services ADD COLUMN type VARCHAR(50) DEFAULT 'service';
    END IF;
END $$;

-- Tambah kolom stock jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'stock'
    ) THEN
        ALTER TABLE public.services ADD COLUMN stock INTEGER DEFAULT 0;
    END IF;
END $$;

-- Tambah kolom status jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.services ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Tambah kolom created_at jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.services ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 3. BRANCHES (Cabang) - Jika belum ada
-- =====================================================

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    manager_id UUID,
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default branch
INSERT INTO public.branches (name, address, phone, status) VALUES
('Cabang Utama', 'Alamat Cabang Utama', '081234567890', 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. BRANCH_SHIFTS (Shift Kerja) - Jika belum ada
-- =====================================================

CREATE TABLE IF NOT EXISTS public.branch_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL,
    shift_name VARCHAR(100) NOT NULL,
    shift_type VARCHAR(50),
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT branch_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. ATTENDANCE (Presensi) - Create jika belum ada
-- PENTING: user_id adalah INTEGER (bukan UUID)
-- =====================================================

-- Drop table jika ada dengan struktur salah
DROP TABLE IF EXISTS public.attendance CASCADE;

CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    branch_id UUID,
    date DATE NOT NULL,
    shift_type VARCHAR(50),
    check_in_time TIME,
    check_out_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    total_hours DECIMAL(5,2),
    break_duration DECIMAL(5,2),
    status VARCHAR(20),
    check_in_photo TEXT,
    check_out_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date),
    CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT attendance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);

-- =====================================================
-- 6. TRANSACTIONS - Create atau update struktur
-- PENTING: cashier_id dan server_id adalah INTEGER
-- =====================================================

-- Drop tables jika ada dengan struktur salah
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Jika tabel transaksi ada, drop juga
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transaksi'
    ) THEN
        DROP TABLE IF EXISTS public.detail_transaksi CASCADE;
        DROP TABLE IF EXISTS public.transaksi CASCADE;
    END IF;
END $$;

-- Create table transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_number VARCHAR(50),
    cashier_id INTEGER,
    server_id INTEGER,
    branch_id UUID,
    cashier_name VARCHAR(255),
    server_name VARCHAR(255),
    branch_name VARCHAR(255),
    customer_name VARCHAR(255),
    subtotal DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);

-- =====================================================
-- 7. TRANSACTION_ITEMS - Create atau update struktur
-- PENTING: service_id dan barber_id adalah INTEGER
-- =====================================================

CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    service_id INTEGER,
    barber_id INTEGER,
    service_name VARCHAR(255),
    service_type VARCHAR(50),
    service_category VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2),
    commission_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE,
    CONSTRAINT transaction_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- =====================================================
-- 8. PROFILES (User Profiles) - Jika belum ada
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    user_id INTEGER UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 9. POINTS (Sistem Poin)
-- PENTING: user_id adalah INTEGER
-- =====================================================

-- Drop table jika ada dengan struktur salah
DROP TABLE IF EXISTS public.points CASCADE;

CREATE TABLE public.points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    points_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- =====================================================
-- 10. KASBON (Pinjaman Karyawan)
-- PENTING: user_id dan approved_by adalah INTEGER
-- =====================================================

-- Drop table jika ada dengan struktur salah
DROP TABLE IF EXISTS public.kasbon CASCADE;

CREATE TABLE public.kasbon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    request_date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT kasbon_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT kasbon_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);

-- =====================================================
-- 11. EXPENSES (Pengeluaran Cabang)
-- PENTING: requested_by dan approved_by adalah INTEGER
-- =====================================================

-- Drop table jika ada dengan struktur salah
DROP TABLE IF EXISTS public.expenses CASCADE;

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID,
    requested_by INTEGER NOT NULL,
    approved_by INTEGER,
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    expense_date DATE NOT NULL,
    due_date DATE,
    receipt_url TEXT,
    notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
    CONSTRAINT expenses_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
    CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);

-- =====================================================
-- 12. RECEIPT_TEMPLATES (Template Struk)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID,
    name VARCHAR(255) NOT NULL,
    template_name VARCHAR(100),
    header_text TEXT,
    footer_text TEXT,
    logo_url TEXT,
    paper_width INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    show_logo BOOLEAN DEFAULT TRUE,
    show_address BOOLEAN DEFAULT TRUE,
    show_phone BOOLEAN DEFAULT TRUE,
    show_date BOOLEAN DEFAULT TRUE,
    show_barber BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT receipt_templates_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);

-- =====================================================
-- 13. COMMISSION_RULES (Aturan Komisi)
-- PENTING: user_id dan service_id adalah INTEGER
-- =====================================================

-- Drop table jika ada dengan struktur salah
DROP TABLE IF EXISTS public.commission_rules CASCADE;

CREATE TABLE public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER,
    service_id INTEGER,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT commission_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT commission_rules_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- =====================================================
-- SELESAI!
-- =====================================================

-- Verifikasi tabel yang sudah dibuat
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'service_categories', 'services', 'branches', 'branch_shifts', 
    'attendance', 'transactions', 'transaction_items', 'profiles',
    'points', 'kasbon', 'expenses', 'receipt_templates', 'commission_rules', 'users'
)
ORDER BY table_name;
