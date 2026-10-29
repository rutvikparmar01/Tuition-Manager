import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, sizes } from '@/theme';
import { WEEKDAYS, type Weekday } from '@/types';

interface Props {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
}

export function DaysSelector({ value, onChange }: Props) {
  const toggle = (d: Weekday) =>
    onChange(
      value.includes(d)
        ? value.filter((x) => x !== d)
        : WEEKDAYS.filter((x) => x === d || value.includes(x)),
    );

  return (
    <View style={styles.row}>
      {WEEKDAYS.map((d) => {
        const on = value.includes(d);
        return (
          <Pressable
            key={d}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={d}
            onPress={() => toggle(d)}
            style={[styles.day, on && styles.dayOn]}
          >
            <Text style={[styles.text, on && styles.textOn]}>{d[0]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  day: {
    flex: 1,
    aspectRatio: 1,
    minHeight: sizes.minTouch - 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  textOn: { color: colors.white },
});
