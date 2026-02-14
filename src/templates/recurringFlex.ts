import { RecurringExpense, ThemeColors } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createTextRow, createSeparator, createSpacer } from './flexMessages';
import { formatCurrency } from '../utils/formatters';
import { THAI_MONTHS } from '../utils/constants';

// ===== Helper =====

function formatEndMonth(endMonth: string | null): string {
  if (!endMonth) return 'ไม่มี (จ่ายตลอด)';
  const [y, m] = endMonth.split('-');
  return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function amountTypeLabel(isVariable: boolean, isDebt?: boolean): string {
  if (isDebt) return '💳 หนี้สิน/บัตรเครดิต';
  return isVariable ? '📊 ไม่เท่ากันทุกเดือน' : '💵 คงที่ทุกเดือน';
}

function createDebtProgressBar(totalDebt: number, totalPaid: number): any[] {
  const remaining = Math.max(totalDebt - totalPaid, 0);
  const paidPercent = totalDebt > 0 ? Math.min(Math.round((totalPaid / totalDebt) * 100), 100) : 0;
  const remainPercent = 100 - paidPercent;

  return [
    {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: '💳 ยอดหนี้', size: 'xxs', color: '#6B7280', flex: 1 },
            { type: 'text', text: `฿${formatCurrency(totalDebt)}`, size: 'xxs', color: '#1A1A2E', align: 'end', weight: 'bold' },
          ],
        },
        createSpacer('xs'),
        // Progress bar
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            ...(paidPercent > 0 ? [{
              type: 'box' as const,
              layout: 'vertical' as const,
              contents: [] as any[],
              backgroundColor: '#10B981',
              height: '10px',
              flex: paidPercent || 1,
            }] : []),
            ...(remainPercent > 0 ? [{
              type: 'box' as const,
              layout: 'vertical' as const,
              contents: [] as any[],
              backgroundColor: '#E5E7EB',
              height: '10px',
              flex: remainPercent || 1,
            }] : []),
          ],
          cornerRadius: 'md',
        },
        createSpacer('xs'),
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: `จ่ายแล้ว ฿${formatCurrency(totalPaid)}`, size: 'xxs', color: '#10B981', flex: 1 },
            { type: 'text', text: `คงเหลือ ฿${formatCurrency(remaining)}`, size: 'xxs', color: '#EF4444', align: 'end' },
          ],
        },
        {
          type: 'text',
          text: `${paidPercent}%`,
          size: 'xs',
          weight: 'bold',
          color: paidPercent >= 100 ? '#10B981' : '#F59E0B',
          align: 'center',
        },
      ],
      backgroundColor: '#F9FAFB',
      cornerRadius: 'lg',
      paddingAll: 'md',
    },
  ];
}

function getDebtMotivationalMessage(totalDebt: number, totalPaid: number): string {
  const paidPercent = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;
  const remaining = Math.max(totalDebt - totalPaid, 0);

  if (paidPercent >= 100) {
    return 'หมดหนี้แล้ว! ยินดีด้วย! 🎊🎉';
  }
  if (paidPercent >= 75) {
    return `เหลืออีกแค่ ฿${formatCurrency(remaining)} ใกล้หมดแล้ว! 🏆`;
  }
  if (paidPercent >= 50) {
    return `ผ่านครึ่งทางแล้ว! เหลือ ฿${formatCurrency(remaining)} สู้ต่อไป! 💪`;
  }
  if (paidPercent > 0) {
    return `เริ่มต้นดีแล้ว! จ่ายไป ${Math.round(paidPercent)}% ค่อยๆ ไป! 🎯`;
  }
  return 'เริ่มต้นวันนี้ ทุกก้าวมีความหมาย! ✨';
}

function getCurrentYM(): string {
  const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
  const bkk = new Date(s);
  return `${bkk.getFullYear()}-${String(bkk.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateInstallmentInfo(
  createdYM: string,
  endMonth: string
): { current: number; total: number } {
  const currentYM = getCurrentYM();
  const [sy, sm] = createdYM.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const [cy, cm] = currentYM.split('-').map(Number);

  const total = (ey - sy) * 12 + (em - sm) + 1;
  const current = Math.min((cy - sy) * 12 + (cm - sm) + 1, total);

  return { current: Math.max(current, 1), total: Math.max(total, 1) };
}

export function getMotivationalMessage(current: number, total: number): string {
  const remaining = total - current;

  if (current === 1 && total > 1) {
    const msgs = [
      `เริ่มงวดแรกแล้ว! อีก ${remaining} งวดก็ครบ สู้ๆ นะ! 💪`,
      `ก้าวแรกเริ่มแล้ว! เหลืออีกแค่ ${remaining} งวด ไปด้วยกัน! ✨`,
      `เส้นทาง ${total} งวดเริ่มต้นแล้ว ค่อยๆ ไปทีละก้าว! 🚀`,
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  if (current === total) {
    return 'งวดสุดท้ายแล้ว! ยินดีด้วย ผ่านมาได้สำเร็จ! 🎊';
  }

  if (remaining <= 3) {
    return `เหลืออีกแค่ ${remaining} งวด ใกล้ถึงเส้นชัยแล้ว! 🏆`;
  }

  if (current / total >= 0.5) {
    return `ผ่านมาเกินครึ่งแล้ว เหลือ ${remaining} งวด สู้ต่อไป! 💪`;
  }

  return `ผ่านมา ${current} งวดแล้ว เหลืออีก ${remaining} งวด ค่อยๆ ไป เดี๋ยวก็หมด! 🎯`;
}

// ===== Menu =====

export function recurringMenuMessage(items: RecurringExpense[], theme: ThemeColors): any {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

  const itemComponents: any[] = items.length > 0
    ? items.flatMap((item, i) => {
        const isDebt = item.total_debt != null && Number(item.total_debt) > 0;
        const icon = isDebt ? '💳' : item.is_variable ? '📊' : '💵';

        // Debt item: show mini progress bar
        if (isDebt) {
          const totalDebt = Number(item.total_debt);
          const totalPaid = Number(item.total_paid || 0);
          const paidPercent = Math.min(Math.round((totalPaid / totalDebt) * 100), 100);
          const remaining = Math.max(totalDebt - totalPaid, 0);

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
                    {
                      type: 'text',
                      text: `${icon} ${item.name}`,
                      size: 'sm',
                      weight: 'bold',
                      color: '#1A1A2E',
                      flex: 1,
                    },
                    {
                      type: 'text',
                      text: `฿${formatCurrency(remaining)}`,
                      size: 'sm',
                      weight: 'bold',
                      color: '#EF4444',
                      align: 'end',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    ...(paidPercent > 0 ? [{
                      type: 'box' as const, layout: 'vertical' as const, contents: [] as any[],
                      backgroundColor: '#10B981', height: '6px', flex: paidPercent || 1,
                    }] : []),
                    ...(100 - paidPercent > 0 ? [{
                      type: 'box' as const, layout: 'vertical' as const, contents: [] as any[],
                      backgroundColor: '#E5E7EB', height: '6px', flex: (100 - paidPercent) || 1,
                    }] : []),
                  ],
                  cornerRadius: 'md',
                  margin: 'xs',
                },
                {
                  type: 'text',
                  text: `วันที่ ${item.due_day} · จ่ายแล้ว ${paidPercent}%`,
                  size: 'xxs',
                  color: '#9CA3AF',
                  margin: 'xs',
                },
              ],
              backgroundColor: '#F9FAFB',
              cornerRadius: 'md',
              paddingAll: 'md',
              action: {
                type: 'postback',
                label: item.name,
                data: JSON.stringify({ action: 'recurring_edit', id: item.id }),
              },
            },
          ];
        }

        // Regular/Variable item
        return [
          ...(i > 0 ? [createSpacer('xs')] : []),
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `${icon} ${item.name}`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#1A1A2E',
                  },
                  {
                    type: 'text',
                    text: `วันที่ ${item.due_day}${item.end_month ? ` · ถึง ${formatEndMonth(item.end_month)}` : ''}`,
                    size: 'xxs',
                    color: '#9CA3AF',
                  },
                ],
                flex: 1,
              },
              {
                type: 'text',
                text: item.is_variable
                  ? `~฿${formatCurrency(Number(item.amount))}`
                  : `฿${formatCurrency(Number(item.amount))}`,
                size: 'sm',
                weight: 'bold',
                color: '#EF4444',
                align: 'end',
                gravity: 'center',
              },
            ],
            backgroundColor: '#F9FAFB',
            cornerRadius: 'md',
            paddingAll: 'md',
            action: {
              type: 'postback',
              label: item.name,
              data: JSON.stringify({ action: 'recurring_edit', id: item.id }),
            },
          },
        ];
      })
    : [{
        type: 'text',
        text: 'ยังไม่มีค่าใช้จ่ายประจำเดือน',
        size: 'sm',
        color: '#9CA3AF',
        align: 'center',
        style: 'italic',
      }];

  return createFlexMessage('ค่าใช้จ่ายประจำเดือน', createBubble({
    header: createHeader('ค่าใช้จ่ายประจำเดือน', `รวม ฿${formatCurrency(totalAmount)}`, '📅'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: itemComponents,
      paddingAll: 'lg',
      spacing: 'sm',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('➕ เพิ่มรายการใหม่', JSON.stringify({ action: 'recurring_add' }), 'primary', theme.primary),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Step 1: Ask Name =====

export function recurringAskNameMessage(theme: ThemeColors): any {
  return createFlexMessage('เพิ่มค่าใช้จ่ายประจำ', createBubble({
    header: createHeader('เพิ่มค่าใช้จ่ายประจำ', 'ขั้นตอนที่ 1/5', '➕'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'ชื่อค่าใช้จ่ายคืออะไร?',
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'เช่น ค่าเช่าบ้าน, ค่าผ่อนรถ, ค่าไฟ, Netflix',
          size: 'xs',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Step 2: Ask Amount Type (fixed/variable) =====

export function recurringAskAmountTypeMessage(name: string, theme: ThemeColors): any {
  return createFlexMessage('ประเภทยอดเงิน', createBubble({
    header: createHeader('เพิ่มค่าใช้จ่ายประจำ', 'ขั้นตอนที่ 2/5', '💰'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: name,
          size: 'lg',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('md'),
        {
          type: 'text',
          text: 'ยอดเท่ากันทุกเดือนไหม?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton(
          '💵 คงที่ทุกเดือน',
          JSON.stringify({ action: 'recurring_amount_type', is_variable: false }),
          'primary',
          theme.primary
        ),
        {
          type: 'text',
          text: 'เช่น ค่าผ่อนรถ, Netflix, ค่าเช่า',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
        createSpacer('sm'),
        createButton(
          '📊 ไม่เท่ากันทุกเดือน',
          JSON.stringify({ action: 'recurring_amount_type', is_variable: true }),
          'secondary'
        ),
        {
          type: 'text',
          text: 'เช่น ค่าไฟ, ค่าน้ำ, ค่าโทรศัพท์',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
        createSpacer('sm'),
        createButton(
          '💳 หนี้สิน/บัตรเครดิต',
          JSON.stringify({ action: 'recurring_amount_type_debt' }),
          'secondary'
        ),
        {
          type: 'text',
          text: 'มียอดหนี้รวม จ่ายแต่ละเดือนไม่เท่ากัน',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
      spacing: 'xs',
    },
    theme,
  }));
}

// ===== Step 3: Ask Amount =====

export function recurringAskAmountMessage(name: string, isVariable: boolean, theme: ThemeColors): any {
  return createFlexMessage('ระบุจำนวนเงิน', createBubble({
    header: createHeader('เพิ่มค่าใช้จ่ายประจำ', 'ขั้นตอนที่ 3/5', '💰'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createTextRow('ชื่อ', name),
        createSpacer('xs'),
        createTextRow('ประเภทยอด', amountTypeLabel(isVariable)),
        createSpacer('md'),
        {
          type: 'text',
          text: isVariable
            ? 'ยอดโดยประมาณเท่าไหร่? (บาท)'
            : 'จำนวนเงินต่อเดือนเท่าไหร่? (บาท)',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: isVariable
            ? 'พิมพ์ตัวเลข เช่น 800 (หรือ 0 ถ้าไม่ทราบ)'
            : 'พิมพ์ตัวเลข เช่น 5000',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme,
  }));
}

// ===== Step 4: Ask Due Day =====

export function recurringAskDueDayMessage(name: string, amount: number, isVariable: boolean, theme: ThemeColors): any {
  return createFlexMessage('ระบุวันครบกำหนด', createBubble({
    header: createHeader('เพิ่มค่าใช้จ่ายประจำ', 'ขั้นตอนที่ 4/5', '📆'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createTextRow('ชื่อ', name),
        createSpacer('xs'),
        createTextRow('จำนวน', amount > 0
          ? `${isVariable ? '~' : ''}฿${formatCurrency(amount)}`
          : 'ไม่ระบุ'),
        createSpacer('md'),
        {
          type: 'text',
          text: 'ครบกำหนดชำระวันที่เท่าไหร่?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'พิมพ์ตัวเลข 1-31',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    theme,
  }));
}

// ===== Step 5: Ask End Month =====

export function recurringAskEndMonthMessage(name: string, theme: ThemeColors): any {
  return createFlexMessage('วันสิ้นสุด', createBubble({
    header: createHeader('เพิ่มค่าใช้จ่ายประจำ', 'ขั้นตอนที่ 5/5', '🏁'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'มีวันสิ้นสุดไหม?',
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'ถ้ามีวันสิ้นสุด ให้พิมพ์ เดือน/ปี\nเช่น 12/2027 หรือ 12/2570',
          size: 'xs',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton(
          '♾️ ไม่มี จ่ายตลอด',
          JSON.stringify({ action: 'recurring_end_month_none' }),
          'primary',
          theme.primary
        ),
        createSpacer('xs'),
        {
          type: 'text',
          text: 'หรือพิมพ์เดือนสิ้นสุด เช่น 12/2027 หรือ 12/2570',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Confirm =====

export function recurringConfirmMessage(
  data: Record<string, any>,
  endMonth: string | null,
  theme: ThemeColors
): any {
  // Debt items use separate confirm UI
  if (data.is_debt) {
    return debtConfirmMessage(data, theme);
  }

  const isVariable = data.is_variable || false;
  const amount = data.amount || 0;

  return createFlexMessage('ยืนยันค่าใช้จ่ายประจำ', createBubble({
    header: createHeader('ยืนยันรายการ', '', '✏️'),
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
              text: data.name,
              size: 'lg',
              weight: 'bold',
              color: '#1A1A2E',
              align: 'center',
            },
            {
              type: 'text',
              text: amount > 0
                ? `${isVariable ? '~' : ''}฿${formatCurrency(amount)} / เดือน`
                : 'ยอดไม่คงที่ (ระบุตอนชำระ)',
              size: 'xl',
              weight: 'bold',
              color: '#EF4444',
              align: 'center',
              wrap: true,
            },
          ],
          backgroundColor: '#FEE2E2',
          cornerRadius: 'lg',
          paddingAll: 'lg',
          spacing: 'sm',
        },
        createSpacer('md'),
        createTextRow('ประเภทยอด', amountTypeLabel(isVariable)),
        createSpacer('xs'),
        createTextRow('วันครบกำหนด', `ทุกวันที่ ${data.due_day}`),
        createSpacer('xs'),
        createTextRow('สิ้นสุด', formatEndMonth(endMonth)),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
        createButton('✅ ยืนยัน', JSON.stringify({ action: 'recurring_confirm_add' }), 'primary', theme.primary),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Success =====

export function recurringSuccessMessage(data: Record<string, any>, theme: ThemeColors): any {
  // Debt items use separate success UI
  if (data.is_debt) {
    return debtSuccessMessage(data, theme);
  }

  const isVariable = data.is_variable || false;
  const amount = data.amount || 0;
  const endMonth = data.end_month || null;

  // Calculate installment info for items with end date
  let installmentText: string | null = null;
  let motivationalText: string | null = null;
  if (endMonth) {
    const currentYM = getCurrentYM();
    const { current, total } = calculateInstallmentInfo(currentYM, endMonth);
    installmentText = `งวดที่ ${current}/${total}`;
    motivationalText = getMotivationalMessage(current, total);
  }

  return createFlexMessage('เพิ่มสำเร็จ!', createBubble({
    header: createHeader('เพิ่มสำเร็จ! ✅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${data.name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        {
          type: 'text',
          text: amount > 0
            ? `${isVariable ? '~' : ''}฿${formatCurrency(amount)} / เดือน`
            : 'ยอดไม่คงที่',
          size: 'lg',
          weight: 'bold',
          color: '#EF4444',
          align: 'center',
        },
        ...(installmentText ? [{
          type: 'text' as const,
          text: installmentText,
          size: 'sm' as const,
          weight: 'bold' as const,
          color: '#F59E0B',
          align: 'center' as const,
        }] : []),
        {
          type: 'text',
          text: `แจ้งเตือนทุกวันที่ ${data.due_day}${endMonth ? ` · ถึง ${formatEndMonth(endMonth)}` : ''}`,
          size: 'xs',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
        ...(motivationalText ? [
          createSpacer('sm'),
          {
            type: 'box' as const,
            layout: 'vertical' as const,
            contents: [
              {
                type: 'text' as const,
                text: `🤖 ${motivationalText}`,
                size: 'xs' as const,
                color: '#4B5563',
                align: 'center' as const,
                wrap: true,
              },
            ],
            backgroundColor: '#F0F9FF',
            cornerRadius: 'md',
            paddingAll: 'md',
          },
        ] : []),
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Edit =====

export function recurringEditMessage(item: RecurringExpense, theme: ThemeColors): any {
  // Debt items use separate edit UI with progress bar
  const isDebt = item.total_debt != null && Number(item.total_debt) > 0;
  if (isDebt) {
    return debtEditMessage(item, theme);
  }

  return createFlexMessage('จัดการค่าใช้จ่าย', createBubble({
    header: createHeader(item.name, `${item.is_variable ? '~' : ''}฿${formatCurrency(Number(item.amount))} / เดือน`, '⚙️'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createTextRow('ชื่อ', item.name),
        createSpacer('xs'),
        createTextRow('จำนวน', Number(item.amount) > 0
          ? `${item.is_variable ? '~' : ''}฿${formatCurrency(Number(item.amount))}`
          : 'ยอดไม่คงที่'),
        createSpacer('xs'),
        createTextRow('ประเภทยอด', amountTypeLabel(item.is_variable)),
        createSpacer('xs'),
        createTextRow('วันครบกำหนด', `วันที่ ${item.due_day}`),
        createSpacer('xs'),
        createTextRow('สิ้นสุด', formatEndMonth(item.end_month)),
        createSpacer('xs'),
        createTextRow('สถานะ', item.is_active ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('🗑️ ลบรายการนี้', JSON.stringify({ action: 'recurring_delete', id: item.id }), 'primary', '#EF4444'),
        createButton('◀️ กลับ', JSON.stringify({ action: 'recurring_menu' }), 'secondary'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Debt: Ask Total Debt =====

export function debtAskTotalDebtMessage(name: string, theme: ThemeColors): any {
  return createFlexMessage('ระบุยอดหนี้', createBubble({
    header: createHeader('เพิ่มหนี้สิน', 'ขั้นตอนที่ 3/4', '💳'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createTextRow('ชื่อ', name),
        createSpacer('xs'),
        createTextRow('ประเภท', '💳 หนี้สิน/บัตรเครดิต'),
        createSpacer('md'),
        {
          type: 'text',
          text: 'ยอดหนี้ทั้งหมดเท่าไหร่? (บาท)',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'พิมพ์ตัวเลข เช่น 30000',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Debt: Confirm =====

export function debtConfirmMessage(data: Record<string, any>, theme: ThemeColors): any {
  const totalDebt = data.total_debt || 0;

  return createFlexMessage('ยืนยันหนี้สิน', createBubble({
    header: createHeader('ยืนยันรายการหนี้', '', '💳'),
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
              text: data.name,
              size: 'lg',
              weight: 'bold',
              color: '#1A1A2E',
              align: 'center',
            },
            {
              type: 'text',
              text: `ยอดหนี้ ฿${formatCurrency(totalDebt)}`,
              size: 'xl',
              weight: 'bold',
              color: '#EF4444',
              align: 'center',
              wrap: true,
            },
          ],
          backgroundColor: '#FEE2E2',
          cornerRadius: 'lg',
          paddingAll: 'lg',
          spacing: 'sm',
        },
        createSpacer('md'),
        createTextRow('ประเภท', '💳 หนี้สิน/บัตรเครดิต'),
        createSpacer('xs'),
        createTextRow('วันครบกำหนด', `ทุกวันที่ ${data.due_day}`),
        createSpacer('xs'),
        createTextRow('จ่ายต่อเดือน', 'ไม่คงที่ (ระบุตอนชำระ)'),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
        createButton('✅ ยืนยัน', JSON.stringify({ action: 'recurring_confirm_add' }), 'primary', theme.primary),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Debt: Success =====

export function debtSuccessMessage(data: Record<string, any>, theme: ThemeColors): any {
  const totalDebt = data.total_debt || 0;
  const motivational = getDebtMotivationalMessage(totalDebt, 0);

  return createFlexMessage('เพิ่มหนี้สำเร็จ!', createBubble({
    header: createHeader('เพิ่มสำเร็จ! ✅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `💳 ${data.name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        {
          type: 'text',
          text: `ยอดหนี้ ฿${formatCurrency(totalDebt)}`,
          size: 'lg',
          weight: 'bold',
          color: '#EF4444',
          align: 'center',
        },
        createSpacer('sm'),
        ...createDebtProgressBar(totalDebt, 0),
        createSpacer('sm'),
        {
          type: 'text',
          text: `แจ้งเตือนทุกวันที่ ${data.due_day}`,
          size: 'xs',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
        createSpacer('sm'),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `🤖 ${motivational}`,
              size: 'xs',
              color: '#4B5563',
              align: 'center',
              wrap: true,
            },
          ],
          backgroundColor: '#F0F9FF',
          cornerRadius: 'md',
          paddingAll: 'md',
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Debt: Edit (with progress bar + buttons) =====

export function debtEditMessage(item: RecurringExpense, theme: ThemeColors): any {
  const totalDebt = Number(item.total_debt || 0);
  const totalPaid = Number(item.total_paid || 0);
  const remaining = Math.max(totalDebt - totalPaid, 0);

  return createFlexMessage('จัดการหนี้สิน', createBubble({
    header: createHeader(item.name, `คงเหลือ ฿${formatCurrency(remaining)}`, '💳'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        ...createDebtProgressBar(totalDebt, totalPaid),
        createSpacer('md'),
        createTextRow('ชื่อ', item.name),
        createSpacer('xs'),
        createTextRow('ยอดหนี้รวม', `฿${formatCurrency(totalDebt)}`),
        createSpacer('xs'),
        createTextRow('จ่ายแล้ว', `฿${formatCurrency(totalPaid)}`),
        createSpacer('xs'),
        createTextRow('คงเหลือ', `฿${formatCurrency(remaining)}`),
        createSpacer('xs'),
        createTextRow('วันครบกำหนด', `วันที่ ${item.due_day}`),
        createSpacer('xs'),
        createTextRow('สถานะ', item.is_active ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('✏️ แก้ไขยอดหนี้รวม', JSON.stringify({ action: 'debt_update_balance', id: item.id }), 'primary', '#F59E0B'),
        createButton('➕ รูดบัตรเพิ่ม (เพิ่มยอดหนี้)', JSON.stringify({ action: 'debt_add_charge', id: item.id }), 'primary', '#EF4444'),
        createButton('🗑️ ลบรายการนี้', JSON.stringify({ action: 'recurring_delete', id: item.id }), 'secondary'),
        createButton('◀️ กลับ', JSON.stringify({ action: 'recurring_menu' }), 'secondary'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Debt: Ask Update Balance =====

export function debtAskUpdateBalanceMessage(name: string, currentDebt: number, theme: ThemeColors): any {
  return createFlexMessage('แก้ไขยอดหนี้', createBubble({
    header: createHeader('แก้ไขยอดหนี้รวม', '', '✏️'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `💳 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `ยอดหนี้ปัจจุบัน: ฿${formatCurrency(currentDebt)}`,
          size: 'sm',
          color: '#EF4444',
          align: 'center',
          weight: 'bold',
        },
        createSpacer('md'),
        {
          type: 'text',
          text: 'พิมพ์ยอดหนี้รวมใหม่ (บาท)',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'พิมพ์ตัวเลข เช่น 35000',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Debt: Ask Add Charge =====

export function debtAskAddChargeMessage(name: string, currentDebt: number, theme: ThemeColors): any {
  return createFlexMessage('เพิ่มยอดหนี้', createBubble({
    header: createHeader('รูดบัตรเพิ่ม', '', '💳'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `💳 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `ยอดหนี้ปัจจุบัน: ฿${formatCurrency(currentDebt)}`,
          size: 'sm',
          color: '#EF4444',
          align: 'center',
          weight: 'bold',
        },
        createSpacer('md'),
        {
          type: 'text',
          text: 'รูดเพิ่มเท่าไหร่? (บาท)',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'พิมพ์ตัวเลข เช่น 5000',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
      ],
      paddingAll: 'lg',
    },
    theme,
  }));
}

// ===== Debt: Balance Updated =====

export function debtBalanceUpdatedMessage(
  name: string,
  newTotalDebt: number,
  totalPaid: number,
  theme: ThemeColors,
  isAddCharge?: boolean
): any {
  const remaining = Math.max(newTotalDebt - totalPaid, 0);
  const motivational = getDebtMotivationalMessage(newTotalDebt, totalPaid);

  return createFlexMessage(isAddCharge ? 'เพิ่มยอดหนี้' : 'อัพเดทยอดหนี้', createBubble({
    header: createHeader(
      isAddCharge ? 'เพิ่มยอดหนี้แล้ว' : 'อัพเดทยอดหนี้แล้ว',
      '',
      isAddCharge ? '💳' : '✏️'
    ),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `💳 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        ...createDebtProgressBar(newTotalDebt, totalPaid),
        createSpacer('sm'),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `🤖 ${motivational}`,
              size: 'xs',
              color: '#4B5563',
              align: 'center',
              wrap: true,
            },
          ],
          backgroundColor: '#F0F9FF',
          cornerRadius: 'md',
          paddingAll: 'md',
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Debt: Paid Message =====

export function debtPaidMessage(
  name: string,
  paidAmount: number,
  totalDebt: number,
  totalPaid: number,
  theme: ThemeColors
): any {
  const motivational = getDebtMotivationalMessage(totalDebt, totalPaid);

  return createFlexMessage('ชำระหนี้เรียบร้อย', createBubble({
    header: createHeader('ชำระเรียบร้อย! ✅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `💳 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        {
          type: 'text',
          text: `จ่าย ฿${formatCurrency(paidAmount)}`,
          size: 'xl',
          weight: 'bold',
          color: '#10B981',
          align: 'center',
        },
        createSpacer('sm'),
        ...createDebtProgressBar(totalDebt, totalPaid),
        createSpacer('sm'),
        {
          type: 'text',
          text: 'บันทึกเป็นรายจ่ายเรียบร้อยแล้ว',
          size: 'xxs',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `🤖 ${motivational}`,
              size: 'xs',
              color: '#4B5563',
              align: 'center',
              wrap: true,
            },
          ],
          backgroundColor: '#F0F9FF',
          cornerRadius: 'md',
          paddingAll: 'md',
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Delete Confirm =====

export function recurringDeleteConfirmMessage(item: RecurringExpense, theme: ThemeColors): any {
  return createFlexMessage('ยืนยันลบ', createBubble({
    header: createHeader('ยืนยันการลบ', '', '⚠️'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `ต้องการลบ "${item.name}" หรือไม่?`,
          size: 'sm',
          color: '#1A1A2E',
          align: 'center',
          wrap: true,
        },
        {
          type: 'text',
          text: 'การลบจะไม่สามารถกู้คืนได้',
          size: 'xxs',
          color: '#EF4444',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('◀️ ยกเลิก', JSON.stringify({ action: 'recurring_menu' }), 'secondary'),
        createButton('🗑️ ลบเลย', JSON.stringify({ action: 'recurring_confirm_delete', id: item.id }), 'primary', '#EF4444'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}
