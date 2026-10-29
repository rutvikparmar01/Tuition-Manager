import { MessageCircle } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { StatusPill } from '@/components/Pill';
import { formatINR } from '@/lib/format';
import { colors, fonts, radius, sizes, spacing, type } from '@/theme';
import type { FeeStatus } from '@/types';

interface BaseProps {
  name: string;
  meta: string;
  onPress?: () => void;
}

function RowShell({ name, meta, onPress, right }: BaseProps & { right: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <Avatar name={name} />
      <View style={styles.middle}>
        <Text style={type.rowName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

export function StudentRow({
  amount,
  status,
  ...rest
}: BaseProps & { amount: number; status: FeeStatus }) {
  return (
    <RowShell
      {...rest}
      right={
        <View style={styles.right}>
          <Text style={styles.amount}>{formatINR(amount)}</Text>
          <StatusPill status={status} />
        </View>
      }
    />
  );
}

export function DefaulterRow({
  amount,
  onRemind,
  remindDisabled,
  ...rest
}: BaseProps & { amount: number; onRemind: () => void; remindDisabled?: boolean }) {
  return (
    <RowShell
      {...rest}
      right={
        <View style={styles.defaulterRight}>
          <Text style={[styles.amount, { color: colors.red }]}>{formatINR(amount)}</Text>
          <Pressable
            onPress={onRemind}
            disabled={remindDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Remind ${rest.name} on WhatsApp`}
            hitSlop={8}
            style={({ pressed }) => [
              styles.remind,
              (pressed || remindDisabled) && { opacity: 0.7 },
            ]}
          >
            <MessageCircle size={13} color={colors.white} strokeWidth={2.4} />
            <Text style={styles.remindText}>Remind</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    padding: spacing.row,
    minHeight: 64,
    backgroundColor: colors.card,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
  },
  middle: { flex: 1, minWidth: 0, gap: 2 },
  meta: { ...type.caption, color: colors.muted },
  right: { alignItems: 'flex-end', gap: 4 },
  defaulterRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.ink },
  remind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    minWidth: sizes.minTouch,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.whatsapp,
  },
  remindText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },
});
