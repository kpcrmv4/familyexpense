import { ThemeColors, GeminiRecommendation } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createTextRow, createSeparator, createSpacer } from './flexMessages';
import { formatCurrency, getThaiMonthYear, getCurrentThaiMonth } from '../utils/formatters';
import { getTransactionColors } from '../utils/themeColors';

export function monthlySummaryMessage(
  summary: { total_income: number; total_expense: number; balance: number },
  categoryBreakdown: { category_name: string; icon: string; type: string; total: number }[],
  theme: ThemeColors,
  year?: number,
  month?: number
): any {
  const now = new Date();
  const displayMonth = year && month ? getThaiMonthYear(year, month) : getCurrentThaiMonth();
  const incomeColors = getTransactionColors('income');
  const expenseColors = getTransactionColors('expense');

  const expenseCategories = categoryBreakdown
    .filter((c) => c.type === 'expense')
    .slice(0, 5);

  const categoryItems: any[] = expenseCategories.length > 0
    ? expenseCategories.flatMap((cat, i) => [
        ...(i > 0 ? [createSpacer('xs')] : []),
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `${cat.icon} ${cat.category_name}`,
              size: 'xs',
              color: '#6B7280',
              flex: 1,
            },
            {
              type: 'text',
              text: `฿${formatCurrency(cat.total)}`,
              size: 'xs',
              color: '#EF4444',
              align: 'end',
              weight: 'bold',
            },
          ],
        },
      ])
    : [{
        type: 'text',
        text: 'ยังไม่มีรายการ',
        size: 'xs',
        color: '#9CA3AF',
        align: 'center',
      }];

  return createFlexMessage('สรุปรายรับรายจ่าย', createBubble({
    header: createHeader('สรุปรายรับรายจ่าย', displayMonth, '📊'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        // Income/Expense/Balance cards
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📥 รายรับ', size: 'xxs', color: '#6B7280', align: 'center' },
                { type: 'text', text: `฿${formatCurrency(summary.total_income)}`, size: 'sm', weight: 'bold', color: incomeColors.highlight, align: 'center' },
              ],
              backgroundColor: incomeColors.bg,
              cornerRadius: 'md',
              paddingAll: 'sm',
              flex: 1,
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📤 รายจ่าย', size: 'xxs', color: '#6B7280', align: 'center' },
                { type: 'text', text: `฿${formatCurrency(summary.total_expense)}`, size: 'sm', weight: 'bold', color: expenseColors.highlight, align: 'center' },
              ],
              backgroundColor: expenseColors.bg,
              cornerRadius: 'md',
              paddingAll: 'sm',
              flex: 1,
            },
          ],
          spacing: 'sm',
        },
        createSpacer('sm'),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '💰 คงเหลือ', size: 'xxs', color: '#6B7280', align: 'center' },
            {
              type: 'text',
              text: `฿${formatCurrency(summary.balance)}`,
              size: 'xl',
              weight: 'bold',
              color: summary.balance >= 0 ? '#10B981' : '#EF4444',
              align: 'center',
            },
          ],
          backgroundColor: summary.balance >= 0 ? '#D1FAE5' : '#FEE2E2',
          cornerRadius: 'md',
          paddingAll: 'md',
        },
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        {
          type: 'text',
          text: '📊 รายจ่ายตามหมวดหมู่ (Top 5)',
          size: 'xs',
          weight: 'bold',
          color: '#1A1A2E',
        },
        createSpacer('sm'),
        ...categoryItems,
      ],
      paddingAll: 'lg',
      spacing: 'none' as any,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('🤖 ขอคำแนะนำ AI', JSON.stringify({ action: 'ai_advice' }), 'primary', theme.primary),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

export function aiAdviceMessage(
  advice: GeminiRecommendation,
  theme: ThemeColors
): any {
  const tipItems: any[] = advice.tips.map((tip, i) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `${i + 1}.`, size: 'xs', color: theme.accent, flex: 0, weight: 'bold' },
      { type: 'text', text: tip, size: 'xs', color: '#4B5563', wrap: true, flex: 1 },
    ],
    spacing: 'sm',
  }));

  return createFlexMessage('คำแนะนำ AI', createBubble({
    header: createHeader('คำแนะนำจาก AI', '🤖 วิเคราะห์การใช้จ่าย'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: advice.summary,
              size: 'sm',
              color: '#1A1A2E',
              wrap: true,
            },
          ],
          backgroundColor: '#F0F9FF',
          cornerRadius: 'lg',
          paddingAll: 'lg',
        },
        createSpacer('md'),
        {
          type: 'text',
          text: '💡 คำแนะนำ',
          size: 'sm',
          weight: 'bold',
          color: '#1A1A2E',
        },
        createSpacer('sm'),
        ...tipItems,
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

export function errorMessage(text: string): any {
  return createFlexMessage('เกิดข้อผิดพลาด', createBubble({
    header: createHeader('เกิดข้อผิดพลาด', '', '❌'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text,
          size: 'sm',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme: {
      primary: '#EF4444',
      secondary: '#FEE2E2',
      accent: '#DC2626',
      text: '#1A1A2E',
      subtext: '#6B7280',
    },
  }));
}
