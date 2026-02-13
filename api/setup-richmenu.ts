import { VercelRequest, VercelResponse } from '@vercel/node';
import { lineClient } from '../src/config/line';
import { RICH_MENU_ACTIONS } from '../src/utils/constants';

/**
 * POST /api/setup-richmenu?secret=xxx
 *
 * สร้าง Rich Menu 2 ชุด (male/female) ผ่าน LINE API
 * (ไม่รวมอัพโหลดรูป เพราะ Vercel serverless ไม่มี canvas)
 *
 * วิธีแนะนำ: ใช้ CLI script แทน
 *   npx ts-node scripts/setup-richmenu.ts
 *   → สร้างรูป + สร้าง menu + อัพโหลด + set default ครบจบ
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const AREAS = [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.RECORD, displayText: '💬 บันทึกรายรับ/จ่าย' },
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.RECURRING, displayText: '📅 ค่าใช้จ่ายประจำเดือน' },
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.SUMMARY, displayText: '📊 ดูสรุปรายรับรายจ่าย' },
    },
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.CATEGORIES, displayText: '📂 หมวดหมู่ของฉัน' },
    },
    {
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.AI_ADVICE, displayText: '🤖 คำแนะนำ AI' },
    },
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: { type: 'postback' as const, data: RICH_MENU_ACTIONS.SETTINGS, displayText: '⚙️ ตั้งค่า' },
    },
  ];

  try {
    const results: Record<string, string> = {};

    for (const gender of ['male', 'female'] as const) {
      const label = gender === 'male' ? 'ผู้ชาย' : 'ผู้หญิง';
      const richMenu = await lineClient.createRichMenu({
        size: { width: 2500, height: 1686 },
        selected: true,
        name: `Family Expense - ${label}`,
        chatBarText: '📊 เมนู',
        areas: AREAS,
      });
      results[gender] = richMenu.richMenuId;
    }

    // Set male as default
    await lineClient.setDefaultRichMenu(results.male);

    return res.status(200).json({
      status: 'ok',
      richMenuIds: results,
      message: 'Rich Menus created. Upload images and set RICH_MENU_MALE_ID / RICH_MENU_FEMALE_ID env vars.',
      next_steps: [
        `Upload male image: POST https://api-data.line.me/v2/bot/richmenu/${results.male}/content`,
        `Upload female image: POST https://api-data.line.me/v2/bot/richmenu/${results.female}/content`,
        `Set env: RICH_MENU_MALE_ID=${results.male}`,
        `Set env: RICH_MENU_FEMALE_ID=${results.female}`,
        'OR use CLI: npx ts-node scripts/setup-richmenu.ts',
      ],
    });
  } catch (error) {
    console.error('Rich Menu setup error:', error);
    return res.status(500).json({ error: 'Failed to create Rich Menu', details: String(error) });
  }
}
