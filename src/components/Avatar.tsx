import { StyleSheet, Text, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors, fonts, sizes } from '@/theme';

export function Avatar({ name, size = sizes.avatar }: { name: string; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.35) }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.semibold, color: colors.primary },
});
