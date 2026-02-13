import { lineClient } from '../config/line';
import * as stateService from '../services/stateService';
import * as recurringService from '../services/recurringService';
import * as transactionService from '../services/transactionService';
import * as categoryService from '../services/categoryService';
import * as userService from '../services/userService';
import * as recurringFlex from '../templates/recurringFlex';
import { errorMessage } from '../templates/summaryFlex';
import { getGenderTheme } from '../utils/themeColors';

// ===== Menu =====

export async function showMenu(replyToken: string, lineUserId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const items = await recurringService.getRecurringExpenses(user.id);

  await stateService.clearState(lineUserId);
  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringMenuMessage(items, theme)],
  });
}

// ===== Add Flow (5 steps) =====

// Step 1: Ask name
export async function startAdd(replyToken: string, lineUserId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  await stateService.setState(lineUserId, 'recurring_add_name', { userId: user.id });
  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskNameMessage(theme)],
  });
}

// Step 1 → 2: Name received, ask amount type
export async function handleNameInput(replyToken: string, lineUserId: string, name: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const trimmedName = name.trim();
  if (!trimmedName) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์ชื่อค่าใช้จ่าย' }],
    });
    return;
  }

  await stateService.setState(lineUserId, 'recurring_add_amount_type', {
    ...state.data,
    name: trimmedName,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskAmountTypeMessage(trimmedName, theme)],
  });
}

// Step 2 → 3: Amount type selected (postback), ask amount
export async function handleAmountTypeSelect(
  replyToken: string,
  lineUserId: string,
  isVariable: boolean
): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  await stateService.setState(lineUserId, 'recurring_add_amount', {
    ...state.data,
    is_variable: isVariable,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskAmountMessage(state.data.name, isVariable, theme)],
  });
}

// Step 3 → 4: Amount received, ask due day
export async function handleAmountInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  // Variable type can type 0 to skip
  const amount = parseFloat(text.replace(/,/g, ''));
  if (isNaN(amount) || amount < 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์จำนวนเงินที่ถูกต้อง เช่น 5000' }],
    });
    return;
  }

  if (!state.data.is_variable && amount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'ยอดคงที่ต้องมากกว่า 0 กรุณาพิมพ์ใหม่' }],
    });
    return;
  }

  await stateService.setState(lineUserId, 'recurring_add_due_day', {
    ...state.data,
    amount,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskDueDayMessage(state.data.name, amount, state.data.is_variable, theme)],
  });
}

// Step 4 → 5: Due day received, ask end month
export async function handleDueDayInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const dueDay = parseInt(text);
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์วันที่ 1-31' }],
    });
    return;
  }

  await stateService.setState(lineUserId, 'recurring_add_end_month', {
    ...state.data,
    due_day: dueDay,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskEndMonthMessage(state.data.name, theme)],
  });
}

// Step 5a: End month "ไม่มี" (postback)
export async function handleEndMonthNone(replyToken: string, lineUserId: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  await stateService.setState(lineUserId, 'recurring_confirm', {
    ...state.data,
    end_month: null,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringConfirmMessage(state.data, null, theme)],
  });
}

// Step 5b: End month typed (text: "MM/YYYY")
export async function handleEndMonthInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  // Parse MM/YYYY
  const match = text.trim().match(/^(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
  if (!match) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'รูปแบบไม่ถูกต้อง กรุณาพิมพ์ เดือน/ปี เช่น 12/2027' }],
    });
    return;
  }

  const month = parseInt(match[1]);
  const year = parseInt(match[2]);
  if (month < 1 || month > 12 || year < 2024 || year > 2099) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'เดือน 1-12 ปี 2024-2099 กรุณาพิมพ์ใหม่' }],
    });
    return;
  }

  const endMonth = `${year}-${String(month).padStart(2, '0')}`;

  // Check not in the past
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (endMonth < currentYM) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'วันสิ้นสุดต้องไม่เป็นอดีต กรุณาพิมพ์ใหม่' }],
    });
    return;
  }

  await stateService.setState(lineUserId, 'recurring_confirm', {
    ...state.data,
    end_month: endMonth,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringConfirmMessage(state.data, endMonth, theme)],
  });
}

// Step 6: Confirm → save
export async function handleConfirmAdd(replyToken: string, lineUserId: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  try {
    await recurringService.createRecurring({
      user_id: state.data.userId,
      name: state.data.name,
      amount: state.data.amount || 0,
      due_day: state.data.due_day,
      is_variable: state.data.is_variable || false,
      end_month: state.data.end_month || null,
    });

    await stateService.clearState(lineUserId);
    await lineClient.replyMessage({
      replyToken,
      messages: [recurringFlex.recurringSuccessMessage(state.data, theme)],
    });
  } catch (error) {
    console.error('Recurring creation error:', error);
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่')],
    });
  }
}

// ===== Edit / Delete =====

export async function showEditMenu(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringEditMessage(item, theme)],
  });
}

export async function showDeleteConfirm(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringDeleteConfirmMessage(item, theme)],
  });
}

export async function handleConfirmDelete(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  try {
    await recurringService.deleteRecurring(recurringId);
    await showMenu(replyToken, lineUserId);
  } catch (error) {
    console.error('Recurring delete error:', error);
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่')],
    });
  }
}

// ===== Reminder: Paid =====

export async function handleReminderPaid(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  if (item.is_variable) {
    // Variable amount → ask user to input the actual amount
    await stateService.setState(lineUserId, 'recurring_variable_paid', {
      recurringId: item.id,
      recurringName: item.name,
    });

    const { reminderAskAmountMessage } = await import('../templates/reminderFlex');
    await lineClient.replyMessage({
      replyToken,
      messages: [reminderAskAmountMessage(item.name, Number(item.amount), theme)],
    });
  } else {
    // Fixed amount → record immediately
    await recordPaidAndReply(replyToken, user, item, Number(item.amount), theme);
  }
}

// Variable paid: user typed the actual amount
export async function handleVariablePaidInput(
  replyToken: string,
  lineUserId: string,
  text: string
): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const amount = parseFloat(text.replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์จำนวนเงินที่ถูกต้อง เช่น 850' }],
    });
    return;
  }

  const item = await recurringService.getRecurringById(state.data.recurringId);
  if (!item) return;

  await stateService.clearState(lineUserId);
  await recordPaidAndReply(replyToken, user, item, amount, theme);
}

// Shared: record payment + reply
async function recordPaidAndReply(
  replyToken: string,
  user: { id: string },
  item: { id: string; name: string; amount: number; is_variable: boolean },
  paidAmount: number,
  theme: any
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Mark as paid & update amount for variable items
  const updates: any = {
    last_paid_date: today,
    snoozed_until: null,
  };
  if (item.is_variable) {
    updates.amount = paidAmount; // update to latest amount
  }
  await recurringService.updateRecurring(item.id, updates);

  // Create transaction record
  const categories = await categoryService.getCategoriesByType(user.id, 'expense');
  const defaultCategory = categories.find((c) => c.name === 'อื่นๆ') || categories[0];

  if (defaultCategory) {
    await transactionService.createTransaction({
      user_id: user.id,
      category_id: defaultCategory.id,
      type: 'expense',
      amount: paidAmount,
      description: item.name,
      source: 'recurring',
    });
  }

  const { reminderPaidMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderPaidMessage(item.name, paidAmount, theme)],
  });
}

// ===== Reminder: Snooze =====

export async function handleReminderSnooze(
  replyToken: string,
  lineUserId: string,
  recurringId: string,
  days: number
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + days);
  const snoozeDateStr = snoozeDate.toISOString().split('T')[0];

  await recurringService.updateRecurring(recurringId, {
    snoozed_until: snoozeDateStr,
  });

  const { reminderSnoozedMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderSnoozedMessage(item.name, days, theme)],
  });
}
