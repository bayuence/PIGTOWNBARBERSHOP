-- ========================================
-- CREATE TRANSACTION COUNTER SYSTEM (FORMAT INDONESIA)
-- ========================================
-- Format: TRX-DDMMYYYY-NNNN
-- Contoh: TRX-20052026-0001 (20 Mei 2026, transaksi ke-1)

-- 1. Create a table to store daily transaction counters
CREATE TABLE IF NOT EXISTS transaction_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_counters_date ON transaction_counters(date);

-- 3. Create function to get next transaction number (FORMAT INDONESIA)
CREATE OR REPLACE FUNCTION get_next_transaction_number()
RETURNS TEXT AS $$
DECLARE
  today DATE := CURRENT_DATE;
  next_counter INTEGER;
  transaction_number TEXT;
BEGIN
  -- Insert or update counter for today
  INSERT INTO transaction_counters (date, counter)
  VALUES (today, 1)
  ON CONFLICT (date) 
  DO UPDATE SET counter = transaction_counters.counter + 1
  RETURNING counter INTO next_counter;
  
  -- Generate transaction number: TRX-DDMMYYYY-NNNN (Format Indonesia)
  -- Contoh: TRX-20052026-0001 (20 Mei 2026, transaksi ke-1)
  transaction_number := 'TRX-' || 
                        TO_CHAR(today, 'DDMMYYYY') || '-' ||  -- DD=Tanggal, MM=Bulan, YYYY=Tahun
                        LPAD(next_counter::TEXT, 4, '0');
  
  RETURN transaction_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the function
SELECT get_next_transaction_number(); -- Returns: TRX-20052026-0001 (20 Mei 2026, transaksi ke-1)
SELECT get_next_transaction_number(); -- Returns: TRX-20052026-0002 (20 Mei 2026, transaksi ke-2)
SELECT get_next_transaction_number(); -- Returns: TRX-20052026-0003 (20 Mei 2026, transaksi ke-3)

-- 5. View today's counter
SELECT 
  date,
  counter as total_transaksi_hari_ini,
  TO_CHAR(date, 'DD Mon YYYY') as tanggal_indonesia
FROM transaction_counters 
WHERE date = CURRENT_DATE;

-- 6. View all transactions with Indonesian format
SELECT 
  transaction_number,
  TO_CHAR(created_at, 'DD Mon YYYY HH24:MI:SS') as waktu_transaksi,
  total_amount,
  payment_method
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
