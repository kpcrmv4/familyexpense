import { lineClient } from '../config/line';
import * as stateService from '../services/stateService';
import * as recurringService from '../services/recurringService';
import * as transactionService from '../services/transactionService';
import * as categoryService from '../services/categoryService';
import * as userService from '../services/userService';
import * as recurringFlex from '../templates/recurringFlex';
import { calculateInstallmentInfo } from '../templates/recurringFlex';
import { errorMessage } from '../templates/summaryFlex';
import { getGenderTheme } from '../utils/themeColors';
import { todayDateString, formatThaiDate } from '../utils/formatters';

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

// Step 4 → 5: Due day received, ask end month (or confirm for debt)
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

  // Debt type: skip end month, go straight to confirm
  if (state.data.is_debt) {
    await stateService.setState(lineUserId, 'recurring_confirm', {
      ...state.data,
      due_day: dueDay,
      end_month: null,
    });

    await lineClient.replyMessage({
      replyToken,
      messages: [recurringFlex.recurringConfirmMessage({ ...state.data, due_day: dueDay }, null, theme)],
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
      messages: [{ type: 'text', text: 'รูปแบบไม่ถูกต้อง กรุณาพิมพ์ เดือน/ปี เช่น 12/2027 หรือ 12/2570' }],
    });
    return;
  }

  const month = parseInt(match[1]);
  let year = parseInt(match[2]);

  // Support both พ.ศ. (BE) and ค.ศ. (CE) — if year >= 2500, treat as พ.ศ.
  if (year >= 2500) {
    year -= 543;
  }

  if (month < 1 || month > 12 || year < 2024 || year > 2099) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'เดือน 1-12 ปี 2024-2099 (หรือ พ.ศ. 2567-2642)\nกรุณาพิมพ์ใหม่' }],
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
      total_debt: state.data.is_debt ? (state.data.total_debt || null) : null,
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

  const isDebt = item.total_debt != null && Number(item.total_debt) > 0;

  if (isDebt) {
    // Debt item → always ask for payment amount
    await stateService.setState(lineUserId, 'debt_pay', {
      recurringId: item.id,
      recurringName: item.name,
    });

    const { reminderAskAmountMessage } = await import('../templates/reminderFlex');
    await lineClient.replyMessage({
      replyToken,
      messages: [reminderAskAmountMessage(item.name, Number(item.amount), theme)],
    });
  } else if (item.is_variable) {
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
    // Fixed amount → ask for confirmation/edit of amount
    await stateService.setState(lineUserId, 'recurring_fixed_paid', {
      recurringId: item.id,
      recurringName: item.name,
      fixedAmount: Number(item.amount),
    });

    const { reminderAskAmountMessage } = await import('../templates/reminderFlex');
    await lineClient.replyMessage({
      replyToken,
      messages: [reminderAskAmountMessage(item.name, Number(item.amount), theme, true)],
    });
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

// Fixed paid: user typed a custom amount (edit) or confirmed via postback
export async function handleFixedPaidInput(
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

// Fixed paid: user confirmed default amount via postback button
export async function handleFixedPaidConfirm(
  replyToken: string,
  lineUserId: string,
  amount: number,
  stateData: Record<string, any>
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const item = await recurringService.getRecurringById(stateData.recurringId);
  if (!item) return;

  await stateService.clearState(lineUserId);
  await recordPaidAndReply(replyToken, user, item, amount, theme);
}

// Shared: record payment + reply
async function recordPaidAndReply(
  replyToken: string,
  user: { id: string },
  item: { id: string; name: string; amount: number; is_variable: boolean; end_month?: string | null; created_at?: string; total_debt?: number | null; total_paid?: number },
  paidAmount: number,
  theme: any
): Promise<void> {
  const today = todayDateString();
  const isDebt = item.total_debt != null && Number(item.total_debt) > 0;

  // Mark as paid & update amount for variable items
  const updates: any = {
    last_paid_date: today,
    snoozed_until: null,
  };

  if (isDebt) {
    // Debt: accumulate total_paid and update latest payment amount
    const newTotalPaid = Number(item.total_paid || 0) + paidAmount;
    updates.total_paid = newTotalPaid;
    updates.amount = paidAmount;
  } else if (item.is_variable) {
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

  // Debt items: show debt progress bar
  if (isDebt) {
    const totalDebt = Number(item.total_debt);
    const totalPaid = Number(item.total_paid || 0) + paidAmount;
    await lineClient.replyMessage({
      replyToken,
      messages: [recurringFlex.debtPaidMessage(item.name, paidAmount, totalDebt, totalPaid, theme)],
    });
    return;
  }

  // Calculate installment info for items with end date
  let installment: { current: number; total: number } | null = null;
  if (item.end_month && item.created_at) {
    const createdYM = item.created_at.substring(0, 7); // "YYYY-MM" from ISO date
    installment = calculateInstallmentInfo(createdYM, item.end_month);
  }

  const { reminderPaidMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderPaidMessage(item.name, paidAmount, theme, installment)],
  });
}

// ===== Debt: Amount Type Selected =====

export async function handleDebtTypeSelect(replyToken: string, lineUserId: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  await stateService.setState(lineUserId, 'recurring_add_total_debt', {
    ...state.data,
    is_debt: true,
    is_variable: true, // debt payments are always variable
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.debtAskTotalDebtMessage(state.data.name, theme)],
  });
}

// ===== Debt: Total Debt Input =====

export async function handleTotalDebtInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const totalDebt = parseFloat(text.replace(/,/g, ''));
  if (isNaN(totalDebt) || totalDebt <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์ยอดหนี้ที่ถูกต้อง เช่น 30000' }],
    });
    return;
  }

  // Go to ask due day
  await stateService.setState(lineUserId, 'recurring_add_due_day', {
    ...state.data,
    total_debt: totalDebt,
    amount: 0, // no fixed monthly amount for debt
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.recurringAskDueDayMessage(state.data.name, 0, true, theme)],
  });
}

// ===== Debt: Payment Input =====

export async function handleDebtPayInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const amount = parseFloat(text.replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์จำนวนเงินที่ถูกต้อง เช่น 3000' }],
    });
    return;
  }

  const item = await recurringService.getRecurringById(state.data.recurringId);
  if (!item) return;

  await stateService.clearState(lineUserId);
  await recordPaidAndReply(replyToken, user, item, amount, theme);
}

// ===== Debt: Start Update Balance =====

export async function handleDebtUpdateBalance(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  await stateService.setState(lineUserId, 'debt_update_balance', {
    recurringId: item.id,
    recurringName: item.name,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.debtAskUpdateBalanceMessage(item.name, Number(item.total_debt || 0), theme)],
  });
}

// ===== Debt: Update Balance Input =====

export async function handleDebtUpdateBalanceInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const newDebt = parseFloat(text.replace(/,/g, ''));
  if (isNaN(newDebt) || newDebt <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์ยอดหนี้ที่ถูกต้อง เช่น 35000' }],
    });
    return;
  }

  const item = await recurringService.getRecurringById(state.data.recurringId);
  if (!item) return;

  await recurringService.updateRecurring(item.id, { total_debt: newDebt });
  await stateService.clearState(lineUserId);

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.debtBalanceUpdatedMessage(item.name, newDebt, Number(item.total_paid || 0), theme)],
  });
}

// ===== Debt: Start Add Charge =====

export async function handleDebtAddCharge(replyToken: string, lineUserId: string, recurringId: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  await stateService.setState(lineUserId, 'debt_add_charge', {
    recurringId: item.id,
    recurringName: item.name,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.debtAskAddChargeMessage(item.name, Number(item.total_debt || 0), theme)],
  });
}

// ===== Debt: Add Charge Input =====

export async function handleDebtAddChargeInput(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const chargeAmount = parseFloat(text.replace(/,/g, ''));
  if (isNaN(chargeAmount) || chargeAmount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์จำนวนเงินที่ถูกต้อง เช่น 5000' }],
    });
    return;
  }

  const item = await recurringService.getRecurringById(state.data.recurringId);
  if (!item) return;

  const newTotalDebt = Number(item.total_debt || 0) + chargeAmount;
  await recurringService.updateRecurring(item.id, { total_debt: newTotalDebt });
  await stateService.clearState(lineUserId);

  await lineClient.replyMessage({
    replyToken,
    messages: [recurringFlex.debtBalanceUpdatedMessage(item.name, newTotalDebt, Number(item.total_paid || 0), theme, true)],
  });
}

// ===== Reminder: Snooze - Pick specific date =====

export async function handleReminderSnoozePickDate(
  replyToken: string,
  lineUserId: string,
  recurringId: string
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  await stateService.setState(lineUserId, 'reminder_snooze_date', {
    recurringId: item.id,
    recurringName: item.name,
    dueDay: item.due_day,
  });

  const { reminderAskSnoozeDateMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderAskSnoozeDateMessage(item.name, item.due_day, theme)],
  });
}

// Snooze: user typed a specific day within this month
export async function handleSnoozeDateInput(
  replyToken: string,
  lineUserId: string,
  text: string
): Promise<void> {
  const state = await stateService.getState(lineUserId);
  if (!state) return;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const day = parseInt(text.trim());
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (isNaN(day) || day < now.getDate() || day > lastDay) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: `กรุณาพิมพ์วันที่ ${now.getDate()}-${lastDay} ในเดือนนี้` }],
    });
    return;
  }

  const snoozeDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const thaiDate = formatThaiDate(snoozeDateStr);

  await recurringService.updateRecurring(state.data.recurringId, {
    snoozed_until: snoozeDateStr,
  });

  await stateService.clearState(lineUserId);

  const { reminderSnoozedMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderSnoozedMessage(state.data.recurringName, thaiDate, theme)],
  });
}

// ===== Reminder: Postpone to Next Month =====

export async function handleReminderPostponeNextMonth(
  replyToken: string,
  lineUserId: string,
  recurringId: string
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const item = await recurringService.getRecurringById(recurringId);
  if (!item) return;

  // Calculate next month's due date
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  let nextMonth = now.getMonth() + 2; // +1 for 0-indexed, +1 for next month
  let nextYear = now.getFullYear();
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // Clamp due_day to last day of next month
  const lastDayNextMonth = new Date(nextYear, nextMonth, 0).getDate();
  const clampedDay = Math.min(item.due_day, lastDayNextMonth);

  const snoozeDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  const thaiDate = formatThaiDate(snoozeDateStr);

  await recurringService.updateRecurring(recurringId, {
    snoozed_until: snoozeDateStr,
  });

  const { reminderPostponedMessage } = await import('../templates/reminderFlex');
  await lineClient.replyMessage({
    replyToken,
    messages: [reminderPostponedMessage(item.name, thaiDate, theme)],
  });
}
