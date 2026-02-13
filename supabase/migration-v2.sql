-- =============================================
-- Family Expense Tracker - Migration V2
-- เพิ่ม is_variable + end_month สำหรับ recurring expenses
-- Run this in Supabase SQL Editor (หลังจากรัน migration.sql แล้ว)
-- =============================================

-- เพิ่มคอลัมน์ is_variable (ยอดไม่คงที่ทุกเดือน เช่น ค่าไฟ ค่าน้ำ)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT FALSE;

-- เพิ่มคอลัมน์ end_month (เดือนสิ้นสุด format: 'YYYY-MM', null = ไม่มีสิ้นสุด)
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS end_month TEXT DEFAULT NULL;

-- Comment สำหรับเข้าใจ
COMMENT ON COLUMN recurring_expenses.is_variable IS 'true = ยอดไม่เท่ากันทุกเดือน (ค่าไฟ, ค่าน้ำ), false = ยอดคงที่ (ผ่อนรถ)';
COMMENT ON COLUMN recurring_expenses.end_month IS 'เดือนสิ้นสุด format YYYY-MM เช่น 2027-12, null = จ่ายตลอด';
