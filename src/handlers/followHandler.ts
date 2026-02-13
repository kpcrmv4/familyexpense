import { FollowEvent, JoinEvent } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { welcomeMessage } from '../templates/registerFlex';

export async function handleFollow(event: FollowEvent): Promise<void> {
  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [welcomeMessage()],
  });
}

export async function handleJoin(event: JoinEvent): Promise<void> {
  await lineClient.replyMessage({
    replyToken: event.replyToken,
    messages: [welcomeMessage()],
  });
}
