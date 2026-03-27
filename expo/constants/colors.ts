import { Platform } from 'react-native';

const primaryBlue = '#0066cc';
const successGreen = '#22c55e';
const dangerRed = '#ff3b30';
const warningOrange = '#ff9500';

export const Colors = {
  light: {
    text: '#1a1a1a',
    textSecondary: '#666',
    textTertiary: '#999',
    background: '#f5f5f5',
    backgroundCard: '#fff',
    backgroundInput: '#fff',
    backgroundDisabled: '#f5f5f5',
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    tint: primaryBlue,
    primary: primaryBlue,
    success: successGreen,
    danger: dangerRed,
    warning: warningOrange,
    tabIconDefault: '#999',
    tabIconSelected: primaryBlue,
    headerBackground: '#fff',
    headerBorder: '#e0e0e0',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    badge: '#ff3b30',
    badgeText: '#fff',
    accent: '#34c759',
    accentSecondary: '#0066cc',
    placeholder: '#999',
    divider: '#e0e0e0',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textTertiary: '#666',
    background: '#151718',
    backgroundCard: '#1c1c1e',
    backgroundInput: '#2c2c2e',
    backgroundDisabled: '#2c2c2e',
    border: '#38383a',
    borderLight: '#2c2c2e',
    tint: primaryBlue,
    primary: primaryBlue,
    success: successGreen,
    danger: dangerRed,
    warning: warningOrange,
    tabIconDefault: '#666',
    tabIconSelected: primaryBlue,
    headerBackground: '#1c1c1e',
    headerBorder: '#38383a',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    badge: '#ff3b30',
    badgeText: '#fff',
    accent: '#34c759',
    accentSecondary: '#0066cc',
    placeholder: '#666',
    divider: '#38383a',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const commonColors = {
  blue: '#0066cc',
  green: '#22c55e',
  red: '#ff3b30',
  orange: '#ff9500',
  gray: '#666',
  lightGray: '#999',
  white: '#fff',
  black: '#1a1a1a',
};
