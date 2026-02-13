import { Category, ThemeColors, TransactionDraft } from '../types';
import { createFlexMessage, createBubble, createHeader, createButton, createTextRow, createSeparator, createSpacer } from './flexMessages';
import { getGenderTheme, getTransactionColors } from '../utils/themeColors';
import { formatCurrency, formatThaiDate } from '../utils/formatters';

export function selectTypeMessage(draft: TransactionDraft, theme: ThemeColors): any {
  return createFlexMessage('เลือกประเภท', createBubble({
    header: createHeader('เลือกประเภทรายการ', '', '📋'),
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
              text: draft.description,
              size: 'md',
              weight: 'bold',
              color: '#1A1A2E',
            },
            {
              type: 'text',
              text: `฿${formatCurrency(draft.amount)}`,
              size: 'xxl',
              weight: 'bold',
              color: theme.primary,
            },
          ],
          backgroundColor: '#F9FAFB',
          cornerRadius: 'lg',
          paddingAll: 'lg',
          spacing: 'sm',
          alignItems: 'center',
        },
        createSpacer('md'),
        {
          type: 'text',
          text: 'รายการนี้เป็นรายรับหรือรายจ่าย?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('📤 รายจ่าย', JSON.stringify({ action: 'select_type', type: 'expense' }), 'primary', '#EF4444'),
        createButton('📥 รายรับ', JSON.stringify({ action: 'select_type', type: 'income' }), 'primary', '#10B981'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

export function selectCategoryMessage(
  draft: TransactionDraft,
  categories: Category[],
  theme: ThemeColors
): any {
  const txColors = getTransactionColors(draft.type!);
  const categoryButtons = categories.map((cat) =>
    createButton(
      `${cat.icon} ${cat.name}`,
      JSON.stringify({ action: 'select_category', category_id: cat.id, category_name: cat.name }),
      cat.name === draft.suggested_category ? 'primary' : 'secondary',
      cat.name === draft.suggested_category ? theme.primary : undefined
    )
  );

  // Split into rows of 2
  const rows: any[] = [];
  for (let i = 0; i < categoryButtons.length; i += 2) {
    const row = {
      type: 'box' as const,
      layout: 'horizontal' as const,
      contents: categoryButtons.slice(i, i + 2),
      spacing: 'sm' as const,
    };
    // If odd number, add a filler
    if (i + 1 >= categoryButtons.length) {
      row.contents.push({ type: 'filler' as any });
    }
    rows.push(row);
  }

  return createFlexMessage('เลือกหมวดหมู่', createBubble({
    header: createHeader(
      `เลือกหมวดหมู่${draft.type === 'income' ? 'รายรับ' : 'รายจ่าย'}`,
      `${draft.description} ฿${formatCurrency(draft.amount)}`,
      txColors.icon
    ),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        ...(draft.suggested_category ? [{
          type: 'text' as const,
          text: `💡 แนะนำ: ${draft.suggested_category}`,
          size: 'xs' as const,
          color: theme.accent,
          align: 'center' as const,
          weight: 'bold' as const,
        }, createSpacer('sm')] : []),
        ...rows,
      ],
      paddingAll: 'lg',
      spacing: 'sm',
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

export function confirmTransactionMessage(
  draft: TransactionDraft,
  theme: ThemeColors
): any {
  const txColors = getTransactionColors(draft.type!);
  const typeLabel = draft.type === 'income' ? 'รายรับ' : 'รายจ่าย';

  return createFlexMessage('ยืนยันรายการ', createBubble({
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
              text: `฿${formatCurrency(draft.amount)}`,
              size: 'xxl',
              weight: 'bold',
              color: txColors.highlight,
              align: 'center',
            },
            {
              type: 'text',
              text: draft.description,
              size: 'md',
              color: '#1A1A2E',
              align: 'center',
              weight: 'bold',
            },
          ],
          backgroundColor: txColors.bg,
          cornerRadius: 'lg',
          paddingAll: 'xl',
          spacing: 'sm',
        },
        createSpacer('md'),
        createTextRow('ประเภท', `${txColors.icon} ${typeLabel}`, txColors.highlight),
        createSpacer('xs'),
        createTextRow('หมวดหมู่', draft.category_name || 'ไม่ระบุ'),
        createSpacer('xs'),
        createTextRow('แหล่งที่มา', draft.source === 'slip' ? '📸 สลิป' : '💬 พิมพ์'),
        ...(draft.transaction_date ? [
          createSpacer('xs'),
          createTextRow('วันที่', formatThaiDate(draft.transaction_date)),
        ] : []),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('❌ ยกเลิก', JSON.stringify({ action: 'cancel' }), 'secondary'),
        createButton('✅ ยืนยัน', JSON.stringify({ action: 'confirm_transaction' }), 'primary', txColors.highlight),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

export function transactionSuccessMessage(
  description: string,
  amount: number,
  type: 'income' | 'expense',
  categoryName: string,
  theme: ThemeColors
): any {
  const txColors = getTransactionColors(type);
  const typeLabel = type === 'income' ? 'รายรับ' : 'รายจ่าย';

  return createFlexMessage('บันทึกสำเร็จ!', createBubble({
    header: createHeader('บันทึกสำเร็จ! ✅', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${txColors.icon} ${typeLabel}`,
          size: 'sm',
          color: txColors.highlight,
          align: 'center',
          weight: 'bold',
        },
        {
          type: 'text',
          text: `฿${formatCurrency(amount)}`,
          size: 'xxl',
          weight: 'bold',
          color: txColors.highlight,
          align: 'center',
        },
        {
          type: 'text',
          text: description,
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('xs'),
        {
          type: 'text',
          text: `📁 ${categoryName}`,
          size: 'xs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Slip: No account match → ask type (updated: show sender) =====

export function slipParsedMessage(
  amount: number,
  sender: string,
  recipient: string,
  bank: string,
  theme: ThemeColors
): any {
  return createFlexMessage('อ่านสลิปสำเร็จ', createBubble({
    header: createHeader('อ่านสลิปสำเร็จ! 📸', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `฿${formatCurrency(amount)}`,
          size: 'xxl',
          weight: 'bold',
          color: theme.primary,
          align: 'center',
        },
        createSpacer('md'),
        createTextRow('ผู้โอน', sender),
        createSpacer('xs'),
        createTextRow('ผู้รับ', recipient),
        createSpacer('xs'),
        createTextRow('ธนาคาร', bank),
        createSpacer('md'),
        {
          type: 'text',
          text: 'รายการนี้เป็นรายรับหรือรายจ่าย?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton('📤 รายจ่าย', JSON.stringify({ action: 'select_type', type: 'expense' }), 'primary', '#EF4444'),
        createButton('📥 รายรับ', JSON.stringify({ action: 'select_type', type: 'income' }), 'primary', '#10B981'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Slip: Date mismatch → ask which date to use =====

export function slipDateMismatchMessage(
  slipDate: string,
  today: string,
  theme: ThemeColors
): any {
  return createFlexMessage('วันที่ไม่ตรงกัน', createBubble({
    header: createHeader('วันที่ไม่ตรงกัน', '', '📅'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'วันที่ในสลิปไม่ตรงกับวันนี้',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
        createSpacer('md'),
        createTextRow('วันที่ในสลิป', formatThaiDate(slipDate)),
        createSpacer('xs'),
        createTextRow('วันนี้', formatThaiDate(today)),
        createSpacer('md'),
        {
          type: 'text',
          text: 'ต้องการบันทึกเป็นวันที่ไหน?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton(
          '📅 วันในสลิป',
          JSON.stringify({ action: 'slip_select_date', date: 'slip' }),
          'primary',
          theme.primary
        ),
        createButton(
          '📅 วันนี้',
          JSON.stringify({ action: 'slip_select_date', date: 'today' }),
          'secondary'
        ),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Slip: AI suggests type (account name matched) =====

export function slipSuggestTypeMessage(
  amount: number,
  sender: string,
  recipient: string,
  bank: string,
  suggestedType: 'income' | 'expense',
  matchedName: string,
  theme: ThemeColors
): any {
  const typeLabel = suggestedType === 'income' ? '📥 รายรับ' : '📤 รายจ่าย';
  const typeColor = suggestedType === 'income' ? '#10B981' : '#EF4444';
  const confirmLabel = suggestedType === 'income' ? '✅ ใช่ รายรับ' : '✅ ใช่ รายจ่าย';

  return createFlexMessage('อ่านสลิปสำเร็จ', createBubble({
    header: createHeader('อ่านสลิปสำเร็จ! 📸', ''),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `฿${formatCurrency(amount)}`,
          size: 'xxl',
          weight: 'bold',
          color: theme.primary,
          align: 'center',
        },
        createSpacer('md'),
        createTextRow('ผู้โอน', sender),
        createSpacer('xs'),
        createTextRow('ผู้รับ', recipient),
        createSpacer('xs'),
        createTextRow('ธนาคาร', bank),
        createSpacer('md'),
        createSeparator(),
        createSpacer('md'),
        {
          type: 'text',
          text: `🤖 AI แนะนำ: ${typeLabel}`,
          size: 'md',
          weight: 'bold',
          color: typeColor,
          align: 'center',
        },
        {
          type: 'text',
          text: `(ตรงกับบัญชีของคุณ: ${matchedName})`,
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton(
          confirmLabel,
          JSON.stringify({ action: 'slip_confirm_type', type: suggestedType }),
          'primary',
          typeColor
        ),
        createButton(
          '❌ ไม่ใช่',
          JSON.stringify({ action: 'slip_reject_type' }),
          'secondary'
        ),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}

// ===== Slip: Flip type after rejection =====

export function slipFlipTypeMessage(
  flippedType: 'income' | 'expense',
  theme: ThemeColors
): any {
  const typeLabel = flippedType === 'income' ? '📥 รายรับ' : '📤 รายจ่าย';
  const typeColor = flippedType === 'income' ? '#10B981' : '#EF4444';
  const confirmLabel = flippedType === 'income' ? '✅ ใช่ รายรับ' : '✅ ใช่ รายจ่าย';

  return createFlexMessage('เปลี่ยนประเภท', createBubble({
    header: createHeader('เปลี่ยนประเภท', '', '🔄'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `เปลี่ยนเป็น ${typeLabel}`,
          size: 'lg',
          weight: 'bold',
          color: typeColor,
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'ใช่ไหม?',
          size: 'sm',
          color: '#6B7280',
          align: 'center',
        },
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        createButton(
          confirmLabel,
          JSON.stringify({ action: 'slip_confirm_type', type: flippedType }),
          'primary',
          typeColor
        ),
        createButton(
          '❌ ยกเลิก',
          JSON.stringify({ action: 'cancel' }),
          'secondary'
        ),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme,
  }));
}
