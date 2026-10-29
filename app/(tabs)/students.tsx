import { router } from 'expo-router';
import { Plus, Search, SearchX, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { EmptyState, LoadingView, PageHeader, Screen } from '@/components/Screen';
import { StudentRow } from '@/components/StudentRow';
import { useBatches, useStudents } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useFeeRows } from '@/hooks/useFeeRows';
import { formatPhone, toMonthKey } from '@/lib/format';
import { colors, fonts, radius, sizes, spacing } from '@/theme';

const ALL = '__all__';

export default function Students() {
  const students = useStudents();
  const batches = useBatches();
  const fees = useFeeRows(toMonthKey());
  const { canWrite } = useEntitlement();
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState(ALL);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return students.data.filter(
      (s) =>
        (batchFilter === ALL || s.batchId === batchFilter) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          (digits.length >= 3 && s.parentPhone.includes(digits))),
    );
  }, [students.data, search, batchFilter]);

  const countIn = (batchId: string) => students.data.filter((s) => s.batchId === batchId).length;
  const loading = students.loading || batches.loading;

  return (
    <Screen tab>
      <PageHeader
        title="Students"
        subtitle={`${students.data.length} students · ${batches.data.length} ${batches.data.length === 1 ? 'batch' : 'batches'}`}
      />
      <View style={styles.controls}>
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone"
          leading={<Search size={18} color={colors.muted} />}
          returnKeyType="search"
          accessibilityLabel="Search students"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label={`All · ${students.data.length}`}
            selected={batchFilter === ALL}
            onPress={() => setBatchFilter(ALL)}
          />
          {batches.data.map((b) => (
            <Chip
              key={b.id}
              label={`${b.name} · ${countIn(b.id)}`}
              selected={batchFilter === b.id}
              onPress={() => setBatchFilter(b.id)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Card>
              {students.data.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students yet"
                  body="Add your first student to start tracking fees."
                />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="No matches"
                  body="Try a different name or batch."
                />
              )}
            </Card>
          }
          renderItem={({ item: s }) => {
            const row = fees.byStudent.get(s.id);
            return (
              <StudentRow
                name={s.name}
                meta={`${batches.byId.get(s.batchId)?.name ?? 'No batch'} · ${formatPhone(s.parentPhone)}`}
                amount={
                  row ? (row.fee.status === 'paid' ? row.fee.amountPaid : row.due) : s.monthlyFee
                }
                status={row?.fee.status ?? 'pending'}
                onPress={() => router.push(`/student/${s.id}`)}
              />
            );
          }}
        />
      )}

      {canWrite ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/student/new')}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        >
          <Plus size={20} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.fabText}>Add student</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.screen, gap: spacing.gap },
  chips: { gap: 8, paddingBottom: 4 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  list: { padding: spacing.screen, paddingBottom: 96 },
  fab: {
    position: 'absolute',
    right: spacing.screen,
    bottom: 16,
    height: sizes.button + 4,
    paddingHorizontal: 20,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
});
