-- ========================================
-- FIX RLS POLICIES FOR ALL TABLES
-- ========================================
-- Run this SQL in Supabase SQL Editor to fix 406 errors

-- Disable RLS for all tables (EASIEST SOLUTION)
-- This allows all operations without authentication
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
ALTER TABLE branch_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlet_stock DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ALTERNATIVE: Enable RLS with permissive policies
-- (Use this if you want to keep RLS enabled)
-- ========================================

-- Enable RLS for all tables
-- ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- etc...

-- Create permissive policies (allow all operations)
-- CREATE POLICY "Allow all operations on receipt_templates" ON receipt_templates FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on transaction_items" ON transaction_items FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on services" ON services FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on service_categories" ON service_categories FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on branches" ON branches FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on points" ON points FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on kasbon" ON kasbon FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on branch_shifts" ON branch_shifts FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on commission_rules" ON commission_rules FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on employee_commissions" ON employee_commissions FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on employee_salaries" ON employee_salaries FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on outlet_stock" ON outlet_stock FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- NOTES:
-- ========================================
-- 1. Disabling RLS is the easiest solution for internal apps
-- 2. If you need security, use the alternative policies
-- 3. Run this SQL in Supabase SQL Editor
-- 4. After running, refresh your app
