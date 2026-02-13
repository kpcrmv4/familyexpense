import { supabase } from '../config/supabase';

export async function getAccountNames(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_accounts')
    .select('account_name')
    .eq('user_id', userId);
  return (data || []).map((d) => d.account_name);
}

export async function saveAccountName(userId: string, accountName: string): Promise<void> {
  if (!accountName || accountName === 'ไม่ระบุ') return;

  const trimmed = accountName.trim();
  if (!trimmed) return;

  await supabase
    .from('user_accounts')
    .upsert(
      { user_id: userId, account_name: trimmed },
      { onConflict: 'user_id,account_name' }
    );
}

export function matchAccountName(storedNames: string[], candidate: string): boolean {
  if (!candidate || candidate === 'ไม่ระบุ') return false;
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return false;

  return storedNames.some((name) => {
    const n = name.trim().toLowerCase();
    return n.includes(normalized) || normalized.includes(n);
  });
}
