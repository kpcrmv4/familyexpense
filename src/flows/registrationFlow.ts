import { messagingApi } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import * as userService from '../services/userService';
import * as stateService from '../services/stateService';
import * as registerFlex from '../templates/registerFlex';

/**
 * สลับ Rich Menu ตามเพศผู้ใช้
 * ต้องตั้ง env: RICH_MENU_MALE_ID, RICH_MENU_FEMALE_ID
 */
async function switchRichMenuForGender(lineUserId: string, gender: string): Promise<void> {
  const maleMenuId = process.env.RICH_MENU_MALE_ID;
  const femaleMenuId = process.env.RICH_MENU_FEMALE_ID;

  let targetMenuId: string | undefined;
  if (gender === 'female' && femaleMenuId) {
    targetMenuId = femaleMenuId;
  } else if (maleMenuId) {
    targetMenuId = maleMenuId;
  }

  if (targetMenuId) {
    try {
      await lineClient.linkRichMenuIdToUser(lineUserId, targetMenuId);
    } catch (e) {
      console.error('Failed to switch Rich Menu:', e);
    }
  }
}

export async function startRegistration(replyToken: string, lineUserId: string): Promise<void> {
  const existingUser = await userService.findUserByLineId(lineUserId);

  if (existingUser) {
    await lineClient.replyMessage({
      replyToken,
      messages: [registerFlex.alreadyRegisteredMessage(existingUser.display_name)],
    });
    return;
  }

  await stateService.setState(lineUserId, 'register_name', {});
  await lineClient.replyMessage({
    replyToken,
    messages: [registerFlex.askNameMessage()],
  });
}

export async function handleNameInput(replyToken: string, lineUserId: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'กรุณาพิมพ์ชื่อที่ถูกต้อง (ไม่เกิน 50 ตัวอักษร)' }],
    });
    return;
  }

  await stateService.setState(lineUserId, 'register_gender', { name: trimmedName });
  await lineClient.replyMessage({
    replyToken,
    messages: [registerFlex.askGenderMessage(trimmedName)],
  });
}

export async function handleGenderSelect(
  replyToken: string,
  lineUserId: string,
  gender: 'male' | 'female' | 'other',
  stateData: Record<string, any>
): Promise<void> {
  const name = stateData.name as string;

  try {
    await userService.createUser(lineUserId, name, gender);
    await stateService.clearState(lineUserId);

    // Switch Rich Menu based on gender
    await switchRichMenuForGender(lineUserId, gender);

    await lineClient.replyMessage({
      replyToken,
      messages: [registerFlex.registerSuccessMessage(name, gender)],
    });
  } catch (error) {
    console.error('Registration error:', error);
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' }],
    });
  }
}
