import type { LucideIcon } from 'lucide-react-native';
import { MessageCircle } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, sizes } from '@/theme';

export type ButtonVariant = 'primary' | 'outline' | 'whatsapp' | 'text';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  height = sizes.button,
  style,
}: Props) {
  const v = variantStyles[variant];
  const Icon = icon ?? (variant === 'whatsapp' ? MessageCircle : undefined);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { height },
        v.container,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon size={18} color={v.fg} strokeWidth={2.2} /> : null}
          <Text style={[styles.label, { color: v.fg }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; fg: string }> = {
  primary: { container: { backgroundColor: colors.primary }, fg: colors.white },
  outline: {
    container: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary },
    fg: colors.primary,
  },
  whatsapp: { container: { backgroundColor: colors.whatsapp }, fg: colors.white },
  text: { container: { backgroundColor: 'transparent' }, fg: colors.primary },
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
