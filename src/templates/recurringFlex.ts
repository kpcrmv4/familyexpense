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

function amountTypeLabel(isVariable: boolean): string {
  return isVariable ? '📊 ไม่เท่ากันทุกเดือน' : '💵 คงที่ทุกเดือน';
}

// ===== Menu =====

export function recurringMenuMessage(items: RecurringExpense[], theme: ThemeColors): any {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

  const itemComponents: any[] = items.length > 0
    ? items.flatMap((item, i) => [
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
                  text: `${item.is_variable ? '📊' : '💵'} ${item.name}`,
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
      ])
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
          text: 'ถ้ามีวันสิ้นสุด ให้พิมพ์ เดือน/ปี\nเช่น 12/2027',
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
          text: 'หรือพิมพ์เดือนสิ้นสุด เช่น 12/2027',
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
  const isVariable = data.is_variable || false;
  const amount = data.amount || 0;
  const endMonth = data.end_month || null;

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
        {
          type: 'text',
          text: `แจ้งเตือนทุกวันที่ ${data.due_day}${endMonth ? ` · ถึง ${formatEndMonth(endMonth)}` : ''}`,
          size: 'xs',
          color: '#6B7280',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Edit =====

export function recurringEditMessage(item: RecurringExpense, theme: ThemeColors): any {
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
