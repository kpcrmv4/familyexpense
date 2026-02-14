import { supabase } from '../config/supabase';
import { Transaction } from '../types';
import { todayDateString } from '../utils/formatters';

export async function createTransaction(params: {
  user_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  source: 'text' | 'slip' | 'recurring';
  transaction_date?: string;
}): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...params,
      transaction_date: params.transaction_date || todayDateString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMonthlyTransactions(
  userId: string,
  year: number,
  month: number
): Promise<Transaction[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name, icon)')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lt('transaction_date', endDate)
    .order('transaction_date', { ascending: false });
  return data || [];
}

export async function getMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<{ total_income: number; total_expense: number; balance: number }> {
  const transactions = await getMonthlyTransactions(userId, year, month);

  const total_income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const total_expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
  };
}

export async function getAccumulatedBalance(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  const beforeDate = `${year}-${String(month).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .lt('transaction_date', beforeDate);

  if (!data || data.length === 0) return 0;

  const income = data.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = data.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return income - expense;
}

export async function getDailyBreakdown(
  userId: string,
  year: number,
  month: number
): Promise<{ day: number; income: number; expense: number }[]> {
  const transactions = await getMonthlyTransactions(userId, year, month);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyMap = new Map<number, { income: number; expense: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { income: 0, expense: 0 });
  }

  for (const t of transactions) {
    const day = parseInt(t.transaction_date.split('-')[2], 10);
    const entry = dailyMap.get(day);
    if (entry) {
      if (t.type === 'income') entry.income += Number(t.amount);
      else entry.expense += Number(t.amount);
    }
  }

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, data]) => ({ day, ...data }));
}

export async function getDailySummary(
  userId: string,
  date: string
): Promise<{ total_income: number; total_expense: number }> {
  const { data } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .eq('transaction_date', date);

  if (!data || data.length === 0) return { total_income: 0, total_expense: 0 };

  const total_income = data.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const total_expense = data.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return { total_income, total_expense };
}

export async function getRecentTransactions(
  userId: string,
  limit: number = 5
): Promise<(Transaction & { categories: { name: string; icon: string } | null })[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name, icon)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data as any) || [];
}

export async function getCategorySummary(
  userId: string,
  year: number,
  month: number
): Promise<{ category_name: string; icon: string; type: string; total: number }[]> {
  const transactions = await getMonthlyTransactions(userId, year, month);

  const categoryMap = new Map<string, { category_name: string; icon: string; type: string; total: number }>();

  for (const t of transactions) {
    const cat = (t as any).categories;
    const key = t.category_id || 'unknown';
    const existing = categoryMap.get(key);
    if (existing) {
      existing.total += Number(t.amount);
    } else {
      categoryMap.set(key, {
        category_name: cat?.name || 'ไม่ระบุ',
        icon: cat?.icon || '📌',
        type: t.type,
        total: Number(t.amount),
      });
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
}
