-- ============================================================
-- Migration V3: User Accounts + Slip Auto-Detection
-- ============================================================
-- ตาราง user_accounts เก็บชื่อบัญชีธนาคารของผู้ใช้
-- ระบบจะเรียนรู้อัตโนมัติจากสลิปที่ส่งเข้ามา
-- ใช้เปรียบเทียบชื่อผู้โอน/ผู้รับเพื่อ auto-detect รายรับ/รายจ่าย
-- ============================================================

CREATE TABLE IF NOT EXISTS user_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ป้องกันชื่อบัญชีซ้ำต่อผู้ใช้
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_unique
  ON user_accounts(user_id, account_name);

-- Index สำหรับค้นหาตาม user_id
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id
  ON user_accounts(user_id);
