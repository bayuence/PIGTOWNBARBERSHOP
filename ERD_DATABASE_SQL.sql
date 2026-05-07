-- ERD DATABASE SISTEM PIGTOWNBARBERHOP
-- Format SQL untuk Draw.io (Import via "Dari Teks..." -> "SQL...")

-- =====================================================
-- TABEL 1: USERS (Karyawan)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(50),
    status VARCHAR(20),
    branch_id UUID REFERENCES branches(id),
    salary DECIMAL(15,2),
    commission_rate DECIMAL(5,2),
    max_absent_days INTEGER,
    pin VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 2: BRANCHES (Cabang)
-- =====================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    status VARCHAR(20),
    manager_id UUID,
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 3: BRANCH_SHIFTS (Shift Kerja)
-- =====================================================
CREATE TABLE branch_shifts (
    id UUID PRIMARY KEY,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL,
    shift_type VARCHAR(50),
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 4: SERVICE_CATEGORIES (Kategori Layanan)
-- =====================================================
CREATE TABLE service_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 5: SERVICES (Layanan & Produk)
-- =====================================================
CREATE TABLE services (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES service_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    duration INTEGER,
    type VARCHAR(50),
    status VARCHAR(20),
    stock INTEGER,
    commission_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 6: TRANSACTIONS (Transaksi POS)
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_number VARCHAR(50),
    cashier_id UUID REFERENCES users(id),
    server_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    cashier_name VARCHAR(255),
    server_name VARCHAR(255),
    branch_name VARCHAR(255),
    customer_name VARCHAR(255),
    subtotal DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 7: TRANSACTION_ITEMS (Detail Transaksi)
-- =====================================================
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    barber_id UUID REFERENCES users(id),
    service_name VARCHAR(255),
    service_type VARCHAR(50),
    service_category VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2),
    commission_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 8: ATTENDANCE (Presensi Karyawan)
-- =====================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- =====================================================
-- TABEL 9: KASBON (Pinjaman Karyawan)
-- =====================================================
CREATE TABLE kasbon (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    request_date DATE NOT NULL,
    due_date DATE,
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 10: EXPENSES (Pengeluaran Cabang)
-- =====================================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    branch_id UUID REFERENCES branches(id),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    category VARCHAR(100),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    expense_date DATE NOT NULL,
    due_date DATE,
    receipt_url TEXT,
    notes TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 11: POINTS (Sistem Poin Karyawan)
-- =====================================================
CREATE TABLE points (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points_earned INTEGER NOT NULL,
    points_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 12: COMMISSION_RULES (Aturan Komisi)
-- =====================================================
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABEL 13: RECEIPT_TEMPLATES (Template Struk)
-- =====================================================
CREATE TABLE receipt_templates (
    id UUID PRIMARY KEY,
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    template_name VARCHAR(100),
    header_text TEXT,
    footer_text TEXT,
    logo_url TEXT,
    paper_width INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    show_logo BOOLEAN DEFAULT TRUE,
    show_address BOOLEAN DEFAULT TRUE,
    show_phone BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES untuk Performance
-- =====================================================
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_branch ON transactions(branch_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_kasbon_user ON kasbon(user_id);
CREATE INDEX idx_expenses_branch ON expenses(branch_id);

-- =====================================================
-- RINGKASAN DATABASE
-- =====================================================
-- Total Tabel: 13
-- Total Foreign Keys: 25
-- Total Indexes: 8
-- Database: PostgreSQL 15 (Supabase)
-- Region: Asia Southeast (Singapore)
-- 
-- Tim Development:
-- - Ari Setia Hinanda
-- - Bayu Nurcahyo
-- - M. Ari Affandi
-- - M. Risky Ardiansyah
-- 
-- Sistem: PIGTOWNBARBERHOP Management System
-- =====================================================
