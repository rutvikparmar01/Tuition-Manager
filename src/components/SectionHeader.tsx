import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, type } from '@/theme';

interface Props {
  title: string;
  /** Tappable link on the right. Pass `onAction` to make it a button, omit for a plain label. */
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, action, onAction, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={type.section}>{title}</Text>
      {action ? (
        <Pressable
          onPress={onAction}
          disabled={!onAction}
          accessibilityRole={onAction ? 'button' : 'text'}
          hitSlop={12}
        >
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.primary },
});
