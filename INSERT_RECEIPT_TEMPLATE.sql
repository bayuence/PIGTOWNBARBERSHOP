-- ========================================
-- INSERT DEFAULT RECEIPT TEMPLATE
-- ========================================
-- Jalankan SQL ini di Supabase SQL Editor

-- Versi 1: Insert dengan kolom minimal (PALING AMAN)
INSERT INTO receipt_templates (
  name, 
  header_text, 
  footer_text, 
  is_active
) VALUES (
  'Default Template',
  'PIGTOWN BARBERSHOP',
  'Terima kasih atas kunjungan Anda!',
  true
);

-- ========================================
-- Jika error, coba versi 2 ini:
-- ========================================
-- INSERT INTO receipt_templates (name, is_active) 
-- VALUES ('Default Template', true);

-- ========================================
-- Untuk melihat struktur tabel yang sebenarnya:
-- ========================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'receipt_templates';
