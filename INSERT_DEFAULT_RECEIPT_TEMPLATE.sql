-- Insert default receipt template for PIGTOWN BARBERSHOP
-- Run this in Supabase SQL Editor

INSERT INTO receipt_templates (
  name,
  header_text,
  footer_text,
  logo_url,
  is_active,
  is_default,
  branch_id
) VALUES (
  'Default Template',
  'PIGTOWN BARBERSHOP
Jl. Contoh No. 123
Telp: (021) 1234-5678',
  'Terima kasih atas kunjungan Anda!
Sampai jumpa kembali!

Follow us on Instagram: @pigtownbarbershop',
  '/images/pigtown-logo.png',
  true,
  true,
  NULL
)
ON CONFLICT DO NOTHING;

-- Verify the insert
SELECT * FROM receipt_templates WHERE is_default = true;
