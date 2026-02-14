import { ThemeColors, GeminiRecommendation, RecurringWithStatus, Transaction } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createTextRow, createSeparator, createSpacer } from './flexMessages';
import { formatCurrency, getThaiMonthYear, getCurrentThaiMonth, formatThaiDate } from '../utils/formatters';
import { getTransactionColors } from '../utils/themeColors';

// ===== Category Row Helper =====

function categoryRow(icon: string, name: string, total: number, color: string): any {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `${icon} ${name}`, size: 'xs', color: '#6B7280', flex: 1 },
      { type: 'text', text: `฿${formatCurrency(total)}`, size: 'xs', color, align: 'end', weight: 'bold' },
    ],
  };
}

// ===== Bubble 1: Summary =====

function summaryBubble(
  summary: { total_income: number; total_expense: number; balance: number },
  categoryBreakdown: { category_name: string; icon: string; type: string; total: number }[],
  theme: ThemeColors,
  displayMonth: string
): any {
  const incomeColors = getTransactionColors('income');
  const expenseColors = getTransactionColors('expense');

  // Ratio bar
  const total = summary.total_income + summary.total_expense;
  const incomePercent = total > 0 ? Math.round((summary.total_income / total) * 100) : 50;
  const expensePercent = 100 - incomePercent;

  const ratioBar: any = {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'box', layout: 'vertical', contents: [], backgroundColor: '#10B981', height: '8px', flex: incomePercent || 1 },
          { type: 'box', layout: 'vertical', contents: [], backgroundColor: '#EF4444', height: '8px', flex: expensePercent || 1 },
        ],
        cornerRadius: 'md',
      },
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: `รายรับ ${incomePercent}%`, size: 'xxs', color: '#10B981', flex: 1 },
          { type: 'text', text: `รายจ่าย ${expensePercent}%`, size: 'xxs', color: '#EF4444', align: 'end', flex: 1 },
        ],
      },
    ],
    spacing: 'xs',
  };

  // Expense categories (top 5)
  const expenseCategories = categoryBreakdown.filter((c) => c.type === 'expense').slice(0, 5);
  const expenseCatItems: any[] = expenseCategories.length > 0
    ? expenseCategories.flatMap((cat, i) => [
        ...(i > 0 ? [createSpacer('xs')] : []),
        categoryRow(cat.icon, cat.category_name, cat.total, '#EF4444'),
      ])
    : [{ type: 'text', text: 'ยังไม่มีรายการ', size: 'xs', color: '#9CA3AF', align: 'center' }];

  // Income categories (top 3)
  const incomeCategories = categoryBreakdown.filter((c) => c.type === 'income').slice(0, 3);
  const incomeCatItems: any[] = incomeCategories.length > 0
    ? incomeCategories.flatMap((cat, i) => [
        ...(i > 0 ? [createSpacer('xs')] : []),
        categoryRow(cat.icon, cat.category_name, cat.total, '#10B981'),
      ])
    : [{ type: 'text', text: 'ยังไม่มีรายการ', size: 'xs', color: '#9CA3AF', align: 'center' }];

  return createBubble({
    header: createHeader('สรุปรายรับรายจ่าย', displayMonth, '📊'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        // Income / Expense cards
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
        // Balance
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
        // Ratio bar
        createSpacer('sm'),
        ratioBar,
        // Expense categories
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        { type: 'text', text: '📤 รายจ่ายตามหมวดหมู่ (Top 5)', size: 'xs', weight: 'bold', color: '#1A1A2E' },
        createSpacer('sm'),
        ...expenseCatItems,
        // Income categories
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        { type: 'text', text: '📥 รายรับตามหมวดหมู่ (Top 3)', size: 'xs', weight: 'bold', color: '#1A1A2E' },
        createSpacer('sm'),
        ...incomeCatItems,
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
  });
}

// ===== Bubble 2: Recurring Timeline =====

function recurringTimelineBubble(
  items: RecurringWithStatus[],
  theme: ThemeColors,
  displayMonth: string
): any {
  const paidCount = items.filter((i) => i.status === 'paid').length;
  const totalCount = items.length;
  const remainingAmount = items
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const statusIcon = (s: string) => s === 'paid' ? '✅' : s === 'overdue' ? '🔴' : '⏳';
  const statusColor = (s: string) => s === 'paid' ? '#10B981' : s === 'overdue' ? '#EF4444' : '#F59E0B';

  const itemRows: any[] = items.length > 0
    ? items.flatMap((item, i) => {
        const isDebt = item.total_debt != null && Number(item.total_debt) > 0;

        if (isDebt) {
          const totalDebt = Number(item.total_debt);
          const totalPaid = Number(item.total_paid || 0);
          const remaining = Math.max(totalDebt - totalPaid, 0);
          const paidPercent = Math.min(Math.round((totalPaid / totalDebt) * 100), 100);

          return [
            ...(i > 0 ? [createSpacer('xs')] : []),
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: statusIcon(item.status), size: 'sm', flex: 0 },
                    { type: 'text', text: `💳 ${item.name}`, size: 'xs', weight: 'bold', color: '#1A1A2E', flex: 1 },
                    { type: 'text', text: `฿${formatCurrency(remaining)}`, size: 'xs', weight: 'bold', color: statusColor(item.status), align: 'end' },
                  ],
                  spacing: 'sm',
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    ...(paidPercent > 0 ? [{ type: 'box' as const, layout: 'vertical' as const, contents: [] as any[], backgroundColor: '#10B981', height: '4px', flex: paidPercent || 1 }] : []),
                    ...(100 - paidPercent > 0 ? [{ type: 'box' as const, layout: 'vertical' as const, contents: [] as any[], backgroundColor: '#E5E7EB', height: '4px', flex: (100 - paidPercent) || 1 }] : []),
                  ],
                  cornerRadius: 'md',
                  margin: 'xs',
                },
                { type: 'text', text: `วันที่ ${item.due_day} · จ่ายแล้ว ${paidPercent}%`, size: 'xxs', color: '#9CA3AF', margin: 'xs' },
              ],
              backgroundColor: item.status === 'overdue' ? '#FEF2F2' : '#F9FAFB',
              cornerRadius: 'md',
              paddingAll: 'sm',
            },
          ];
        }

        return [
          ...(i > 0 ? [createSpacer('xs')] : []),
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: statusIcon(item.status), size: 'sm', flex: 0 },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: item.name, size: 'xs', weight: 'bold', color: '#1A1A2E' },
                  { type: 'text', text: `วันที่ ${item.due_day}`, size: 'xxs', color: '#9CA3AF' },
                ],
                flex: 1,
              },
              {
                type: 'text',
                text: item.is_variable
                  ? (Number(item.amount) > 0 ? `~฿${formatCurrency(Number(item.amount))}` : 'ไม่ระบุ')
                  : `฿${formatCurrency(Number(item.amount))}`,
                size: 'xs',
                weight: 'bold',
                color: statusColor(item.status),
                align: 'end',
                gravity: 'center',
              },
            ],
            spacing: 'sm',
            backgroundColor: item.status === 'overdue' ? '#FEF2F2' : '#F9FAFB',
            cornerRadius: 'md',
            paddingAll: 'sm',
          },
        ];
      })
    : [{ type: 'text', text: 'ยังไม่มีค่าใช้จ่ายประจำเดือน', size: 'sm', color: '#9CA3AF', align: 'center' }];

  // Summary row
  const summaryRow: any = {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `จ่ายแล้ว ${paidCount}/${totalCount}`, size: 'xs', color: '#6B7280', flex: 1 },
      { type: 'text', text: `คงเหลือ ฿${formatCurrency(remainingAmount)}`, size: 'xs', color: '#EF4444', align: 'end', weight: 'bold' },
    ],
    backgroundColor: '#F3F4F6',
    cornerRadius: 'md',
    paddingAll: 'sm',
  };

  const hasPayable = items.some((i) => i.status !== 'paid');

  const footerButtons: any[] = [];
  if (hasPayable) {
    footerButtons.push(
      createButton('✅ ชำระ', JSON.stringify({ action: 'recurring_menu' }), 'primary', '#10B981')
    );
  }
  footerButtons.push(
    createButton('➕ เพิ่มรายการ', JSON.stringify({ action: 'recurring_add' }), 'secondary')
  );

  return createBubble({
    header: createHeader('ค่าใช้จ่ายประจำเดือน', displayMonth, '📅'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        ...itemRows,
        createSpacer('sm'),
        createSeparator(),
        createSpacer('sm'),
        summaryRow,
      ],
      paddingAll: 'lg',
      spacing: 'none' as any,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: footerButtons,
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  });
}

// ===== Bubble 3: Savings (Piggy Bank) =====

function savingsBubble(
  thisMonthBalance: number,
  accumulatedBalance: number,
  theme: ThemeColors,
  displayMonth: string
): any {
  const totalSavings = thisMonthBalance + accumulatedBalance;

  const balanceColor = (v: number) => v >= 0 ? '#10B981' : '#EF4444';
  const balanceBg = (v: number) => v >= 0 ? '#D1FAE5' : '#FEE2E2';
  const sign = (v: number) => v >= 0 ? '+' : '';

  return createBubble({
    header: createHeader('กระปุกออมสิน', displayMonth, '🏦'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        // Total savings (hero)
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '🏦', size: '3xl', align: 'center' },
            createSpacer('sm'),
            { type: 'text', text: 'ยอดสะสมรวม', size: 'xs', color: '#6B7280', align: 'center' },
            {
              type: 'text',
              text: `฿${formatCurrency(totalSavings)}`,
              size: 'xxl',
              weight: 'bold',
              color: balanceColor(totalSavings),
              align: 'center',
            },
          ],
          backgroundColor: balanceBg(totalSavings),
          cornerRadius: 'lg',
          paddingAll: 'lg',
        },
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        // This month
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📅 เดือนนี้', size: 'xxs', color: '#6B7280', align: 'center' },
                {
                  type: 'text',
                  text: `${sign(thisMonthBalance)}฿${formatCurrency(Math.abs(thisMonthBalance))}`,
                  size: 'sm',
                  weight: 'bold',
                  color: balanceColor(thisMonthBalance),
                  align: 'center',
                },
                { type: 'text', text: 'หลังหักรายจ่ายแล้ว', size: 'xxs', color: '#9CA3AF', align: 'center', wrap: true },
              ],
              flex: 1,
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📦 ยกมา', size: 'xxs', color: '#6B7280', align: 'center' },
                {
                  type: 'text',
                  text: `฿${formatCurrency(accumulatedBalance)}`,
                  size: 'sm',
                  weight: 'bold',
                  color: balanceColor(accumulatedBalance),
                  align: 'center',
                },
                { type: 'text', text: 'สะสมเดือนก่อนๆ', size: 'xxs', color: '#9CA3AF', align: 'center', wrap: true },
              ],
              flex: 1,
            },
          ],
          spacing: 'md',
        },
        createSpacer('md'),
        // Explanation
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: '💡 คำนวณจากรายรับ - รายจ่ายที่เกิดขึ้นแล้ว', size: 'xxs', color: '#9CA3AF', align: 'center', wrap: true },
            { type: 'text', text: '(ไม่รวมค่าใช้จ่ายประจำที่ยังมาไม่ถึง)', size: 'xxs', color: '#9CA3AF', align: 'center', wrap: true },
          ],
        },
      ],
      paddingAll: 'lg',
      spacing: 'none' as any,
    },
    theme,
  });
}

// ===== Bubble 4: Daily Summary =====

function dailySummaryBubble(
  dailySummary: { total_income: number; total_expense: number },
  recentTransactions: (Transaction & { categories: { name: string; icon: string } | null })[],
  theme: ThemeColors,
  todayDate: string
): any {
  const displayDate = formatThaiDate(todayDate);

  // Transaction list rows
  const transactionRows: any[] = recentTransactions.length > 0
    ? recentTransactions.flatMap((tx, i) => {
        const icon = tx.categories?.icon || '📌';
        const name = tx.description || tx.categories?.name || 'ไม่ระบุ';
        const isIncome = tx.type === 'income';
        const amountText = `${isIncome ? '+' : '-'}฿${formatCurrency(Number(tx.amount))}`;
        const amountColor = isIncome ? '#10B981' : '#EF4444';

        return [
          ...(i > 0 ? [createSpacer('xs')] : []),
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: icon, size: 'sm', flex: 0 },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: name, size: 'xs', color: '#1A1A2E', weight: 'bold' },
                  { type: 'text', text: formatThaiDate(tx.transaction_date), size: 'xxs', color: '#9CA3AF' },
                ],
                flex: 1,
              },
              {
                type: 'text',
                text: amountText,
                size: 'xs',
                weight: 'bold',
                color: amountColor,
                align: 'end',
                gravity: 'center',
              },
            ],
            spacing: 'sm',
            backgroundColor: '#F9FAFB',
            cornerRadius: 'md',
            paddingAll: 'sm',
          },
        ];
      })
    : [{ type: 'text', text: 'ยังไม่มีรายการ', size: 'sm', color: '#9CA3AF', align: 'center' }];

  return createBubble({
    header: createHeader('สรุปรายรับรายจ่ายประจำวัน', displayDate, '📊'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        // Income / Expense cards
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📥 รายรับวันนี้', size: 'xxs', color: '#6B7280', align: 'center' },
                { type: 'text', text: `฿${formatCurrency(dailySummary.total_income)}`, size: 'md', weight: 'bold', color: '#10B981', align: 'center' },
              ],
              backgroundColor: '#D1FAE5',
              cornerRadius: 'md',
              paddingAll: 'md',
              flex: 1,
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📤 รายจ่ายวันนี้', size: 'xxs', color: '#6B7280', align: 'center' },
                { type: 'text', text: `฿${formatCurrency(dailySummary.total_expense)}`, size: 'md', weight: 'bold', color: '#EF4444', align: 'center' },
              ],
              backgroundColor: '#FEE2E2',
              cornerRadius: 'md',
              paddingAll: 'md',
              flex: 1,
            },
          ],
          spacing: 'sm',
        },
        // Recent transactions
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        { type: 'text', text: '📋 รายการล่าสุด', size: 'xs', weight: 'bold', color: '#1A1A2E' },
        createSpacer('sm'),
        ...transactionRows,
      ],
      paddingAll: 'lg',
      spacing: 'none' as any,
    },
    theme,
  });
}

// ===== Public: Monthly Summary (carousel) =====

export function monthlySummaryMessage(
  summary: { total_income: number; total_expense: number; balance: number },
  categoryBreakdown: { category_name: string; icon: string; type: string; total: number }[],
  recurringItems: RecurringWithStatus[],
  theme: ThemeColors,
  year?: number,
  month?: number,
  accumulatedBalance?: number,
  dailySummaryData?: {
    dailySummary: { total_income: number; total_expense: number };
    recentTransactions: (Transaction & { categories: { name: string; icon: string } | null })[];
    todayDate: string;
  }
): any {
  const displayMonth = year && month ? getThaiMonthYear(year, month) : getCurrentThaiMonth();

  const bubbles: any[] = [];

  // Card 1: Daily summary
  if (dailySummaryData) {
    bubbles.push(dailySummaryBubble(
      dailySummaryData.dailySummary,
      dailySummaryData.recentTransactions,
      theme,
      dailySummaryData.todayDate
    ));
  }

  // Card 2: Summary
  bubbles.push(summaryBubble(summary, categoryBreakdown, theme, displayMonth));
  // Card 3: Recurring timeline
  bubbles.push(recurringTimelineBubble(recurringItems, theme, displayMonth));
  // Card 4: Savings
  bubbles.push(savingsBubble(summary.balance, accumulatedBalance ?? 0, theme, displayMonth));

  return createFlexMessage('สรุปรายรับรายจ่าย', {
    type: 'carousel',
    contents: bubbles,
  });
}

// ===== Public: Recurring Timeline (standalone) =====

export function recurringTimelineMessage(
  items: RecurringWithStatus[],
  theme: ThemeColors,
  year?: number,
  month?: number
): any {
  const displayMonth = year && month ? getThaiMonthYear(year, month) : getCurrentThaiMonth();
  return createFlexMessage('ค่าใช้จ่ายประจำเดือน', recurringTimelineBubble(items, theme, displayMonth));
}

// ===== AI Advice =====

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
            { type: 'text', text: advice.summary, size: 'sm', color: '#1A1A2E', wrap: true },
          ],
          backgroundColor: '#F0F9FF',
          cornerRadius: 'lg',
          paddingAll: 'lg',
        },
        createSpacer('md'),
        { type: 'text', text: '💡 คำแนะนำ', size: 'sm', weight: 'bold', color: '#1A1A2E' },
        createSpacer('sm'),
        ...tipItems,
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Error =====

export function errorMessage(text: string): any {
  return createFlexMessage('เกิดข้อผิดพลาด', createBubble({
    header: createHeader('เกิดข้อผิดพลาด', '', '❌'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text, size: 'sm', color: '#6B7280', align: 'center', wrap: true },
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
