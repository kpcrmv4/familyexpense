/**
 * Rich Menu Image Generator
 * สร้างรูป Rich Menu 2500x1686 สำหรับ LINE Bot
 * รองรับ 2 โทนสี: male (น้ำเงิน) / female (ชมพู)
 *
 * Usage:
 *   npx ts-node scripts/generate-richmenu-image.ts [male|female]
 *
 * Output:
 *   assets/richmenu-male.png
 *   assets/richmenu-female.png
 */

import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// ===== Theme Definitions =====

interface MenuTheme {
  name: string;
  primary: string;        // พื้นหลังแถวบน
  primaryDark: string;    // border/accent
  secondary: string;      // พื้นหลังแถวล่าง
  secondaryDark: string;  // border แถวล่าง
  iconBg: string;         // วงกลมพื้นหลัง icon
  textPrimary: string;    // ตัวหนังสือหลัก
  textSecondary: string;  // ตัวหนังสือรอง
  divider: string;        // เส้นแบ่ง
}

const THEMES: Record<string, MenuTheme> = {
  male: {
    name: 'male',
    primary: '#4A90D9',
    primaryDark: '#2C5F9E',
    secondary: '#E8F0FE',
    secondaryDark: '#B8D4F0',
    iconBg: '#FFFFFF33',
    textPrimary: '#FFFFFF',
    textSecondary: '#1A1A2E',
    divider: '#FFFFFF22',
  },
  female: {
    name: 'female',
    primary: '#E91E8C',
    primaryDark: '#B5156D',
    secondary: '#FDE8F4',
    secondaryDark: '#F0B8D8',
    iconBg: '#FFFFFF33',
    textPrimary: '#FFFFFF',
    textSecondary: '#1A1A2E',
    divider: '#FFFFFF22',
  },
};

// ===== Menu Button Config =====

interface MenuButton {
  emoji: string;
  label: string;
  sublabel: string;
}

const BUTTONS_ROW1: MenuButton[] = [
  { emoji: '💬', label: 'บันทึก', sublabel: 'รายรับ/จ่าย' },
  { emoji: '📅', label: 'ค่าใช้จ่าย', sublabel: 'ประจำเดือน' },
  { emoji: '📊', label: 'ดูสรุป', sublabel: 'รายรับรายจ่าย' },
];

const BUTTONS_ROW2: MenuButton[] = [
  { emoji: '📂', label: 'หมวดหมู่', sublabel: 'ของฉัน' },
  { emoji: '🤖', label: 'คำแนะนำ', sublabel: 'AI' },
  { emoji: '⚙️', label: 'ตั้งค่า', sublabel: '' },
];

// ===== Canvas Dimensions =====
const WIDTH = 2500;
const HEIGHT = 1686;
const ROW_HEIGHT = HEIGHT / 2;    // 843
const COL_WIDTH = WIDTH / 3;      // ~833

// ===== Drawing Helpers =====

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGradientBg(ctx: CanvasRenderingContext2D, theme: MenuTheme) {
  // Row 1 - Gradient background
  const grad1 = ctx.createLinearGradient(0, 0, WIDTH, ROW_HEIGHT);
  grad1.addColorStop(0, theme.primary);
  grad1.addColorStop(1, theme.primaryDark);
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, WIDTH, ROW_HEIGHT);

  // Row 2 - Light background
  const grad2 = ctx.createLinearGradient(0, ROW_HEIGHT, WIDTH, HEIGHT);
  grad2.addColorStop(0, theme.secondary);
  grad2.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, ROW_HEIGHT, WIDTH, ROW_HEIGHT);
}

function drawGridLines(ctx: CanvasRenderingContext2D, theme: MenuTheme) {
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 2;

  // Vertical lines (row 1)
  for (let i = 1; i < 3; i++) {
    const x = Math.round(COL_WIDTH * i);
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, ROW_HEIGHT - 40);
    ctx.stroke();
  }

  // Vertical lines (row 2)
  ctx.strokeStyle = theme.secondaryDark + '66';
  for (let i = 1; i < 3; i++) {
    const x = Math.round(COL_WIDTH * i);
    ctx.beginPath();
    ctx.moveTo(x, ROW_HEIGHT + 40);
    ctx.lineTo(x, HEIGHT - 40);
    ctx.stroke();
  }

  // Horizontal divider
  ctx.strokeStyle = theme.primaryDark + '44';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, ROW_HEIGHT);
  ctx.lineTo(WIDTH - 60, ROW_HEIGHT);
  ctx.stroke();
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  btn: MenuButton,
  col: number,
  row: number,
  theme: MenuTheme,
  isTopRow: boolean
) {
  const centerX = COL_WIDTH * col + COL_WIDTH / 2;
  const centerY = ROW_HEIGHT * row + ROW_HEIGHT / 2;

  // Icon circle background
  const circleRadius = 80;
  const circleY = centerY - 60;

  ctx.beginPath();
  ctx.arc(centerX, circleY, circleRadius, 0, Math.PI * 2);
  if (isTopRow) {
    ctx.fillStyle = theme.iconBg;
  } else {
    ctx.fillStyle = theme.primary + '18';
  }
  ctx.fill();

  // Subtle ring
  ctx.beginPath();
  ctx.arc(centerX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.strokeStyle = isTopRow ? '#FFFFFF44' : theme.primary + '33';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Emoji
  ctx.font = '72px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.emoji, centerX, circleY);

  // Label
  const labelY = centerY + 70;
  ctx.font = 'bold 52px sans-serif';
  ctx.fillStyle = isTopRow ? theme.textPrimary : theme.textSecondary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.label, centerX, labelY);

  // Sublabel
  if (btn.sublabel) {
    ctx.font = '38px sans-serif';
    ctx.fillStyle = isTopRow ? '#FFFFFFBB' : '#6B7280';
    ctx.fillText(btn.sublabel, centerX, labelY + 55);
  }
}

function drawDecorations(ctx: CanvasRenderingContext2D, theme: MenuTheme) {
  // Subtle dots pattern on top row
  ctx.fillStyle = '#FFFFFF08';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * ROW_HEIGHT;
    const r = Math.random() * 8 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom row subtle pattern
  ctx.fillStyle = theme.primary + '06';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * WIDTH;
    const y = ROW_HEIGHT + Math.random() * ROW_HEIGHT;
    const r = Math.random() * 6 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== Main Generator =====

function generateRichMenuImage(themeName: string): Buffer {
  const theme = THEMES[themeName];
  if (!theme) throw new Error(`Unknown theme: ${themeName}`);

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // 1. Background
  drawGradientBg(ctx, theme);

  // 2. Decorations
  drawDecorations(ctx, theme);

  // 3. Grid lines
  drawGridLines(ctx, theme);

  // 4. Buttons - Row 1
  BUTTONS_ROW1.forEach((btn, i) => {
    drawButton(ctx, btn, i, 0, theme, true);
  });

  // 5. Buttons - Row 2
  BUTTONS_ROW2.forEach((btn, i) => {
    drawButton(ctx, btn, i, 1, theme, false);
  });

  return canvas.toBuffer('image/png');
}

// ===== CLI Execution =====

async function main() {
  const arg = process.argv[2]?.toLowerCase();
  const themes = arg && THEMES[arg] ? [arg] : ['male', 'female'];

  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const themeName of themes) {
    console.log(`🎨 Generating Rich Menu image: ${themeName}...`);
    const buffer = generateRichMenuImage(themeName);
    const outputPath = path.join(assetsDir, `richmenu-${themeName}.png`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log('\n🎉 Done! Rich Menu images generated.');
}

main().catch(console.error);

// Export for use in other scripts
export { generateRichMenuImage, THEMES };
