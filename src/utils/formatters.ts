import { THAI_MONTHS } from './constants';

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString('th-TH');
}

export function formatThaiDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543; // Buddhist Era
  return `${day} ${month} ${year}`;
}

export function formatThaiDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = (date.getFullYear() + 543).toString().slice(-2);
  return `${day}/${month}/${year}`;
}

export function getCurrentThaiMonth(): string {
  const now = bangkokNow();
  return `${THAI_MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
}

export function getThaiMonthYear(year: number, month: number): string {
  return `${THAI_MONTHS[month - 1]} ${year + 543}`;
}

export function todayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

/** Get current Date adjusted to Bangkok timezone */
function bangkokNow(): Date {
  const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
  return new Date(s);
}

/** Add N days to today (Bangkok TZ) and return YYYY-MM-DD string */
export function addDaysToToday(days: number): string {
  const base = bangkokNow();
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
}

/**
 * Normalize date from Gemini OCR
 * - Thai slips show 2-digit BE year "69" → Gemini may return 2069 instead of 2026
 * - If year > 2500 → treat as Buddhist Era, subtract 543
 * - If year between current+5 .. 2500 → 2-digit year misread, fix it
 */
export function normalizeSlipDate(dateStr: string): string {
  if (!dateStr) return todayDateString();

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return todayDateString();

  let year = parseInt(match[1], 10);
  const month = match[2];
  const day = match[3];

  const currentCEYear = new Date().getFullYear();

  if (year > 2500) {
    // Buddhist Era → convert to CE
    year = year - 543;
  } else if (year > currentCEYear + 5) {
    // Gemini misread 2-digit year: "69" → 2069
    // Extract last 2 digits, treat as BE short year
    const short = year % 100;
    const beYear = 2500 + short;
    year = beYear - 543;
  }

  return `${year}-${month}-${day}`;
}
