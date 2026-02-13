import { MessageEvent } from '@line/bot-sdk';
import { lineBlobClient, lineClient } from '../config/line';
import * as userService from '../services/userService';
import * as transactionFlow from '../flows/transactionFlow';
import { pleaseRegisterMessage } from '../templates/registerFlex';
import { errorMessage } from '../templates/summaryFlex';

export async function handleImageMessage(event: MessageEvent): Promise<void> {
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId!;
  const messageId = (event.message as any).id;

  // Check if user is registered
  const user = await userService.findUserByLineId(lineUserId);
  if (!user) {
    await lineClient.replyMessage({
      replyToken,
      messages: [pleaseRegisterMessage()],
    });
    return;
  }

  try {
    // Download image from LINE
    const stream = await lineBlobClient.getMessageContent(messageId);

    // Convert readable stream to buffer
    const chunks: Buffer[] = [];
    const readable = stream as unknown as NodeJS.ReadableStream;
    for await (const chunk of readable) {
      chunks.push(Buffer.from(chunk as any));
    }
    const imageBuffer = Buffer.concat(chunks);

    await transactionFlow.startFromSlip(replyToken, lineUserId, imageBuffer);
  } catch (error) {
    console.error('Image processing error:', error);
    await lineClient.replyMessage({
      replyToken,
      messages: [errorMessage('ไม่สามารถอ่านรูปภาพได้ กรุณาลองส่งใหม่')],
    });
  }
}
