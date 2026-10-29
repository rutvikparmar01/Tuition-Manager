import type { TextStyle } from 'react-native';

export const colors = {
  primary: '#4F46E5',
  primaryTint: '#EEF2FF',
  bg: '#F6F7FB',
  card: '#FFFFFF',
  ink: '#111827',
  muted: '#6B7280',
  placeholder: '#9CA3AF',
  border: '#E5E7EB',
  segmentBg: '#ECEDF3',
  green: '#16A34A',
  greenTint: '#DCFCE7',
  red: '#DC2626',
  redTint: '#FEE2E2',
  absentRow: '#FFF7F7',
  amber: '#B45309',
  amberTint: '#FEF3C7',
  whatsapp: '#1FAF55',
  scrim: 'rgba(17,24,39,0.45)',
  white: '#FFFFFF',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const t = (
  fontSize: number,
  fontFamily: string,
  lineHeight = Math.round(fontSize * 1.35),
): TextStyle => ({
  fontSize,
  fontFamily,
  lineHeight,
  color: colors.ink,
});

export const type = {
  display: t(28, fonts.bold, 34),
  title: t(22, fonts.bold, 28),
  appBar: t(18, fonts.semibold, 24),
  section: t(16, fonts.semibold, 22),
  body: t(15, fonts.regular, 21),
  rowName: t(15, fonts.semibold, 20),
  label: t(13, fonts.medium, 18),
  caption: t(12, fonts.regular, 16),
  tab: t(11, fonts.medium, 14),
} as const;

export const radius = {
  input: 12,
  button: 12,
  row: 14,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const spacing = {
  screen: 16,
  gap: 12,
  card: 16,
  row: 12,
} as const;

export const sizes = {
  button: 48,
  input: 48,
  avatar: 40,
  iconButton: 40,
  bottomNav: 68,
  minTouch: 44,
} as const;
