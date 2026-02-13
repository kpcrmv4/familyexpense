import { lineClient } from '../config/line';
import * as stateService from '../services/stateService';
import * as categoryService from '../services/categoryService';
import * as transactionService from '../services/transactionService';
import * as userService from '../services/userService';
import * as geminiService from '../services/geminiService';
import * as userAccountService from '../services/userAccountService';
import * as transactionFlex from '../templates/transactionFlex';
import { errorMessage } from '../templates/summaryFlex';
import { getGenderTheme } from '../utils/themeColors';
import { TransactionDraft, ThemeColors } from '../types';

// ===== Text Input Flow (unchanged) =====

export async function startFromText(replyToken: string, lineUserId: string, text: string): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);

  // Get all categories for NLU suggestion
  const allCategories = await categoryService.getAllCategories(user.id);
  const categoryNames = allCategories.map((c) => c.name);

  const nluResult = await geminiService.parseExpenseText(text, categoryNames);

  if (nluResult.amount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('ไม่พบจำนวนเงินในข้อความ กรุณาพิมพ์ใหม่ เช่น "ค่ากาแฟ 60"')],
    });
    return;
  }

  const draft: TransactionDraft = {
    description: nluResult.description,
    amount: nluResult.amount,
    source: 'text',
    suggested_category: nluResult.suggested_category,
  };

  // If AI is confident, skip type selection
  if (nluResult.confidence >= 0.8) {
    draft.type = nluResult.suggested_type;
    const categories = await categoryService.getCategoriesByType(user.id, draft.type!);
    await stateService.setState(lineUserId, 'select_category', { draft, userId: user.id });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.selectCategoryMessage(draft, categories, theme)],
    });
  } else {
    await stateService.setState(lineUserId, 'select_type', { draft, userId: user.id });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.selectTypeMessage(draft, theme)],
    });
  }
}

// ===== Slip Flow (NEW: date check + account name detection) =====

interface SlipContext {
  sender: string;
  recipient: string;
  bank: string;
  slipDate: string;
}

export async function startFromSlip(
  replyToken: string,
  lineUserId: string,
  imageBuffer: Buffer
): Promise<void> {
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;

  const theme = getGenderTheme(user.gender);
  const ocrResult = await geminiService.parseSlipImage(imageBuffer);

  if (ocrResult.amount <= 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('ไม่สามารถอ่านจำนวนเงินจากสลิปได้ กรุณาถ่ายรูปใหม่หรือพิมพ์จำนวนเงิน')],
    });
    return;
  }

  const draft: TransactionDraft = {
    description: ocrResult.description,
    amount: ocrResult.amount,
    source: 'slip',
  };

  const slipContext: SlipContext = {
    sender: ocrResult.sender || 'ไม่ระบุ',
    recipient: ocrResult.recipient || 'ไม่ระบุ',
    bank: ocrResult.bank || 'ไม่ระบุ',
    slipDate: ocrResult.date,
  };

  // Step 1: Check date mismatch
  const today = new Date().toISOString().split('T')[0];

  if (ocrResult.date && ocrResult.date !== today) {
    // Date differs → ask user which date to use
    await stateService.setState(lineUserId, 'slip_select_date', {
      draft,
      userId: user.id,
      slipContext,
    });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.slipDateMismatchMessage(ocrResult.date, today, theme)],
    });
    return;
  }

  // Date matches → use today
  draft.transaction_date = today;

  // Step 2: Check account names
  await checkAccountAndProceed(replyToken, lineUserId, user, draft, slipContext, theme);
}

// ===== Slip: Date Selected =====

export async function handleSlipDateSelect(
  replyToken: string,
  lineUserId: string,
  dateChoice: 'slip' | 'today',
  stateData: Record<string, any>
): Promise<void> {
  const draft = stateData.draft as TransactionDraft;
  const slipContext = stateData.slipContext as SlipContext;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  if (dateChoice === 'slip') {
    draft.transaction_date = slipContext.slipDate;
  } else {
    draft.transaction_date = new Date().toISOString().split('T')[0];
  }

  // Proceed to account name check
  await checkAccountAndProceed(replyToken, lineUserId, user, draft, slipContext, theme);
}

// ===== Slip: Account Name Check =====

async function checkAccountAndProceed(
  replyToken: string,
  lineUserId: string,
  user: { id: string; gender: string },
  draft: TransactionDraft,
  slipContext: SlipContext,
  theme: ThemeColors
): Promise<void> {
  const accountNames = await userAccountService.getAccountNames(user.id);

  const senderMatch = userAccountService.matchAccountName(accountNames, slipContext.sender);
  const recipientMatch = userAccountService.matchAccountName(accountNames, slipContext.recipient);

  if (senderMatch) {
    // Sender is user's account → expense (user sent money)
    const suggestedType = 'expense' as const;
    await stateService.setState(lineUserId, 'slip_confirm_type', {
      draft,
      userId: user.id,
      slipContext,
      suggestedType,
    });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.slipSuggestTypeMessage(
        draft.amount,
        slipContext.sender,
        slipContext.recipient,
        slipContext.bank,
        suggestedType,
        slipContext.sender,
        theme,
      )],
    });
  } else if (recipientMatch) {
    // Recipient is user's account → income (user received money)
    const suggestedType = 'income' as const;
    await stateService.setState(lineUserId, 'slip_confirm_type', {
      draft,
      userId: user.id,
      slipContext,
      suggestedType,
    });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.slipSuggestTypeMessage(
        draft.amount,
        slipContext.sender,
        slipContext.recipient,
        slipContext.bank,
        suggestedType,
        slipContext.recipient,
        theme,
      )],
    });
  } else {
    // No match → normal flow: ask type
    await stateService.setState(lineUserId, 'select_type', {
      draft,
      userId: user.id,
      slipContext,
    });
    await lineClient.replyMessage({
      replyToken,
      messages: [transactionFlex.slipParsedMessage(
        draft.amount,
        slipContext.sender,
        slipContext.recipient,
        slipContext.bank,
        theme,
      )],
    });
  }
}

// ===== Slip: Confirm Suggested Type =====

export async function handleSlipConfirmType(
  replyToken: string,
  lineUserId: string,
  type: 'income' | 'expense',
  stateData: Record<string, any>
): Promise<void> {
  const draft = stateData.draft as TransactionDraft;
  const userId = stateData.userId as string;
  const slipContext = stateData.slipContext as SlipContext;
  draft.type = type;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  // Auto-save account name based on confirmed type
  await autoSaveAccountName(userId, type, slipContext);

  // Go to category selection
  const categories = await categoryService.getCategoriesByType(userId, type);
  await stateService.setState(lineUserId, 'select_category', { draft, userId });
  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.selectCategoryMessage(draft, categories, theme)],
  });
}

// ===== Slip: Reject Suggested Type → Flip =====

export async function handleSlipRejectType(
  replyToken: string,
  lineUserId: string,
  stateData: Record<string, any>
): Promise<void> {
  const suggestedType = stateData.suggestedType as 'income' | 'expense';

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  const flippedType = suggestedType === 'expense' ? 'income' : 'expense';

  // Update state with flipped type
  await stateService.setState(lineUserId, 'slip_confirm_type', {
    ...stateData,
    suggestedType: flippedType,
  });

  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.slipFlipTypeMessage(flippedType, theme)],
  });
}

// ===== Shared: Type Select (handles both text + slip) =====

export async function handleTypeSelect(
  replyToken: string,
  lineUserId: string,
  type: 'income' | 'expense',
  stateData: Record<string, any>
): Promise<void> {
  const draft = stateData.draft as TransactionDraft;
  const userId = stateData.userId as string;
  draft.type = type;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  // Auto-save account name from slip (if slip context exists)
  const slipContext = stateData.slipContext as SlipContext | undefined;
  if (slipContext) {
    await autoSaveAccountName(userId, type, slipContext);
  }

  const categories = await categoryService.getCategoriesByType(userId, type);
  await stateService.setState(lineUserId, 'select_category', { draft, userId });
  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.selectCategoryMessage(draft, categories, theme)],
  });
}

// ===== Category Select =====

export async function handleCategorySelect(
  replyToken: string,
  lineUserId: string,
  categoryId: string,
  categoryName: string,
  stateData: Record<string, any>
): Promise<void> {
  const draft = stateData.draft as TransactionDraft;
  const userId = stateData.userId as string;
  draft.category_id = categoryId;
  draft.category_name = categoryName;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  await stateService.setState(lineUserId, 'confirm_transaction', { draft, userId });
  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.confirmTransactionMessage(draft, theme)],
  });
}

// ===== Confirm & Save =====

export async function handleConfirm(
  replyToken: string,
  lineUserId: string,
  stateData: Record<string, any>
): Promise<void> {
  const draft = stateData.draft as TransactionDraft;
  const userId = stateData.userId as string;

  const user = await userService.findUserByLineId(lineUserId);
  if (!user) return;
  const theme = getGenderTheme(user.gender);

  try {
    await transactionService.createTransaction({
      user_id: userId,
      category_id: draft.category_id!,
      type: draft.type!,
      amount: draft.amount,
      description: draft.description,
      source: draft.source,
      transaction_date: draft.transaction_date,
    });

    await stateService.clearState(lineUserId);

    await lineClient.replyMessage({
      replyToken,
      messages: [
        transactionFlex.transactionSuccessMessage(
          draft.description,
          draft.amount,
          draft.type!,
          draft.category_name!,
          theme
        ),
      ],
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่')],
    });
  }
}

// ===== Helper: Auto-save account name =====

async function autoSaveAccountName(
  userId: string,
  type: 'income' | 'expense',
  slipContext: SlipContext
): Promise<void> {
  try {
    if (type === 'expense' && slipContext.sender && slipContext.sender !== 'ไม่ระบุ') {
      await userAccountService.saveAccountName(userId, slipContext.sender);
    } else if (type === 'income' && slipContext.recipient && slipContext.recipient !== 'ไม่ระบุ') {
      await userAccountService.saveAccountName(userId, slipContext.recipient);
    }
  } catch (error) {
    console.error('Auto-save account name error:', error);
  }
}
