import { ThemeColors, TransactionColors } from '../types';

const GENDER_THEMES: Record<string, ThemeColors> = {
  male: {
    primary: '#7CAED4',
    secondary: '#EBF4FA',
    accent: '#5A94BD',
    text: '#2D3748',
    subtext: '#718096',
  },
  female: {
    primary: '#D4899E',
    secondary: '#FBEAF0',
    accent: '#C07088',
    text: '#2D3748',
    subtext: '#718096',
  },
  other: {
    primary: '#9E8EC8',
    secondary: '#F0EDFB',
    accent: '#8070B0',
    text: '#2D3748',
    subtext: '#718096',
  },
};

const TRANSACTION_COLORS: Record<string, TransactionColors> = {
  income: {
    highlight: '#68D391',
    bg: '#E6FFEC',
    icon: '📥',
  },
  expense: {
    highlight: '#FC8181',
    bg: '#FFF0F0',
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
  primary: '#9BA4D6',
  secondary: '#EEEDF8',
  accent: '#7C86C1',
  text: '#2D3748',
  subtext: '#718096',
};
