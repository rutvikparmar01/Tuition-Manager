import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { House, SquareCheck, Users, Wallet, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, sizes } from '@/theme';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Home', icon: House },
  attendance: { label: 'Attendance', icon: SquareCheck },
  fees: { label: 'Fees', icon: Wallet },
  students: { label: 'Students', icon: Users },
};

export function BottomNav({ state, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom, height: sizes.bottomNav + insets.bottom },
      ]}
    >
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const active = state.index === i;
        const Icon = tab.icon;
        const color = active ? colors.primary : colors.muted;
        return (
          <NavItem
            key={route.key}
            label={tab.label}
            active={active}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => {});
              navigateToTab(route.key);
            }}
          >
            <View style={[styles.iconPill, active && styles.iconPillActive]}>
              <Icon size={20} color={color} strokeWidth={2} />
            </View>
          </NavItem>
        );
      })}
    </View>
  );
}

function NavItem({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.item}
    >
      {children}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconPill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999 },
  iconPillActive: { backgroundColor: colors.primaryTint },
  label: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.muted },
  labelActive: { fontFamily: fonts.semibold, color: colors.primary },
});
