import { supabase } from '../config/supabase';
import { Category } from '../types';

export async function getCategoriesByType(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('is_default', { ascending: false })
    .order('name');
  return data || [];
}

export async function getAllCategories(userId: string): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('type')
    .order('name');
  return data || [];
}

export async function getCategoryById(categoryId: string): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();
  return data;
}

export async function addCategory(
  userId: string,
  name: string,
  type: 'income' | 'expense',
  icon: string = '📌'
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, type, icon, is_default: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}
