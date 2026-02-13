import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMonthlySummaryToAll } from '../../src/flows/summaryFlow';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const secret = req.query.secret as string;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await sendMonthlySummaryToAll();
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Monthly summary cron error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
