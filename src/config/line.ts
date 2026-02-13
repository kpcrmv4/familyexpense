import { messagingApi, middleware, MiddlewareConfig, MessageAPIResponseBase } from '@line/bot-sdk';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

export const lineBlobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken,
});

export const lineMiddlewareConfig: MiddlewareConfig = {
  channelSecret,
};

export { channelSecret };
