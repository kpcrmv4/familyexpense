import { supabase } from '../config/supabase';

export interface RecipientCategory {
  id: string;
  user_id: string;
  recipient_name: string;
  category_id: string;
  category_name: string;
  usage_count: number;
}

export async function findByRecipient(
  userId: string,
  recipientName: string
): Promise<RecipientCategory | null> {
  if (!recipientName || recipientName === 'ไม่ระบุ') return null;

  const normalized = recipientName.trim().toLowerCase();
  if (!normalized) return null;

  // Fetch all recipient categories for this user
  const { data } = await supabase
    .from('recipient_categories')
    .select('*')
    .eq('user_id', userId);

  if (!data || data.length === 0) return null;

  // Fuzzy match: check if stored name contains candidate or vice versa
  return data.find((rc) => {
    const stored = rc.recipient_name.trim().toLowerCase();
    return stored.includes(normalized) || normalized.includes(stored);
  }) || null;
}

export async function saveRecipientCategory(
  userId: string,
  recipientName: string,
  categoryId: string,
  categoryName: string
): Promise<void> {
  if (!recipientName || recipientName === 'ไม่ระบุ') return;

  const trimmed = recipientName.trim();
  if (!trimmed) return;

  // Upsert: if exists, update category and increment usage_count
  const existing = await findByRecipient(userId, trimmed);

  if (existing) {
    await supabase
      .from('recipient_categories')
      .update({
        category_id: categoryId,
        category_name: categoryName,
        usage_count: existing.usage_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('recipient_categories')
      .insert({
        user_id: userId,
        recipient_name: trimmed,
        category_id: categoryId,
        category_name: categoryName,
      });
  }
}
