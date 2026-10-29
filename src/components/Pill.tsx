import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/theme';
import type { FeeStatus } from '@/types';

export type PillTone = 'green' | 'red' | 'amber' | 'primary' | 'primarySolid' | 'neutral';

const tones: Record<PillTone, { bg: string; fg: string }> = {
  green: { bg: colors.greenTint, fg: colors.green },
  red: { bg: colors.redTint, fg: colors.red },
  amber: { bg: colors.amberTint, fg: colors.amber },
  primary: { bg: colors.primaryTint, fg: colors.primary },
  primarySolid: { bg: colors.primary, fg: colors.white },
  neutral: { bg: colors.segmentBg, fg: colors.muted },
};

interface Props {
  label: string;
  tone?: PillTone;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, tone = 'neutral', size = 'sm', icon: Icon, style }: Props) {
  const t = tones[tone];
  const md = size === 'md';
  return (
    <View style={[styles.pill, md && styles.md, { backgroundColor: t.bg }, style]}>
      {Icon ? <Icon size={md ? 14 : 12} color={t.fg} strokeWidth={2.4} /> : null}
      <Text style={[styles.text, md && styles.mdText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const statusMeta: Record<FeeStatus, { label: string; tone: PillTone }> = {
  paid: { label: 'Paid', tone: 'green' },
  pending: { label: 'Pending', tone: 'red' },
  partial: { label: 'Partial', tone: 'amber' },
};

export function StatusPill({ status }: { status: FeeStatus }) {
  const m = statusMeta[status];
  return <Pill label={m.label} tone={m.tone} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: { paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15 },
  mdText: { fontSize: 13, lineHeight: 18 },
});
