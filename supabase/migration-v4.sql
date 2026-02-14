-- ============================================================
-- Migration V4: Debt Tracking
-- เพิ่มระบบติดตามหนี้ (บัตรเครดิต, หนี้สินอื่นๆ)
-- - total_debt: ยอดหนี้ทั้งหมด
-- - total_paid: ยอดที่จ่ายไปแล้ว (สะสม)
-- ============================================================

-- ยอดหนี้ทั้งหมด (null = ไม่ใช่รายการหนี้, เป็น recurring ปกติ)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS total_debt DECIMAL(12, 2) DEFAULT NULL;

-- ยอดที่จ่ายไปแล้วสะสม
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12, 2) DEFAULT 0;

COMMENT ON COLUMN recurring_expenses.total_debt IS 'ยอดหนี้ทั้งหมด (null = recurring ปกติ, มีค่า = เป็นรายการหนี้)';
COMMENT ON COLUMN recurring_expenses.total_paid IS 'ยอดที่จ่ายไปแล้วสะสม (ใช้กับรายการหนี้)';
