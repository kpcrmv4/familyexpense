import { ThemeColors, TransactionColors } from '../types';

const GENDER_THEMES: Record<string, ThemeColors> = {
  male: {
    primary: '#4A90D9',
    secondary: '#E8F0FE',
    accent: '#2C5F9E',
    text: '#1A1A2E',
    subtext: '#6B7280',
  },
  female: {
    primary: '#E91E8C',
    secondary: '#FDE8F4',
    accent: '#B5156D',
    text: '#1A1A2E',
    subtext: '#6B7280',
  },
  other: {
    primary: '#8B5CF6',
    secondary: '#EDE9FE',
    accent: '#6D28D9',
    text: '#1A1A2E',
    subtext: '#6B7280',
  },
};

const TRANSACTION_COLORS: Record<string, TransactionColors> = {
  income: {
    highlight: '#10B981',
    bg: '#D1FAE5',
    icon: '📥',
  },
  expense: {
    highlight: '#EF4444',
    bg: '#FEE2E2',
    icon: '📤',
  },
};

export function getGenderTheme(gender: string): ThemeColors {
  return GENDER_THEMES[gender] || GENDER_THEMES.other;
}

export function getTransactionColors(type: string): TransactionColors {
  return TRANSACTION_COLORS[type] || TRANSACTION_COLORS.expense;
}

// Default theme when user is not registered yet
export const DEFAULT_THEME: ThemeColors = {
  primary: '#6366F1',
  secondary: '#EEF2FF',
  accent: '#4F46E5',
  text: '#1A1A2E',
  subtext: '#6B7280',
};
