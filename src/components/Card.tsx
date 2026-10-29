import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface Props {
  children: ReactNode;
  /** Set false for list cards whose rows carry their own padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padded = true, style }: Props) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  padded: { padding: spacing.card },
  divider: { height: 1, backgroundColor: colors.border },
});
