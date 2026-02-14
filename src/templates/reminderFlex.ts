import { RecurringExpense, ThemeColors } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createSpacer } from './flexMessages';
import { formatCurrency } from '../utils/formatters';
import { getMotivationalMessage } from './recurringFlex';

export function reminderMessage(
  items: { id: string; name: string; amount: number; due_day: number; is_variable: boolean }[],
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
  item: { id: string; name: string; amount: number; due_day: number; is_variable: boolean },
  theme: ThemeColors
) {
  const amountText = item.is_variable
    ? (item.amount > 0 ? `~฿${formatCurrency(item.amount)}` : 'ยอดไม่คงที่')
    : `฿${formatCurrency(item.amount)}`;

  const subtitle = item.is_variable
    ? 'วันนี้ครบกำหนด · ยอดไม่คงที่'
    : 'วันนี้ครบกำหนดชำระ';

  return createBubble({
    header: createHeader('แจ้งเตือนชำระเงิน 🔔', subtitle),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${item.name}`,
          size: 'lg',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        {
          type: 'text',
          text: amountText,
          size: 'xxl',
          weight: 'bold',
          color: '#EF4444',
          align: 'center',
        },
        ...(item.is_variable ? [{
          type: 'text' as const,
          text: item.amount > 0 ? '(ยอดเดือนก่อน)' : '(กดชำระเพื่อระบุยอด)',
          size: 'xxs' as const,
          color: '#9CA3AF',
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
          '#10B981'
        ),
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            createButton('1 วัน', JSON.stringify({ action: 'reminder_snooze', id: item.id, days: 1 }), 'secondary'),
            createButton('3 วัน', JSON.stringify({ action: 'reminder_snooze', id: item.id, days: 3 }), 'secondary'),
            createButton('5 วัน', JSON.stringify({ action: 'reminder_snooze', id: item.id, days: 5 }), 'secondary'),
          ],
          spacing: 'sm',
        },
        {
          type: 'text',
          text: '⏰ เลื่อนการแจ้งเตือน',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  });
}

function singleReminderMessage(
  item: { id: string; name: string; amount: number; due_day: number; is_variable: boolean },
  theme: ThemeColors
): any {
  return createFlexMessage('แจ้งเตือนชำระเงิน', singleReminderBubble(item, theme));
}

// Variable amount: ask user to input actual amount
export function reminderAskAmountMessage(name: string, lastAmount: number, theme: ThemeColors): any {
  return createFlexMessage('ระบุยอดชำระ', createBubble({
    header: createHeader('ระบุยอดชำระจริง 💰', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `📅 ${name}`,
          size: 'md',
          weight: 'bold',
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        ...(lastAmount > 0 ? [{
          type: 'text' as const,
          text: `ยอดเดือนก่อน: ฿${formatCurrency(lastAmount)}`,
          size: 'xs' as const,
          color: '#6B7280',
          align: 'center' as const,
        }] : []),
        createSpacer('md'),
        {
          type: 'text',
          text: 'เดือนนี้จ่ายเท่าไหร่?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'พิมพ์จำนวนเงิน เช่น 850',
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
          color: '#1A1A2E',
          align: 'center',
        },
        {
          type: 'text',
          text: `฿${formatCurrency(amount)}`,
          size: 'xl',
          weight: 'bold',
          color: '#10B981',
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
        createSpacer('sm'),
        {
          type: 'text',
          text: 'บันทึกเป็นรายจ่ายเรียบร้อยแล้ว',
          size: 'xxs',
          color: '#6B7280',
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

export function reminderSnoozedMessage(name: string, days: number, theme: ThemeColors): any {
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
          color: '#1A1A2E',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: `จะแจ้งเตือนอีกครั้งใน ${days} วัน`,
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    theme,
  }));
}
