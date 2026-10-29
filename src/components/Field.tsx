import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, sizes, type } from '@/theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  required?: boolean;
  /** `'+91'`, `'₹'` or an icon element. */
  leading?: ReactNode;
  trailing?: ReactNode;
  helper?: string;
  error?: string;
  /** Turns the field into a tappable display (date / time pickers). `value` is shown as text. */
  onPress?: () => void;
  /** Use inside @gorhom/bottom-sheet so the sheet tracks the keyboard. */
  inSheet?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
  style?: StyleProp<ViewStyle>;
}

export function Field({
  label,
  required,
  leading,
  trailing,
  helper,
  error,
  onPress,
  inSheet = false,
  ref,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...input
}: Props) {
  const [focused, setFocused] = useState(false);
  const disabled = !editable && !onPress;
  // Same props/ref surface; the sheet variant only adds keyboard tracking.
  const Input = (inSheet ? BottomSheetTextInput : TextInput) as typeof TextInput;

  const box = [
    styles.box,
    focused && styles.focused,
    !!error && styles.errored,
    disabled && styles.disabled,
  ];

  const lead =
    typeof leading === 'string' ? (
      <Text style={[styles.leadingText, leading === '₹' && styles.rupee]}>{leading}</Text>
    ) : (
      leading
    );

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.red }}> *</Text> : null}
        </Text>
      ) : null}

      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [box, pressed && styles.focused]}
        >
          {lead}
          <Text
            style={[styles.input, !input.value && { color: colors.placeholder }]}
            numberOfLines={1}
          >
            {input.value || input.placeholder}
          </Text>
          {trailing}
        </Pressable>
      ) : (
        <View style={box}>
          {lead}
          <Input
            ref={ref}
            {...input}
            editable={editable}
            accessibilityLabel={input.accessibilityLabel ?? label}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, input.multiline && styles.multiline]}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
          />
          {trailing}
        </View>
      )}

      {error ? (
        <Text style={[styles.helper, { color: colors.red }]}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...type.label, color: colors.muted },
  box: {
    minHeight: sizes.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focused: { borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: 13.5 },
  errored: { borderColor: colors.red },
  disabled: { backgroundColor: colors.bg },
  leadingText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  rupee: { fontFamily: fonts.regular },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  helper: { ...type.caption, color: colors.muted },
});
