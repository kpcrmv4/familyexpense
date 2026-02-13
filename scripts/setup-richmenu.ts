/**
 * Rich Menu Complete Setup Script
 * ทำทุกอย่างครบในคำสั่งเดียว:
 *   1. สร้างรูป Rich Menu (male + female)
 *   2. สร้าง Rich Menu ผ่าน LINE API
 *   3. อัพโหลดรูปเข้า Rich Menu
 *   4. ตั้ง male เป็น default Rich Menu
 *
 * Usage:
 *   npx ts-node scripts/setup-richmenu.ts
 *
 * Required ENV:
 *   LINE_CHANNEL_ACCESS_TOKEN
 *
 * หลัง setup เสร็จ ระบบจะสลับ Rich Menu ตามเพศผู้ใช้อัตโนมัติตอนลงทะเบียน
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ===== Config =====

const LINE_API_BASE = 'https://api.line.me/v2/bot';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('❌ Missing LINE_CHANNEL_ACCESS_TOKEN environment variable');
  console.error('   Set it: export LINE_CHANNEL_ACCESS_TOKEN=your_token');
  process.exit(1);
}

// ===== LINE API Helpers =====

function lineRequest(
  method: string,
  endpoint: string,
  body?: any,
  contentType: string = 'application/json'
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${LINE_API_BASE}${endpoint}`);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': contentType,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`LINE API ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve(data);
          }
        }
      });
    });
    req.on('error', reject);

    if (body && contentType === 'application/json') {
      req.write(JSON.stringify(body));
    } else if (body) {
      req.write(body);
    }
    req.end();
  });
}

function uploadRichMenuImage(richMenuId: string, imageBuffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
        } else {
          resolve(data ? JSON.parse(data) : {});
        }
      });
    });
    req.on('error', reject);
    req.write(imageBuffer);
    req.end();
  });
}

// ===== Rich Menu Definition =====

const RICH_MENU_AREAS = [
  // Row 1
  {
    bounds: { x: 0, y: 0, width: 833, height: 843 },
    action: { type: 'postback', data: 'action=record_transaction', displayText: '💬 บันทึกรายรับ/จ่าย' },
  },
  {
    bounds: { x: 833, y: 0, width: 834, height: 843 },
    action: { type: 'postback', data: 'action=recurring_menu', displayText: '📅 ค่าใช้จ่ายประจำเดือน' },
  },
  {
    bounds: { x: 1667, y: 0, width: 833, height: 843 },
    action: { type: 'postback', data: 'action=view_summary', displayText: '📊 ดูสรุปรายรับรายจ่าย' },
  },
  // Row 2
  {
    bounds: { x: 0, y: 843, width: 833, height: 843 },
    action: { type: 'postback', data: 'action=my_categories', displayText: '📂 หมวดหมู่ของฉัน' },
  },
  {
    bounds: { x: 833, y: 843, width: 834, height: 843 },
    action: { type: 'postback', data: 'action=ai_advice', displayText: '🤖 คำแนะนำ AI' },
  },
  {
    bounds: { x: 1667, y: 843, width: 833, height: 843 },
    action: { type: 'postback', data: 'action=settings', displayText: '⚙️ ตั้งค่า' },
  },
];

function createRichMenuBody(gender: 'male' | 'female') {
  return {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: `Family Expense - ${gender === 'male' ? 'ผู้ชาย' : 'ผู้หญิง'}`,
    chatBarText: '📊 เมนู',
    areas: RICH_MENU_AREAS,
  };
}

// ===== Main Flow =====

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🏠 Family Expense - Rich Menu Setup       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // ===== Step 1: Generate Images =====
  console.log('━━━ Step 1/4: Generate Rich Menu Images ━━━');
  const { generateRichMenuImage } = await import('./generate-richmenu-image');

  const maleBuffer = generateRichMenuImage('male');
  const malePath = path.join(assetsDir, 'richmenu-male.png');
  fs.writeFileSync(malePath, maleBuffer);
  console.log(`  ✅ Male theme: ${malePath} (${(maleBuffer.length / 1024).toFixed(1)} KB)`);

  const femaleBuffer = generateRichMenuImage('female');
  const femalePath = path.join(assetsDir, 'richmenu-female.png');
  fs.writeFileSync(femalePath, femaleBuffer);
  console.log(`  ✅ Female theme: ${femalePath} (${(femaleBuffer.length / 1024).toFixed(1)} KB)`);

  // ===== Step 2: Delete existing Rich Menus (optional cleanup) =====
  console.log('\n━━━ Step 2/4: Clean Up Old Rich Menus ━━━');
  try {
    const existing = await lineRequest('GET', '/richmenu/list');
    if (existing.richmenus?.length > 0) {
      for (const rm of existing.richmenus) {
        if (rm.name.startsWith('Family Expense')) {
          await lineRequest('DELETE', `/richmenu/${rm.richMenuId}`);
          console.log(`  🗑️  Deleted old menu: ${rm.name} (${rm.richMenuId})`);
        }
      }
    } else {
      console.log('  ℹ️  No existing Rich Menus found');
    }
  } catch (e: any) {
    console.log(`  ⚠️  Could not list existing menus: ${e.message}`);
  }

  // ===== Step 3: Create & Upload Rich Menus =====
  console.log('\n━━━ Step 3/4: Create Rich Menus via LINE API ━━━');

  // Male
  console.log('  📘 Creating male theme...');
  const maleResult = await lineRequest('POST', '/richmenu', createRichMenuBody('male'));
  const maleRichMenuId = maleResult.richMenuId;
  console.log(`    ✅ Created: ${maleRichMenuId}`);

  console.log('  📤 Uploading male image...');
  await uploadRichMenuImage(maleRichMenuId, maleBuffer);
  console.log('    ✅ Uploaded');

  // Female
  console.log('  📕 Creating female theme...');
  const femaleResult = await lineRequest('POST', '/richmenu', createRichMenuBody('female'));
  const femaleRichMenuId = femaleResult.richMenuId;
  console.log(`    ✅ Created: ${femaleRichMenuId}`);

  console.log('  📤 Uploading female image...');
  await uploadRichMenuImage(femaleRichMenuId, femaleBuffer);
  console.log('    ✅ Uploaded');

  // ===== Step 4: Set Default =====
  console.log('\n━━━ Step 4/4: Set Default Rich Menu ━━━');
  await lineRequest('POST', `/user/all/richmenu/${maleRichMenuId}`, '');
  console.log(`  ✅ Default Rich Menu set to male theme`);

  // ===== Summary =====
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🎉 Rich Menu Setup Complete!               ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Rich Menu IDs (บันทึกไว้ใส่ใน Environment Variables):');
  console.log(`  RICH_MENU_MALE_ID=${maleRichMenuId}`);
  console.log(`  RICH_MENU_FEMALE_ID=${femaleRichMenuId}`);
  console.log('');
  console.log('💡 ระบบจะสลับ Rich Menu ตามเพศผู้ใช้อัตโนมัติตอนลงทะเบียน');
  console.log('   ใช้ lineClient.linkRichMenuIdToUser(userId, richMenuId)');
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
