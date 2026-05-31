export const colors = {
  bg: {
    base: '#0A0A0B',
    elevated: '#141416',
    subtle: '#1C1C1F',
    overlay: 'rgba(0,0,0,0.72)',
  },
  text: {
    primary: '#F2F2F3',
    secondary: '#A1A1A6',
    muted: '#6B6B70',
    inverse: '#0A0A0B',
  },
  accent: {
    primary: '#C9A227',
    secondary: '#3B82F6',
    danger: '#E5484D',
  },
  border: {
    default: '#2A2A2E',
    focus: '#C9A227',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const typography = {
  titleLarge: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  titleMedium: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  dataLarge: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  dataMono: { fontSize: 15, fontWeight: '500' as const, lineHeight: 20 },
} as const;

export const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.accent.primary,
    background: colors.bg.base,
    card: colors.bg.elevated,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.accent.danger,
  },
};
