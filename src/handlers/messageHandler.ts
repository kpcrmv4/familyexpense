import { MessageEvent } from '@line/bot-sdk';
import * as stateService from '../services/stateService';
import * as userService from '../services/userService';
import * as registrationFlow from '../flows/registrationFlow';
import * as transactionFlow from '../flows/transactionFlow';
import * as recurringFlow from '../flows/recurringFlow';
import { pleaseRegisterMessage } from '../templates/registerFlex';
import { lineClient } from '../config/line';
import { REGISTRATION_KEYWORD } from '../utils/constants';

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
