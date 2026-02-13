import { supabase } from '../config/supabase';
import { User } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants';

export async function findUserByLineId(lineUserId: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();
  return data;
}

export async function createUser(
  lineUserId: string,
  displayName: string,
  gender: 'male' | 'female' | 'other'
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({ line_user_id: lineUserId, display_name: displayName, gender })
    .select()
    .single();

  if (error) throw error;

  // Create default categories
  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    user_id: data.id,
    name: c.name,
    type: 'expense' as const,
    icon: c.icon,
    is_default: true,
  }));

  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((c) => ({
    user_id: data.id,
    name: c.name,
    type: 'income' as const,
    icon: c.icon,
    is_default: true,
  }));

  await supabase.from('categories').insert([...expenseCategories, ...incomeCategories]);

  return data;
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*');
  return data || [];
}
