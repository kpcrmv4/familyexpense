// ===== Database Types =====

export interface User {
  id: string;
  line_user_id: string;
  display_name: string;
  gender: 'male' | 'female' | 'other';
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  source: 'text' | 'slip' | 'recurring';
  transaction_date: string;
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_active: boolean;
  is_variable: boolean;
  end_month: string | null; // format: 'YYYY-MM' or null
  last_paid_date: string | null;
  snoozed_until: string | null;
  created_at: string;
}

export interface ConversationState {
  id: string;
  line_user_id: string;
  state: string;
  data: Record<string, any>;
  updated_at: string;
}

// ===== Flow Data Types =====

export interface TransactionDraft {
  description: string;
  amount: number;
  type?: 'income' | 'expense';
  category_id?: string;
  category_name?: string;
  source: 'text' | 'slip';
  suggested_category?: string;
}

export interface RecurringDraft {
  name?: string;
  amount?: number;
  due_day?: number;
  is_variable?: boolean;
  end_month?: string | null;
  editing_id?: string;
}

export interface SlipData {
  amount: number;
  description: string;
  recipient?: string;
  bank?: string;
  date?: string;
}

// ===== Gemini Response Types =====

export interface GeminiNLUResult {
  description: string;
  amount: number;
  suggested_category: string;
  suggested_type: 'income' | 'expense';
  confidence: number;
}

export interface GeminiOCRResult {
  amount: number;
  description: string;
  recipient: string;
  bank: string;
  date: string;
  confidence: number;
}

export interface GeminiRecommendation {
  summary: string;
  tips: string[];
  top_categories: { name: string; amount: number; percentage: number }[];
}

// ===== Theme Types =====

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  subtext: string;
}

export interface TransactionColors {
  highlight: string;
  bg: string;
  icon: string;
}

// ===== Postback Action Types =====

export type PostbackAction =
  | { action: 'select_type'; type: 'income' | 'expense' }
  | { action: 'select_category'; category_id: string; category_name: string }
  | { action: 'confirm_transaction' }
  | { action: 'cancel' }
  | { action: 'register_gender'; gender: 'male' | 'female' | 'other' }
  | { action: 'register_confirm' }
  | { action: 'recurring_menu' }
  | { action: 'recurring_add' }
  | { action: 'recurring_edit'; id: string }
  | { action: 'recurring_delete'; id: string }
  | { action: 'recurring_confirm_delete'; id: string }
  | { action: 'recurring_amount_type'; is_variable: boolean }
  | { action: 'recurring_end_month_none' }
  | { action: 'reminder_paid'; id: string }
  | { action: 'reminder_snooze'; id: string; days: number }
  | { action: 'view_summary' }
  | { action: 'view_summary_month'; year: number; month: number }
  | { action: 'ai_advice' }
  | { action: 'my_categories' }
  | { action: 'page'; page_type: string; page: number };
