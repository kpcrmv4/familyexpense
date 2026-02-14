import { MessageEvent } from '@line/bot-sdk';
import * as stateService from '../services/stateService';
import * as userService from '../services/userService';
import * as registrationFlow from '../flows/registrationFlow';
import * as transactionFlow from '../flows/transactionFlow';
import * as recurringFlow from '../flows/recurringFlow';
import { pleaseRegisterMessage } from '../templates/registerFlex';
import { mainMenuMessage } from '../templates/menuFlex';
import { lineClient } from '../config/line';
import { getGenderTheme } from '../utils/themeColors';
import { REGISTRATION_KEYWORD } from '../utils/constants';

const MENU_KEYWORDS = ['เมนู', 'menu'];

export async function handleTextMessage(
  event: MessageEvent,
  text: string
): Promise<void> {
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId!;

  // Check for active conversation state
  const currentState = await stateService.getState(lineUserId);

  if (currentState) {
    await handleStatefulMessage(replyToken, lineUserId, text, currentState);
    return;
  }

  // Stateless message handling
  const normalizedText = text.trim();

  // Registration keyword
  if (normalizedText === REGISTRATION_KEYWORD) {
    await registrationFlow.startRegistration(replyToken, lineUserId);
    return;
  }

  // Check if user is registered
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) {
    await lineClient.replyMessage({
      replyToken,
      messages: [pleaseRegisterMessage()],
    });
    return;
  }

  // Menu keyword → send Flex menu (useful in group chats)
  if (MENU_KEYWORDS.includes(normalizedText.toLowerCase())) {
    const theme = getGenderTheme(user.gender);
    await lineClient.replyMessage({
      replyToken,
      messages: [mainMenuMessage(theme)],
    });
    return;
  }

  // Try to parse as expense/income text
  await transactionFlow.startFromText(replyToken, lineUserId, normalizedText);
}

async function handleStatefulMessage(
  replyToken: string,
  lineUserId: string,
  text: string,
  state: { state: string; data: Record<string, any> }
): Promise<void> {
  switch (state.state) {
    // === Registration ===
    case 'register_name':
      await registrationFlow.handleNameInput(replyToken, lineUserId, text);
      break;

    // === Recurring Add Flow ===
    case 'recurring_add_name':
      await recurringFlow.handleNameInput(replyToken, lineUserId, text);
      break;

    case 'recurring_add_amount':
      await recurringFlow.handleAmountInput(replyToken, lineUserId, text);
      break;

    case 'recurring_add_due_day':
      await recurringFlow.handleDueDayInput(replyToken, lineUserId, text);
      break;

    case 'recurring_add_end_month':
      await recurringFlow.handleEndMonthInput(replyToken, lineUserId, text);
      break;

    // === Variable Amount Paid ===
    case 'recurring_variable_paid':
      await recurringFlow.handleVariablePaidInput(replyToken, lineUserId, text);
      break;

    // === Debt Flows ===
    case 'recurring_add_total_debt':
      await recurringFlow.handleTotalDebtInput(replyToken, lineUserId, text);
      break;

    case 'recurring_add_min_payment':
      await recurringFlow.handleMinPaymentInput(replyToken, lineUserId, text);
      break;

    case 'debt_pay':
      await recurringFlow.handleDebtPayInput(replyToken, lineUserId, text);
      break;

    case 'debt_update_balance':
      await recurringFlow.handleDebtUpdateBalanceInput(replyToken, lineUserId, text);
      break;

    case 'debt_add_charge':
      await recurringFlow.handleDebtAddChargeInput(replyToken, lineUserId, text);
      break;

    // === Fixed Amount Paid (editable) ===
    case 'recurring_fixed_paid':
      await recurringFlow.handleFixedPaidInput(replyToken, lineUserId, text);
      break;

    // === Snooze Date Input ===
    case 'reminder_snooze_date':
      await recurringFlow.handleSnoozeDateInput(replyToken, lineUserId, text);
      break;

    // === Custom Category Name Input ===
    case 'add_custom_category_name':
      await transactionFlow.handleCustomCategoryNameInput(replyToken, lineUserId, text, state.data);
      break;

    default:
      // If user types text while in a flow that expects postback, clear state
      await stateService.clearState(lineUserId);
      // Re-process as new message
      const user = await userService.findUserByLineId(lineUserId);
      if (!user) {
        if (text.trim() === REGISTRATION_KEYWORD) {
          await registrationFlow.startRegistration(replyToken, lineUserId);
        } else {
          await lineClient.replyMessage({
            replyToken,
            messages: [pleaseRegisterMessage()],
          });
        }
      } else {
        await transactionFlow.startFromText(replyToken, lineUserId, text);
      }
      break;
  }
}
