import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, sizes } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function Segmented<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bordered option buttons, e.g. Cash / UPI / Other in the payment sheet. */
export function OptionGroup<T extends string>({ options, value, onChange, style }: Props<T>) {
  return (
    <View style={[styles.group, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.optionLabel, selected && { color: colors.primary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.segmentBg,
    borderRadius: radius.button,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: sizes.minTouch - 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  selectedLabel: { fontFamily: fonts.semibold, color: colors.ink },
  group: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    height: sizes.minTouch,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
