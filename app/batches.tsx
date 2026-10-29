import { router } from 'expo-router';
import { CalendarX, ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AppBar, EmptyState, LoadingView, Screen, StickyFooter } from '@/components/Screen';
import { useBatches, useStudents } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import { formatINR } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme';

export default function Batches() {
  const batches = useBatches();
  const students = useStudents();
  const { canWrite } = useEntitlement();

  return (
    <Screen>
      <AppBar title="Batches" />
      {batches.loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={batches.data}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon={CalendarX}
                title="No batches"
                body="Add a batch to group students."
              />
            </Card>
          }
          renderItem={({ item: b }) => {
            const count = students.data.filter((s) => s.batchId === b.id).length;
            const meta = [
              b.timing,
              b.days.length === 7 ? 'Every day' : b.days.join(' '),
              b.monthlyFee ? formatINR(b.monthlyFee) : null,
              `${count} ${count === 1 ? 'student' : 'students'}`,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                accessibilityRole="button"
                disabled={!canWrite}
                onPress={() => router.push({ pathname: '/batch-edit', params: { id: b.id } })}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={type.rowName}>{b.name}</Text>
                  <Text style={[type.caption, { color: colors.muted }]}>{meta}</Text>
                </View>
                {canWrite ? <ChevronRight size={18} color={colors.muted} /> : null}
              </Pressable>
            );
          }}
        />
      )}
      <StickyFooter>
        <Button title="Add batch" disabled={!canWrite} onPress={() => router.push('/batch-edit')} />
      </StickyFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.screen },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    padding: spacing.card,
    minHeight: 64,
    backgroundColor: colors.card,
    borderRadius: radius.row,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
