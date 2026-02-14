import { ThemeColors } from '../types';
import { createFlexMessage, createBubble, createHeader } from './flexMessages';
import { RICH_MENU_ACTIONS } from '../utils/constants';

const MENU_ITEMS = [
  { icon: '💬', label: 'บันทึกรายรับ/จ่าย', action: RICH_MENU_ACTIONS.RECORD },
  { icon: '📅', label: 'ค่าใช้จ่ายประจำเดือน', action: RICH_MENU_ACTIONS.RECURRING },
  { icon: '📊', label: 'ดูสรุปรายรับรายจ่าย', action: RICH_MENU_ACTIONS.SUMMARY },
  { icon: '📂', label: 'หมวดหมู่ของฉัน', action: RICH_MENU_ACTIONS.CATEGORIES },
  { icon: '🤖', label: 'คำแนะนำ AI', action: RICH_MENU_ACTIONS.AI_ADVICE },
  { icon: '⚙️', label: 'ตั้งค่า', action: RICH_MENU_ACTIONS.SETTINGS },
];

function createMenuButton(icon: string, label: string, action: string, color: string): any {
  return {
    type: 'button',
    action: {
      type: 'postback',
      label: `${icon} ${label}`,
      data: action,
      displayText: `${icon} ${label}`,
    },
    style: 'secondary',
    height: 'sm',
    margin: 'sm',
    color: '#F0F2F5',
  };
}

export function mainMenuMessage(theme: ThemeColors): any {
  const buttons = MENU_ITEMS.map((item) =>
    createMenuButton(item.icon, item.label, item.action, theme.primary)
  );

  return createFlexMessage('เมนูหลัก', createBubble({
    header: createHeader('เมนูหลัก', 'เลือกสิ่งที่ต้องการได้เลย', '📊'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: buttons,
      spacing: 'sm',
      paddingAll: 'lg',
    },
    theme,
  }));
}
