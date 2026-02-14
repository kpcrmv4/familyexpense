-- Migration v5: Recipient-Category mapping for slip auto-summary
-- When user confirms a slip transaction, save the recipient → category mapping
-- Next time the same recipient appears, auto-fill category and skip steps

CREATE TABLE IF NOT EXISTS recipient_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipient_name)
);

CREATE INDEX IF NOT EXISTS idx_recipient_categories_user ON recipient_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_recipient_categories_lookup ON recipient_categories(user_id, recipient_name);
