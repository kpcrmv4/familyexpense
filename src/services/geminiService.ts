import { geminiModel, geminiVisionModel } from '../config/gemini';
import { GeminiNLUResult, GeminiOCRResult, GeminiRecommendation } from '../types';

export async function parseExpenseText(text: string, categories: string[]): Promise<GeminiNLUResult> {
  const prompt = `คุณเป็นระบบวิเคราะห์ข้อความรายรับรายจ่ายภาษาไทย
วิเคราะห์ข้อความนี้: "${text}"

หมวดหมู่ที่มี: ${categories.join(', ')}

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):
{
  "description": "คำอธิบายรายการ",
  "amount": ตัวเลขจำนวนเงิน,
  "suggested_category": "ชื่อหมวดหมู่ที่เหมาะสมที่สุดจากรายการข้างต้น",
  "suggested_type": "income หรือ expense",
  "confidence": 0.0-1.0
}

กฎ:
- ถ้าข้อความมีตัวเลข ให้ดึงเป็น amount
- ถ้าไม่มีตัวเลข ให้ amount เป็น 0
- suggested_type: ถ้าเป็นค่าใช้จ่าย/ซื้อของ = "expense", ถ้าเป็นรายได้/เงินเข้า = "income"
- เลือก suggested_category จากรายการที่ให้มาเท่านั้น`;

  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text().trim();

  try {
    const cleaned = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      description: text,
      amount: 0,
      suggested_category: 'อื่นๆ',
      suggested_type: 'expense',
      confidence: 0,
    };
  }
}

export async function parseSlipImage(imageBuffer: Buffer): Promise<GeminiOCRResult> {
  const prompt = `คุณเป็นระบบอ่านสลิปโอนเงินจากธนาคารไทย
วิเคราะห์รูปภาพสลิปโอนเงินนี้

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):
{
  "amount": จำนวนเงินที่โอน (ตัวเลข),
  "description": "คำอธิบายสั้นๆ เช่น โอนเงินให้ [ชื่อผู้รับ]",
  "sender": "ชื่อผู้โอนเงิน (ชื่อด้านบนของสลิป / ผู้ส่ง / From)",
  "recipient": "ชื่อผู้รับเงิน (ชื่อด้านล่างของสลิป / ผู้รับ / To)",
  "bank": "ชื่อธนาคาร",
  "date": "วันที่ทำรายการ (YYYY-MM-DD)",
  "confidence": 0.0-1.0
}

กฎ:
- ดึงจำนวนเงินจากสลิป ถ้าอ่านไม่ได้ให้ amount เป็น 0
- sender คือชื่อผู้โอน/ผู้ส่ง มักอยู่ด้านบนของสลิป (From/จาก)
- recipient คือชื่อผู้รับ มักอยู่ด้านล่างของสลิป (To/ไปยัง)
- ถ้าอ่านชื่อไม่ได้ให้ใส่ "ไม่ระบุ"
- ถ้าอ่านธนาคารไม่ได้ให้ใส่ "ไม่ระบุ"
- date ให้ใช้รูปแบบ YYYY-MM-DD เท่านั้น`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const result = await geminiVisionModel.generateContent([prompt, imagePart]);
  const responseText = result.response.text().trim();

  try {
    const cleaned = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      amount: 0,
      description: 'สลิปโอนเงิน',
      sender: 'ไม่ระบุ',
      recipient: 'ไม่ระบุ',
      bank: 'ไม่ระบุ',
      date: new Date().toISOString().split('T')[0],
      confidence: 0,
    };
  }
}

export async function getSpendingAdvice(
  monthlyData: { total_income: number; total_expense: number; balance: number },
  categoryBreakdown: { category_name: string; total: number; type: string }[],
  userName: string
): Promise<GeminiRecommendation> {
  const expenseCategories = categoryBreakdown
    .filter((c) => c.type === 'expense')
    .map((c) => `${c.category_name}: ${c.total} บาท`)
    .join('\n');

  const prompt = `คุณเป็นที่ปรึกษาการเงินส่วนบุคคลที่เป็นมิตร
วิเคราะห์ข้อมูลการใช้จ่ายของ "${userName}" เดือนนี้:

รายรับ: ${monthlyData.total_income} บาท
รายจ่าย: ${monthlyData.total_expense} บาท
คงเหลือ: ${monthlyData.balance} บาท

รายจ่ายแยกตามหมวดหมู่:
${expenseCategories || 'ยังไม่มีข้อมูล'}

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):
{
  "summary": "สรุปภาพรวมการเงินสั้นๆ 1-2 ประโยค พูดเหมือนเพื่อนแนะนำ",
  "tips": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"],
  "top_categories": [
    {"name": "ชื่อหมวด", "amount": ตัวเลข, "percentage": เปอร์เซ็นต์}
  ]
}

กฎ:
- ใช้ภาษาไทยที่เป็นกันเอง น่ารัก
- tips ให้ 2-3 ข้อ ปฏิบัติได้จริง
- top_categories แสดง 3 หมวดที่ใช้จ่ายมากที่สุด`;

  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text().trim();

  try {
    const cleaned = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: 'ไม่สามารถวิเคราะห์ข้อมูลได้ในตอนนี้',
      tips: ['ลองบันทึกรายรับรายจ่ายเพิ่มเติมเพื่อให้ AI วิเคราะห์ได้แม่นยำขึ้น'],
      top_categories: [],
    };
  }
}
