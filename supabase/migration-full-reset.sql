-- ============================================================
-- Family Expense Tracker - FULL RESET
-- ลบทุกตารางแล้วสร้างใหม่ทั้งหมด (v1 + v2 + v3)
-- WARNING: ข้อมูลทั้งหมดจะหายไป!
-- ============================================================

-- ลบตารางทั้งหมด (ลำดับสำคัญ เพราะ foreign key)
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS conversation_state CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS recurring_expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ลบ trigger/function เก่า
DROP TRIGGER IF EXISTS update_conversation_state_updated_at ON conversation_state;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id    TEXT UNIQUE NOT NULL,
  display_name    TEXT NOT NULL,
  gender          TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_line_user_id ON users(line_user_id);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon            TEXT DEFAULT '📌',
  is_default      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ============================================================
-- 3. TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  type              TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount            DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description       TEXT NOT NULL,
  source            TEXT NOT NULL CHECK (source IN ('text', 'slip', 'recurring')) DEFAULT 'text',
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);

-- ============================================================
-- 4. RECURRING EXPENSES (รวม v2: is_variable + end_month)
-- ============================================================
CREATE TABLE recurring_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  amount          DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  due_day         INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active       BOOLEAN DEFAULT TRUE,
  is_variable     BOOLEAN DEFAULT FALSE,
  end_month       TEXT DEFAULT NULL,
  last_paid_date  DATE,
  snoozed_until   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_user_id ON recurring_expenses(user_id);

COMMENT ON COLUMN recurring_expenses.is_variable IS 'true = ยอดไม่เท่ากันทุกเดือน (ค่าไฟ, ค่าน้ำ), false = ยอดคงที่ (ผ่อนรถ)';
COMMENT ON COLUMN recurring_expenses.end_month IS 'เดือนสิ้นสุด format YYYY-MM เช่น 2027-12, null = จ่ายตลอด';

-- ============================================================
-- 5. USER ACCOUNTS (v3: เก็บชื่อบัญชีสำหรับ auto-detect สลิป)
-- ============================================================
CREATE TABLE user_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_name    TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_accounts_unique ON user_accounts(user_id, account_name);
CREATE INDEX idx_user_accounts_user_id ON user_accounts(user_id);

-- ============================================================
-- 6. CONVERSATION STATE
-- ============================================================
CREATE TABLE conversation_state (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id    TEXT UNIQUE NOT NULL,
  state           TEXT NOT NULL,
  data            JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_state_line_user_id ON conversation_state(line_user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_state_updated_at
  BEFORE UPDATE ON conversation_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
