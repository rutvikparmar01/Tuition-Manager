import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, CalendarX, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, Divider } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Pill } from '@/components/Pill';
import { EmptyState, LoadingView, PageHeader, Screen, StickyFooter } from '@/components/Screen';
import { Select } from '@/components/Select';
import { saveAttendance } from '@/data/repo';
import { useAttendance, useBatches, useStudents } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import { toDateKey } from '@/lib/format';
import { pickDate } from '@/lib/pickers';
import { useUid } from '@/store/session';
import { colors, fonts, radius, spacing, type } from '@/theme';
import type { DateKey } from '@/types';

export default function AttendanceScreen() {
  const uid = useUid();
  const params = useLocalSearchParams<{ batchId?: string }>();
  const batches = useBatches();
  const students = useStudents();
  const { canWrite } = useEntitlement();

  const [picked, setPicked] = useState<string | null>(params.batchId ?? null);
  const [seenParam, setSeenParam] = useState(params.batchId);
  // Home's "Mark →" navigates here with a batchId; a new param overrides the manual pick.
  if (params.batchId !== seenParam) {
    setSeenParam(params.batchId);
    if (params.batchId) setPicked(params.batchId);
  }
  // Fall back to the first batch when nothing (or a removed batch) is selected.
  const batchId = picked && batches.byId.has(picked) ? picked : (batches.data[0]?.id ?? null);
  const [date, setDate] = useState<DateKey>(toDateKey());
  const existing = useAttendance(batchId, date);

  // Unsaved edits belong to one batch + date; switching either shows the saved state again.
  const key = `${batchId}_${date}`;
  const [draft, setDraft] = useState<{ key: string; absent: Set<string> } | null>(null);
  const dirty = draft?.key === key;
  const absent = useMemo(
    () => (dirty && draft ? draft.absent : new Set(existing.data?.absent ?? [])),
    [dirty, draft, existing.data],
  );

  const roster = useMemo(
    () => students.data.filter((s) => s.batchId === batchId && s.joinDate <= date),
    [students.data, batchId, date],
  );

  const toggle = (studentId: string, markAbsent: boolean) => {
    if (!canWrite || absent.has(studentId) === markAbsent) return;
    Haptics.selectionAsync().catch(() => {});
    const next = new Set(absent);
    if (markAbsent) next.add(studentId);
    else next.delete(studentId);
    setDraft({ key, absent: next });
  };

  const save = () => {
    if (!batchId) return;
    const rosterIds = new Set(roster.map((s) => s.id));
    saveAttendance(
      uid,
      batchId,
      date,
      [...absent].filter((sid) => rosterIds.has(sid)),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDraft(null);
  };

  const chooseDate = async () => {
    const chosen = await pickDate(dayjs(date).toDate(), { maximumDate: new Date() });
    if (chosen) setDate(toDateKey(chosen));
  };

  const absentCount = roster.filter((s) => absent.has(s.id)).length;
  const presentCount = roster.length - absentCount;
  const saved = !!existing.data && !dirty;
  const loading = batches.loading || students.loading;

  return (
    <Screen tab>
      <PageHeader
        title="Attendance"
        subtitle={dayjs(date).format('ddd, D MMM YYYY')}
        right={<IconButton icon={Calendar} onPress={chooseDate} accessibilityLabel="Change date" />}
      />

      {loading ? (
        <LoadingView />
      ) : batches.data.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No batches yet"
          body="Create a batch in Settings to start marking attendance."
          actionLabel="Open settings"
          onAction={() => router.push('/settings')}
        />
      ) : (
        <>
          <View style={styles.controls}>
            <Select
              variant="card"
              label={undefined}
              value={batchId}
              onChange={setPicked}
              options={batches.data.map((b) => ({
                value: b.id,
                label: b.timing ? `${b.name} · ${b.timing}` : b.name,
              }))}
            />
            <View style={styles.countRow}>
              <Pill label={`${presentCount} present`} tone="green" size="md" />
              <Pill label={`${absentCount} absent`} tone="red" size="md" />
              <View style={{ flex: 1 }} />
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                disabled={!canWrite || absentCount === 0}
                onPress={() => {
                  setDraft({ key, absent: new Set() });
                }}
              >
                <Text style={[styles.link, (!canWrite || absentCount === 0) && { opacity: 0.4 }]}>
                  Mark all present
                </Text>
              </Pressable>
            </View>
            <Text style={[type.caption, { color: colors.muted }]}>
              Everyone starts as present. Tap A to mark a student absent.
            </Text>
          </View>

          <FlatList
            data={roster}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Card>
                <EmptyState
                  icon={Users}
                  title="No students in this batch"
                  body="Students who joined after this date are hidden."
                />
              </Card>
            }
            renderItem={({ item: s, index }) => {
              const isAbsent = absent.has(s.id);
              const first = index === 0;
              const last = index === roster.length - 1;
              return (
                <View
                  style={[
                    styles.row,
                    first && styles.rowFirst,
                    last && styles.rowLast,
                    isAbsent && { backgroundColor: colors.absentRow },
                  ]}
                >
                  {!first ? <Divider /> : null}
                  <View style={styles.rowInner}>
                    <Avatar name={s.name} size={36} />
                    <Text style={[type.rowName, { flex: 1 }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Toggle
                      label="P"
                      name={s.name}
                      on={!isAbsent}
                      color={colors.green}
                      disabled={!canWrite}
                      onPress={() => toggle(s.id, false)}
                    />
                    <Toggle
                      label="A"
                      name={s.name}
                      on={isAbsent}
                      color={colors.red}
                      disabled={!canWrite}
                      onPress={() => toggle(s.id, true)}
                    />
                  </View>
                </View>
              );
            }}
          />

          <StickyFooter>
            <Button
              title={saved ? 'Saved ✓' : 'Save attendance'}
              onPress={save}
              disabled={!canWrite || roster.length === 0 || saved}
            />
          </StickyFooter>
        </>
      )}
    </Screen>
  );
}

function Toggle({
  label,
  name,
  on,
  color,
  disabled,
  onPress,
}: {
  label: 'P' | 'A';
  name: string;
  on: boolean;
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on, disabled }}
      accessibilityLabel={`${name} ${label === 'P' ? 'present' : 'absent'}`}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      style={[styles.toggle, on && { backgroundColor: color, borderColor: color }]}
    >
      <Text style={[styles.toggleText, on && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: spacing.screen, gap: 10 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  list: { padding: spacing.screen, paddingBottom: 24 },
  row: {
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    overflow: 'hidden',
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.row + 2,
    minHeight: 56,
  },
  toggle: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
});
