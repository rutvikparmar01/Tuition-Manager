import { router } from 'expo-router';
import { Clock, Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useEntitlement } from '@/hooks/useEntitlement';
import { colors, fonts, radius, type } from '@/theme';

/** Amber trial / read-only banner on Home. Hidden for subscribers. */
export function PlanBanner() {
  const ent = useEntitlement();
  if (ent.status === 'active') return null;
  const expired = ent.status === 'expired';
  const Icon = expired ? Lock : Clock;

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.banner,
        expired && styles.expired,
        pressed && { opacity: 0.9 },
      ]}
    >
      <Icon size={20} color={expired ? colors.red : colors.amber} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, expired && { color: colors.red }]}>
          {expired
            ? 'Trial ended · read-only'
            : `Free trial · ${ent.daysLeft} ${ent.daysLeft === 1 ? 'day' : 'days'} left`}
        </Text>
        <Text style={[styles.sub, expired && { color: colors.red }]}>
          {expired ? 'Subscribe to keep adding and editing' : 'Keep everything for ₹199/year'}
        </Text>
      </View>
      <Text style={[styles.cta, expired && { color: colors.red }]}>
        {expired ? 'Subscribe' : 'Upgrade'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.row,
    backgroundColor: colors.amberTint,
  },
  expired: { backgroundColor: colors.redTint },
  title: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.amber },
  sub: { ...type.caption, color: colors.amber },
  cta: { fontFamily: fonts.semibold, fontSize: 14, color: colors.amber },
});
