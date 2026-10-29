import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, sizes, spacing, type } from '@/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  /** `card` = the large dropdown on Attendance; `field` matches Field. */
  variant?: 'field' | 'card';
  disabled?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select',
  label,
  required,
  error,
  variant = 'field',
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={[type.label, { color: colors.muted }]}>
          {label}
          {required ? <Text style={{ color: colors.red }}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityHint="Opens a list of options"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          variant === 'card' && styles.card,
          !!error && { borderColor: colors.red },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text
          style={[
            variant === 'card' ? type.section : type.body,
            { flex: 1 },
            !selected && { color: colors.placeholder },
          ]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color={colors.muted} />
      </Pressable>
      {error ? <Text style={[type.caption, { color: colors.red }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.handle} />
            {label ? <Text style={[type.section, styles.sheetTitle]}>{label}</Text> : null}
            <ScrollView>
              {options.map((o) => {
                const isSel = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSel }}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: colors.bg },
                    ]}
                  >
                    <Text style={[styles.optionText, isSel && { color: colors.primary }]}>
                      {o.label}
                    </Text>
                    {isSel ? <Check size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: sizes.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: { minHeight: 52, borderRadius: radius.card, paddingHorizontal: 16 },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  sheetTitle: { paddingHorizontal: spacing.screen, paddingVertical: 8 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
  },
  optionText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
});
