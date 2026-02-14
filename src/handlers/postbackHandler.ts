import { PostbackEvent } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import * as stateService from '../services/stateService';
import * as userService from '../services/userService';
import * as transactionFlow from '../flows/transactionFlow';
import * as recurringFlow from '../flows/recurringFlow';
import * as summaryFlow from '../flows/summaryFlow';
import { pleaseRegisterMessage } from '../templates/registerFlex';
import { registrationFlow } from './index';
import { PostbackAction } from '../types';

export async function handlePostback(event: PostbackEvent): Promise<void> {
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId!;
  const rawData = event.postback.data;

  // Try to parse as JSON action
  let action: PostbackAction;
  try {
    action = JSON.parse(rawData);
  } catch {
    // Try to parse as query string (from Rich Menu)
    const params = new URLSearchParams(rawData);
    const actionStr = params.get('action');
    if (actionStr) {
      action = { action: actionStr } as any;
    } else {
      return;
    }
  }

  // Check registration for non-register actions
  if (action.action !== 'register_gender' && action.action !== 'register_confirm') {
    const user = await userService.findUserByLineId(lineUserId);
    if (!user) {
      await lineClient.replyMessage({
        replyToken,
        messages: [pleaseRegisterMessage()],
      });
      return;
    }
  }

  const currentState = await stateService.getState(lineUserId);

  switch (action.action) {
    // === Registration ===
    case 'register_gender':
      if (currentState?.state === 'register_gender') {
        await registrationFlow.handleGenderSelect(
          replyToken,
          lineUserId,
          action.gender,
          currentState.data
        );
      }
      break;

    // === Transaction ===
    case 'select_type':
      if (currentState?.state === 'select_type') {
        await transactionFlow.handleTypeSelect(replyToken, lineUserId, action.type, currentState.data);
      }
      break;

    case 'select_category':
      if (currentState?.state === 'select_category') {
        await transactionFlow.handleCategorySelect(
          replyToken,
          lineUserId,
          action.category_id,
          action.category_name,
          currentState.data
        );
      }
      break;

    case 'confirm_transaction':
      if (currentState?.state === 'confirm_transaction') {
        await transactionFlow.handleConfirm(replyToken, lineUserId, currentState.data);
      }
      break;

    // === Recurring ===
    case 'recurring_menu':
      await recurringFlow.showMenu(replyToken, lineUserId);
      break;

    case 'recurring_add':
      await recurringFlow.startAdd(replyToken, lineUserId);
      break;

    case 'recurring_edit':
      await recurringFlow.showEditMenu(replyToken, lineUserId, action.id);
      break;

    case 'recurring_delete':
      await recurringFlow.showDeleteConfirm(replyToken, lineUserId, action.id);
      break;

    case 'recurring_confirm_delete':
      await recurringFlow.handleConfirmDelete(replyToken, lineUserId, action.id);
      break;

    case 'recurring_amount_type':
      if (currentState?.state === 'recurring_add_amount_type') {
        await recurringFlow.handleAmountTypeSelect(replyToken, lineUserId, (action as any).is_variable);
      }
      break;

    case 'recurring_amount_type_debt':
      if (currentState?.state === 'recurring_add_amount_type') {
        await recurringFlow.handleDebtTypeSelect(replyToken, lineUserId);
      }
      break;

    case 'debt_update_balance':
      await recurringFlow.handleDebtUpdateBalance(replyToken, lineUserId, (action as any).id);
      break;

    case 'debt_add_charge':
      await recurringFlow.handleDebtAddCharge(replyToken, lineUserId, (action as any).id);
      break;

    case 'recurring_end_month_none':
      if (currentState?.state === 'recurring_add_end_month') {
        await recurringFlow.handleEndMonthNone(replyToken, lineUserId);
      }
      break;

    case 'recurring_confirm_add' as any:
      await recurringFlow.handleConfirmAdd(replyToken, lineUserId);
      break;

    // === Slip: Date / Account Detection ===
    case 'slip_select_date':
      if (currentState?.state === 'slip_select_date') {
        await transactionFlow.handleSlipDateSelect(replyToken, lineUserId, action.date, currentState.data);
      }
      break;

    case 'slip_confirm_type':
      if (currentState?.state === 'slip_confirm_type') {
        await transactionFlow.handleSlipConfirmType(replyToken, lineUserId, action.type, currentState.data);
      }
      break;

    case 'slip_reject_type':
      if (currentState?.state === 'slip_confirm_type') {
        await transactionFlow.handleSlipRejectType(replyToken, lineUserId, currentState.data);
      }
      break;

    // === Slip Auto-Summary ===
    case 'slip_auto_confirm':
      if (currentState?.state === 'slip_auto_confirm') {
        await transactionFlow.handleSlipAutoConfirm(replyToken, lineUserId, currentState.data);
      }
      break;

    case 'slip_auto_edit':
      if (currentState?.state === 'slip_auto_confirm') {
        await transactionFlow.handleSlipAutoEdit(replyToken, lineUserId, currentState.data);
      }
      break;

    case 'slip_auto_edit_type':
      if (currentState?.state === 'slip_auto_confirm') {
        await transactionFlow.handleSlipAutoEditType(replyToken, lineUserId, currentState.data);
      }
      break;

    case 'slip_auto_edit_category':
      if (currentState?.state === 'slip_auto_confirm') {
        await transactionFlow.handleSlipAutoEditCategory(replyToken, lineUserId, currentState.data);
      }
      break;

    // === Reminder ===
    case 'reminder_paid':
      await recurringFlow.handleReminderPaid(replyToken, lineUserId, action.id);
      break;

    case 'reminder_snooze_pick_date':
      await recurringFlow.handleReminderSnoozePickDate(replyToken, lineUserId, (action as any).id);
      break;

    case 'reminder_postpone_next_month':
      await recurringFlow.handleReminderPostponeNextMonth(replyToken, lineUserId, (action as any).id);
      break;

    case 'reminder_confirm_fixed':
      if (currentState?.state === 'recurring_fixed_paid') {
        await recurringFlow.handleFixedPaidConfirm(replyToken, lineUserId, (action as any).amount, currentState.data);
      }
      break;

    // === Recurring Timeline ===
    case 'view_recurring_timeline':
      await summaryFlow.showRecurringTimeline(replyToken, lineUserId);
      break;

    case 'timeline_pay':
      await recurringFlow.handleReminderPaid(replyToken, lineUserId, action.id);
      break;

    // === Summary ===
    case 'view_summary':
      await summaryFlow.showSummary(replyToken, lineUserId);
      break;

    case 'view_summary_month':
      await summaryFlow.showSummary(replyToken, lineUserId, action.year, action.month);
      break;

    // === AI Advice ===
    case 'ai_advice':
      await summaryFlow.showAIAdvice(replyToken, lineUserId);
      break;

    // === Rich Menu Actions ===
    case 'record_transaction' as any:
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '💬 พิมพ์รายการที่ต้องการบันทึก\nเช่น "ค่ากาแฟ 60" หรือส่งรูปสลิป 📸' }],
      });
      break;

    case 'my_categories' as any:
      // Show category list
      const categoryService = await import('../services/categoryService');
      const catUser = await userService.findUserByLineId(lineUserId);
      if (catUser) {
        const cats = await categoryService.getAllCategories(catUser.id);
        const expenseCats = cats.filter(c => c.type === 'expense').map(c => `${c.icon} ${c.name}`).join('\n');
        const incomeCats = cats.filter(c => c.type === 'income').map(c => `${c.icon} ${c.name}`).join('\n');
        await lineClient.replyMessage({
          replyToken,
          messages: [{
            type: 'text',
            text: `📂 หมวดหมู่ของคุณ\n\n📤 รายจ่าย:\n${expenseCats}\n\n📥 รายรับ:\n${incomeCats}`,
          }],
        });
      }
      break;

    // === Cancel ===
    case 'cancel':
      await stateService.clearState(lineUserId);
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: 'ยกเลิกเรียบร้อยค่ะ ✨' }],
      });
      break;

    default:
      console.log('Unknown postback action:', action);
      break;
  }
}
