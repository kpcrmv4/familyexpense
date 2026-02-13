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
  const now = new Date();
  return `${THAI_MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
}

export function getThaiMonthYear(year: number, month: number): string {
  return `${THAI_MONTHS[month - 1]} ${year + 543}`;
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
