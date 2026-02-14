import { VercelRequest, VercelResponse } from '@vercel/node';
import { lineClient } from '../../src/config/line';
import { getDueRecurringExpenses, deactivateExpired } from '../../src/services/recurringService';
import { reminderMessage } from '../../src/templates/reminderFlex';
import { getGenderTheme } from '../../src/utils/themeColors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.query.secret as string;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

    // Auto-deactivate expired recurring items
    const deactivatedCount = await deactivateExpired(today);

    // Get due items for today
    const dueItems = await getDueRecurringExpenses(today);

    // Group by user
    const userItemsMap = new Map<string, {
      lineUserId: string;
      gender: string;
      items: { id: string; name: string; amount: number; due_day: number; is_variable: boolean }[];
    }>();

    for (const item of dueItems) {
      const lineUserId = item.users.line_user_id;
      if (!userItemsMap.has(lineUserId)) {
        userItemsMap.set(lineUserId, {
          lineUserId,
          gender: item.users.gender,
          items: [],
        });
      }
      userItemsMap.get(lineUserId)!.items.push({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        due_day: item.due_day,
        is_variable: item.is_variable,
      });
    }

    // Send reminders
    let sentCount = 0;
    for (const [, userData] of userItemsMap) {
      try {
        const theme = getGenderTheme(userData.gender);
        const message = reminderMessage(userData.items, theme);

        await lineClient.pushMessage({
          to: userData.lineUserId,
          messages: [message],
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder to ${userData.lineUserId}:`, error);
      }
    }

    return res.status(200).json({
      status: 'ok',
      date: today.toISOString(),
      due_items: dueItems.length,
      users_notified: sentCount,
      expired_deactivated: deactivatedCount,
    });
  } catch (error) {
    console.error('Reminder cron error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
