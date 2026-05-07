-- =====================================================
-- VERIFIKASI LENGKAP DATABASE PIGTOWNBARBERSHOP
-- =====================================================

-- 1. CEK SEMUA TABEL
SELECT 
    'TABLES' as category,
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. CEK DATA MENU
SELECT '=== DATA MENU ===' as info;
SELECT * FROM public.menu;

-- 3. CEK DATA USERS
SELECT '=== DATA USERS ===' as info;
SELECT id, email, role, pin, created_at FROM public.users;

-- 4. CEK DATA PROFILES
SELECT '=== DATA PROFILES ===' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 5. CEK DATA TRANSAKSI
SELECT '=== DATA TRANSAKSI ===' as info;
SELECT COUNT(*) as total_transaksi FROM public.transaksi;

-- 6. CEK DATA DETAIL TRANSAKSI
SELECT '=== DATA DETAIL TRANSAKSI ===' as info;
SELECT COUNT(*) as total_detail FROM public.detail_transaksi;

-- 7. CEK CUSTOM TYPES (ENUM)
SELECT '=== CUSTOM TYPES ===' as info;
SELECT 
    t.typname as type_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

-- 8. CEK FUNCTIONS
SELECT '=== CUSTOM FUNCTIONS ===' as info;
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 9. CEK PRIMARY KEYS
SELECT '=== PRIMARY KEYS ===' as info;
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 10. CEK FOREIGN KEYS
SELECT '=== FOREIGN KEYS ===' as info;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 11. CEK INDEXES
SELECT '=== INDEXES ===' as info;
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 12. CEK SEQUENCES
SELECT '=== SEQUENCES ===' as info;
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- =====================================================
-- RINGKASAN
-- =====================================================
SELECT '=== RINGKASAN DATABASE ===' as info;

SELECT 
    'Tables' as item,
    COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Custom Types' as item,
    COUNT(DISTINCT typname) as total
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') 
    AND typtype = 'e'

UNION ALL

SELECT 
    'Functions' as item,
    COUNT(*) as total
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')

UNION ALL

SELECT 
    'Menu Items' as item,
    COUNT(*) as total
FROM public.menu

UNION ALL

SELECT 
    'Users' as item,
    COUNT(*) as total
FROM public.users;
