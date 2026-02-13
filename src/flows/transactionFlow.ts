import { lineClient } from '../config/line';
import * as stateService from '../services/stateService';
import * as categoryService from '../services/categoryService';
import * as transactionService from '../services/transactionService';
import * as userService from '../services/userService';
import * as geminiService from '../services/geminiService';
import * as transactionFlex from '../templates/transactionFlex';
import { errorMessage } from '../templates/summaryFlex';
import { getGenderTheme } from '../utils/themeColors';
import { TransactionDraft } from '../types';

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

  await stateService.setState(lineUserId, 'select_type', { draft, userId: user.id });
  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.slipParsedMessage(ocrResult.amount, ocrResult.recipient, ocrResult.bank, theme)],
  });
}

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

  const categories = await categoryService.getCategoriesByType(userId, type);
  await stateService.setState(lineUserId, 'select_category', { draft, userId });
  await lineClient.replyMessage({
    replyToken,
    messages: [transactionFlex.selectCategoryMessage(draft, categories, theme)],
  });
}

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
