import { ThemeColors } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createSpacer } from './flexMessages';
import { formatCurrency } from '../utils/formatters';
import { getMotivationalMessage } from './recurringFlex';

export function reminderMessage(
  items: { id: string; name: string; amount: number; due_day: number; is_variable: boolean; total_debt?: number | null }[],
  theme: ThemeColors
): any {
  if (items.length === 1) {
    return singleReminderMessage(items[0], theme);
  }

  const bubbles = items.map((item) => singleReminderBubble(item, theme));

  return createFlexMessage('แจ้งเตือนชำระเงิน', {
    type: 'carousel',
    contents: bubbles,
  });
}

function singleReminderBubble(
  item: { id: string; name: string; amount: number; due_day: number; is_variable: boolean; total_debt?: number | null },
  theme: ThemeColors
) {
  const isDebt = item.total_debt != null && Number(item.total_debt) > 0;

  let amountText: string;
  let subtitle: string;
  let refText: string | null = null;

  if (isDebt) {
    amountText = item.amount > 0 ? `฿${formatCurrency(item.amount)}` : 'ระบุยอดชำระ';
    subtitle = 'วันนี้ครบกำหนด · 💳 หนี้สิน';
    if (item.amount > 0) refText = '(ขั้นต่ำ/เดือน)';
  } else if (item.is_variable) {
    amountText = item.amount > 0 ? `~฿${formatCurrency(item.amount)}` : 'ยอดไม่คงที่';
    subtitle = 'วันนี้ครบกำหนด · ยอดไม่คงที่';
    if (item.amount > 0) refText = '(ยอดเดือนก่อน)';
    else refText = '(กดชำระเพื่อระบุยอด)';
  } else {
    amountText = `฿${formatCurrency(item.amount)}`;
    subtitle = 'วันนี้ครบกำหนดชำระ';
  }

  return createBubble({
    header: createHeader('แจ้งเตือนชำระเงิน 🔔', subtitle),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${isDebt ? '💳' : '📅'} ${item.name}`,
          size: 'lg',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        {
          type: 'text',
          text: amountText,
          size: 'xxl',
          weight: 'bold',
          color: '#FC8181',
          align: 'center',
        },
        ...(refText ? [{
          type: 'text' as const,
          text: refText,
          size: 'xxs' as const,
          color: '#A0AEC0',
          align: 'center' as const,
        }] : []),
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton(
          item.is_variable ? '✅ ชำระแล้ว (ระบุยอด)' : '✅ ชำระแล้ว',
          JSON.stringify({ action: 'reminder_paid', id: item.id }),
          'primary',
          '#68D391'
        ),
        createButton(
          '📅 เลื่อนจ่าย (ระบุวันที่)',
          JSON.stringify({ action: 'reminder_snooze_pick_date', id: item.id }),
          'secondary'
        ),
        createButton(
          '⏭️ ยกยอดไปเดือนหน้า',
          JSON.stringify({ action: 'reminder_postpone_next_month', id: item.id }),
          'secondary'
        ),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  });
}

function singleReminderMessage(
  item: { id: string; name: string; amount: number; due_day: number; is_variable: boolean; total_debt?: number | null },
  theme: ThemeColors
): any {
  return createFlexMessage('แจ้งเตือนชำระเงิน', singleReminderBubble(item, theme));
}

// Ask user to input payment amount (variable, debt, or fixed with edit option)
export function reminderAskAmountMessage(
  name: string,
  lastAmount: number,
  theme: ThemeColors,
  isFixed?: boolean
): any {
  const headerText = isFixed ? 'ยืนยัน/แก้ไขยอดชำระ 💰' : 'ระบุยอดชำระจริง 💰';
  const refLabel = isFixed ? 'ยอดประจำ' : 'ยอดเดือนก่อน';
  const hintText = isFixed
    ? `พิมพ์ยอดที่จ่ายจริง หรือกด "ยืนยันยอด" ด้านล่าง`
    : 'พิมพ์จำนวนเงิน เช่น 850';

  return createFlexMessage('ระบุยอดชำระ', createBubble({
    header: createHeader(headerText, ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        ...(lastAmount > 0 ? [{
          type: 'text' as const,
          text: `${refLabel}: ฿${formatCurrency(lastAmount)}`,
          size: 'xs' as const,
          color: '#718096',
          align: 'center' as const,
        }] : []),
        createSpacer('md'),
        {
          type: 'text',
          text: isFixed ? 'จ่ายยอดเดิมหรือแก้ไข?' : 'เดือนนี้จ่ายเท่าไหร่?',
          size: 'sm',
          color: '#718096',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: hintText,
          size: 'xxs',
          color: '#A0AEC0',
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
        ...(isFixed && lastAmount > 0 ? [
          createButton(
            `✅ ยืนยันยอด ฿${formatCurrency(lastAmount)}`,
            JSON.stringify({ action: 'reminder_confirm_fixed', amount: lastAmount }),
            'primary',
            '#68D391'
          ),
        ] : []),
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

export function reminderPaidMessage(
  name: string,
  amount: number,
  theme: ThemeColors,
  installment?: { current: number; total: number } | null,
): any {
  const installmentText = installment
    ? `งวดที่ ${installment.current}/${installment.total}`
    : null;
  const motivationalText = installment
    ? getMotivationalMessage(installment.current, installment.total)
    : null;

  return createFlexMessage('ชำระเรียบร้อย', createBubble({
    header: createHeader('ชำระเรียบร้อย! ✅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        {
          type: 'text',
          text: `฿${formatCurrency(amount)}`,
          size: 'xl',
          weight: 'bold',
          color: '#68D391',
          align: 'center',
        },
        ...(installmentText ? [{
          type: 'text' as const,
          text: installmentText,
          size: 'sm' as const,
          weight: 'bold' as const,
          color: '#F6C065',
          align: 'center' as const,
        }] : []),
        createSpacer('sm'),
        {
          type: 'text',
          text: 'บันทึกเป็นรายจ่ายเรียบร้อยแล้ว',
          size: 'xxs',
          color: '#718096',
          align: 'center',
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
                color: '#5A6578',
                align: 'center' as const,
                wrap: true,
              },
            ],
            backgroundColor: '#EBF4FF',
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

export function reminderSnoozedMessage(name: string, snoozeDate: string, theme: ThemeColors): any {
  return createFlexMessage('เลื่อนแจ้งเตือน', createBubble({
    header: createHeader('เลื่อนแจ้งเตือน ⏰', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `จะแจ้งเตือนอีกครั้งวันที่ ${snoozeDate}`,
          size: 'sm',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme,
  }));
}

export function reminderAskSnoozeDateMessage(name: string, dueDay: number, theme: ThemeColors): any {
  // Get remaining days in current month
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return createFlexMessage('เลือกวันที่เลื่อน', createBubble({
    header: createHeader('เลื่อนจ่าย 📅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `พิมพ์วันที่ในเดือนนี้ (${now.getDate()}-${lastDay})`,
          size: 'sm',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'เช่น พิมพ์ 25 เพื่อเลื่อนไปวันที่ 25',
          size: 'xxs',
          color: '#A0AEC0',
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

export function reminderPostponedMessage(name: string, nextMonthDate: string, theme: ThemeColors): any {
  return createFlexMessage('ยกยอดไปเดือนหน้า', createBubble({
    header: createHeader('ยกยอดเรียบร้อย ⏭️', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `ยกยอดไปแจ้งเตือนวันที่ ${nextMonthDate}`,
          size: 'sm',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
        createSpacer('xs'),
        {
          type: 'text',
          text: 'ระบบจะแจ้งเตือนอีกครั้งในเดือนหน้า',
          size: 'xxs',
          color: '#A0AEC0',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    theme,
  }));
}
