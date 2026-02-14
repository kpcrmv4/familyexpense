import { createFlexMessage, createBubble, createHeader, createButton, createSpacer } from './flexMessages';
import { DEFAULT_THEME } from '../utils/themeColors';

export function welcomeMessage(): any {
  return createFlexMessage('ยินดีต้อนรับ', createBubble({
    header: createHeader('ยินดีต้อนรับ! 🎉', 'Family Expense Tracker'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'สวัสดีค่ะ! 👋',
          size: 'lg',
          weight: 'bold',
          color: '#2D3748',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'ฉันคือผู้ช่วยจัดการรายรับรายจ่าย\nของครอบครัวคุณค่ะ',
          size: 'sm',
          color: '#718096',
          wrap: true,
        },
        createSpacer('md'),
        {
          type: 'text',
          text: '📝 พิมพ์ "ลงทะเบียน" เพื่อเริ่มใช้งาน',
          size: 'sm',
          color: DEFAULT_THEME.accent,
          weight: 'bold',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme: DEFAULT_THEME,
  }));
}

export function askNameMessage(): any {
  return createFlexMessage('กรุณาบอกชื่อของคุณ', createBubble({
    header: createHeader('ลงทะเบียน', 'ขั้นตอนที่ 1/2', '📝'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'คุณชื่ออะไรคะ?',
          size: 'lg',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'กรุณาพิมพ์ชื่อที่ต้องการให้บอทเรียก',
          size: 'xs',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
      justifyContent: 'center',
    },
    theme: DEFAULT_THEME,
  }));
}

export function askGenderMessage(name: string): any {
  return createFlexMessage('เลือกเพศ', createBubble({
    header: createHeader('ลงทะเบียน', 'ขั้นตอนที่ 2/2', '📝'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `สวัสดีคุณ${name} 😊`,
          size: 'md',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'เลือกเพศเพื่อปรับธีมสีให้เหมาะกับคุณ',
          size: 'xs',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
        createSpacer('md'),
      ],
      paddingAll: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        createButton('👨 ผู้ชาย', JSON.stringify({ action: 'register_gender', gender: 'male' }), 'primary', '#7CAED4'),
        createButton('👩 ผู้หญิง', JSON.stringify({ action: 'register_gender', gender: 'female' }), 'primary', '#D4899E'),
        createButton('🌈 ไม่ระบุ', JSON.stringify({ action: 'register_gender', gender: 'other' }), 'secondary'),
      ],
      paddingAll: 'lg',
      spacing: 'sm',
    },
    theme: DEFAULT_THEME,
  }));
}

export function registerSuccessMessage(name: string, gender: string): any {
  const genderTheme = gender === 'male'
    ? { primary: '#7CAED4', emoji: '👨', label: 'ผู้ชาย' }
    : gender === 'female'
    ? { primary: '#D4899E', emoji: '👩', label: 'ผู้หญิง' }
    : { primary: '#9E8EC8', emoji: '🌈', label: 'ไม่ระบุ' };

  return createFlexMessage('ลงทะเบียนสำเร็จ!', createBubble({
    header: createHeader('ลงทะเบียนสำเร็จ! ✅', 'พร้อมใช้งานแล้ว'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${genderTheme.emoji} คุณ${name}`,
          size: 'xl',
          weight: 'bold',
          color: '#2D3748',
          align: 'center',
        },
        createSpacer('md'),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎉 ยินดีต้อนรับสู่ Family Expense!',
              size: 'sm',
              color: '#2D3748',
              align: 'center',
              weight: 'bold',
            },
            createSpacer('sm'),
            {
              type: 'text',
              text: '📱 ใช้เมนูด้านล่างเพื่อเริ่มต้น\n💬 หรือพิมพ์รายจ่าย เช่น "ค่ากาแฟ 60"\n📸 หรือส่งรูปสลิปโอนเงิน',
              size: 'xs',
              color: '#718096',
              wrap: true,
              align: 'center',
            },
          ],
          backgroundColor: '#F7F8FA',
          cornerRadius: 'lg',
          paddingAll: 'lg',
        },
      ],
      paddingAll: 'xl',
    },
    theme: {
      primary: genderTheme.primary,
      secondary: '#F7F8FA',
      accent: genderTheme.primary,
      text: '#2D3748',
      subtext: '#718096',
    },
  }));
}

export function alreadyRegisteredMessage(name: string): any {
  return createFlexMessage('คุณลงทะเบียนแล้ว', createBubble({
    header: createHeader('ลงทะเบียนแล้ว', '', '✅'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `คุณ${name} ลงทะเบียนแล้วค่ะ 😊`,
          size: 'sm',
          color: '#2D3748',
          align: 'center',
          wrap: true,
        },
        createSpacer('sm'),
        {
          type: 'text',
          text: 'ใช้เมนูด้านล่างหรือพิมพ์รายการได้เลย!',
          size: 'xs',
          color: '#718096',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme: DEFAULT_THEME,
  }));
}

export function pleaseRegisterMessage(): any {
  return createFlexMessage('กรุณาลงทะเบียน', createBubble({
    header: createHeader('ยังไม่ได้ลงทะเบียน', '', '⚠️'),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'กรุณาพิมพ์ "ลงทะเบียน" ก่อนใช้งานค่ะ',
          size: 'sm',
          color: '#2D3748',
          align: 'center',
          wrap: true,
        },
      ],
      paddingAll: 'xl',
    },
    theme: DEFAULT_THEME,
  }));
}
