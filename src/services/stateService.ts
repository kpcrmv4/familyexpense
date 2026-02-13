import { supabase } from '../config/supabase';
import { ConversationState } from '../types';
import { STATE_EXPIRE_MINUTES } from '../utils/constants';

export async function getState(lineUserId: string): Promise<ConversationState | null> {
  const { data } = await supabase
    .from('conversation_state')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single();

  if (!data) return null;

  // Check if state is expired
  const updatedAt = new Date(data.updated_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

  if (diffMinutes > STATE_EXPIRE_MINUTES) {
    await clearState(lineUserId);
    return null;
  }

  return data;
}

export async function setState(
  lineUserId: string,
  state: string,
  data: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase
    .from('conversation_state')
    .upsert(
      { line_user_id: lineUserId, state, data, updated_at: new Date().toISOString() },
      { onConflict: 'line_user_id' }
    );
  if (error) throw error;
}

export async function updateStateData(
  lineUserId: string,
  newData: Record<string, any>
): Promise<void> {
  const current = await getState(lineUserId);
  if (!current) return;

  const mergedData = { ...current.data, ...newData };
  await setState(lineUserId, current.state, mergedData);
}

export async function clearState(lineUserId: string): Promise<void> {
  await supabase
    .from('conversation_state')
    .delete()
    .eq('line_user_id', lineUserId);
}
