import { supabase } from '../config/supabase';
import { RecurringExpense } from '../types';

export async function getRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
  const { data } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('due_day');
  return data || [];
}

export async function getRecurringById(id: string): Promise<RecurringExpense | null> {
  const { data } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function createRecurring(params: {
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_variable?: boolean;
  end_month?: string | null;
}): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: params.user_id,
      name: params.name,
      amount: params.amount,
      due_day: params.due_day,
      is_variable: params.is_variable ?? false,
      end_month: params.end_month ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecurring(
  id: string,
  updates: Partial<Pick<RecurringExpense, 'name' | 'amount' | 'due_day' | 'is_active' | 'is_variable' | 'end_month' | 'last_paid_date' | 'snoozed_until'>>
): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecurring(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getDueRecurringExpenses(today: Date): Promise<
  (RecurringExpense & { users: { line_user_id: string; display_name: string; gender: string } })[]
> {
  const currentDay = today.getDate();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Current month in YYYY-MM format for end_month comparison
  const currentYM = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Get first day of current month for last_paid_date comparison
  const firstOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('recurring_expenses')
    .select('*, users(line_user_id, display_name, gender)')
    .eq('is_active', true)
    .eq('due_day', currentDay)
    .or(`snoozed_until.is.null,snoozed_until.lte.${todayStr}`)
    .or(`last_paid_date.is.null,last_paid_date.lt.${firstOfMonth}`);

  // Filter out expired items (end_month < current month)
  const filtered = (data || []).filter((item) => {
    if (!item.end_month) return true; // no end = always active
    return item.end_month >= currentYM;
  });

  return filtered as any;
}

/**
 * Auto-deactivate expired recurring expenses
 * Call this from cron to clean up items past their end_month
 */
export async function deactivateExpired(today: Date): Promise<number> {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentYM = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: false })
    .eq('is_active', true)
    .not('end_month', 'is', null)
    .lt('end_month', currentYM)
    .select('id');

  if (error) {
    console.error('Deactivate expired error:', error);
    return 0;
  }
  return data?.length || 0;
}
