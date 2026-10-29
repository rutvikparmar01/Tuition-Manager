import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, sizes } from '@/theme';

interface Props {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  /** `plain` drops the white circle (used inside app bars). */
  variant?: 'circle' | 'plain';
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  variant = 'circle',
  color = colors.ink,
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={(sizes.minTouch - sizes.iconButton) / 2}
      style={({ pressed }) => [
        styles.base,
        variant === 'circle' && styles.circle,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      <Icon size={20} color={color} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    borderRadius: sizes.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
