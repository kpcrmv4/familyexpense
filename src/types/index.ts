// ===== Database Types =====

export interface User {
  id: string;
  line_user_id: string;
  display_name: string;
  gender: 'male' | 'female' | 'other';
  created_at: string;
}

export interface UserAccount {
  id: string;
  user_id: string;
  account_name: string;
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
  total_debt: number | null; // ยอดหนี้ทั้งหมด (null = recurring ปกติ)
  total_paid: number; // ยอดจ่ายสะสม (ใช้กับหนี้)
  created_at: string;
}

export type RecurringStatus = 'paid' | 'overdue' | 'upcoming';

export interface RecurringWithStatus extends RecurringExpense {
  status: RecurringStatus;
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
  transaction_date?: string; // YYYY-MM-DD — ใช้สำหรับสลิปที่วันที่ต่างจากวันนี้
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
  sender: string;
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
  | { action: 'recurring_amount_type_debt' }
  | { action: 'recurring_end_month_none' }
  | { action: 'debt_update_balance'; id: string }
  | { action: 'debt_add_charge'; id: string }
  | { action: 'reminder_paid'; id: string }
  | { action: 'reminder_snooze'; id: string; days: number }
  | { action: 'slip_select_date'; date: 'slip' | 'today' }
  | { action: 'slip_confirm_type'; type: 'income' | 'expense' }
  | { action: 'slip_reject_type' }
  | { action: 'slip_auto_confirm' }
  | { action: 'slip_auto_edit' }
  | { action: 'slip_auto_edit_type' }
  | { action: 'slip_auto_edit_category' }
  | { action: 'view_summary' }
  | { action: 'view_summary_month'; year: number; month: number }
  | { action: 'ai_advice' }
  | { action: 'my_categories' }
  | { action: 'view_recurring_timeline' }
  | { action: 'timeline_pay'; id: string }
  | { action: 'page'; page_type: string; page: number };
