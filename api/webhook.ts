import { VercelRequest, VercelResponse } from '@vercel/node';
import { WebhookEvent, validateSignature } from '@line/bot-sdk';
import { channelSecret } from '../src/config/line';
import { handleTextMessage, handleImageMessage, handlePostback, handleFollow, handleJoin } from '../src/handlers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET = health check (for testing + LINE webhook verify URL check)
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Family Expense Tracker Webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify LINE signature
  const signature = req.headers['x-line-signature'] as string;
  const body = JSON.stringify(req.body);

  if (!signature || !validateSignature(body, channelSecret, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const events: WebhookEvent[] = req.body.events || [];

  // Process events
  const results = await Promise.allSettled(
    events.map(async (event) => {
      try {
        switch (event.type) {
          case 'message':
            if (event.message.type === 'text') {
              await handleTextMessage(event, event.message.text);
            } else if (event.message.type === 'image') {
              await handleImageMessage(event);
            }
            break;

          case 'postback':
            await handlePostback(event);
            break;

          case 'follow':
            await handleFollow(event);
            break;

          case 'join':
            await handleJoin(event);
            break;

          default:
            console.log('Unhandled event type:', event.type);
        }
      } catch (error) {
        console.error('Event handling error:', error);
      }
    })
  );

  return res.status(200).json({ status: 'ok', processed: results.length });
}
