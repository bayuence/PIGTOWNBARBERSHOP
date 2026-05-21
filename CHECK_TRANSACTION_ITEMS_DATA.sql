-- Check if there's any data in transaction_items
SELECT COUNT(*) as total_rows FROM transaction_items;

-- Show sample data
SELECT * FROM transaction_items LIMIT 5;
