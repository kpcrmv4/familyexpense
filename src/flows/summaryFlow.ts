import { lineClient } from '../config/line';
import * as userService from '../services/userService';
import * as transactionService from '../services/transactionService';
import * as recurringService from '../services/recurringService';
import * as geminiService from '../services/geminiService';
import * as summaryFlex from '../templates/summaryFlex';
import { getGenderTheme } from '../utils/themeColors';

export async function showSummary(
  replyToken: string,
  lineUserId: string,
  year?: number,
  month?: number
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;

  const [summary, categoryBreakdown, recurringItems, accumulatedBalance] = await Promise.all([
    transactionService.getMonthlySummary(user.id, targetYear, targetMonth),
    transactionService.getCategorySummary(user.id, targetYear, targetMonth),
    recurringService.getRecurringWithStatus(user.id, targetYear, targetMonth),
    transactionService.getAccumulatedBalance(user.id, targetYear, targetMonth),
  ]);

  await lineClient.replyMessage({
    replyToken,
    messages: [summaryFlex.monthlySummaryMessage(summary, categoryBreakdown, recurringItems, theme, targetYear, targetMonth, accumulatedBalance)],
  });
}

export async function showRecurringTimeline(
  replyToken: string,
  lineUserId: string,
  year?: number,
  month?: number
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;

  const recurringItems = await recurringService.getRecurringWithStatus(user.id, targetYear, targetMonth);

  await lineClient.replyMessage({
    replyToken,
    messages: [summaryFlex.recurringTimelineMessage(recurringItems, theme, targetYear, targetMonth)],
  });
}

export async function showAIAdvice(replyToken: string, lineUserId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const summary = await transactionService.getMonthlySummary(user.id, year, month);
  const categoryBreakdown = await transactionService.getCategorySummary(user.id, year, month);

  const advice = await geminiService.getSpendingAdvice(summary, categoryBreakdown, user.display_name);

  await lineClient.replyMessage({
    replyToken,
    messages: [summaryFlex.aiAdviceMessage(advice, theme)],
  });
}

export async function sendMonthlySummaryToAll(): Promise<void> {
  const users = await userService.getAllUsers();
  const now = new Date();
  // Summary for previous month
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed = previous month
  if (month === 0) {
    month = 12;
    year -= 1;
  }

  for (const user of users) {
    try {
      const theme = getGenderTheme(user.gender);
      const [summary, categoryBreakdown, recurringItems, accumulatedBalance] = await Promise.all([
        transactionService.getMonthlySummary(user.id, year, month),
        transactionService.getCategorySummary(user.id, year, month),
        recurringService.getRecurringWithStatus(user.id, year, month),
        transactionService.getAccumulatedBalance(user.id, year, month),
      ]);
      const message = summaryFlex.monthlySummaryMessage(summary, categoryBreakdown, recurringItems, theme, year, month, accumulatedBalance);

      await lineClient.pushMessage({
        to: user.line_user_id,
        messages: [message],
      });
    } catch (error) {
      console.error(`Failed to send summary to user ${user.id}:`, error);
    }
  }
}
