import dayjs from 'dayjs';
import { router } from 'expo-router';
import { CalendarClock, PartyPopper, SlidersHorizontal, UserPlus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Divider } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Pill } from '@/components/Pill';
import { PlanBanner } from '@/components/PlanBanner';
import { EmptyState, LoadingView, Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { DefaulterRow } from '@/components/StudentRow';
import { useAttendanceOn, useBatches, useStudents } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useFeeRows } from '@/hooks/useFeeRows';
import { useReminder } from '@/hooks/useReminder';
import { formatINR, greeting, timingToMinutes, toDateKey, toMonthKey } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, fonts, radius, spacing, type } from '@/theme';
import { WEEKDAYS } from '@/types';

export default function Home() {
  const tutor = useSession((s) => s.tutor);
  const { canWrite } = useEntitlement();
  const month = toMonthKey();
  const today = dayjs();
  const todayKey = toDateKey(today);
  const weekday = WEEKDAYS[(today.day() + 6) % 7];

  const batches = useBatches();
  const students = useStudents();
  const attendance = useAttendanceOn(todayKey);
  const fees = useFeeRows(month);
  const remind = useReminder();

  const todays = useMemo(() => {
    const done = new Set(attendance.data.map((a) => a.batchId));
    return batches.data
      .filter((b) => weekday && b.days.includes(weekday))
      .sort((a, b) => timingToMinutes(a.timing) - timingToMinutes(b.timing))
      .map((b) => ({
        batch: b,
        count: students.data.filter((s) => s.batchId === b.id).length,
        done: done.has(b.id),
      }));
  }, [attendance.data, batches.data, students.data, weekday]);

  const monthShort = today.format('MMM');
  const loading = batches.loading || students.loading || fees.loading;

  return (
    <Screen tab>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.title} numberOfLines={1}>
              {greeting()}, {tutor?.name.split(' ')[0] ?? ''}
            </Text>
            <Text style={[type.label, { color: colors.muted }]} numberOfLines={1}>
              {tutor?.className}
            </Text>
          </View>
          <IconButton
            icon={SlidersHorizontal}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
          />
        </View>

        <PlanBanner />

        {loading ? (
          <LoadingView />
        ) : students.data.length === 0 ? (
          <Card>
            <EmptyState
              icon={UserPlus}
              title="Step 2 of 2 · Add your first student"
              body="Add students to start tracking attendance and fees."
              actionLabel={canWrite ? 'Add student' : undefined}
              onAction={() => router.push('/student/new')}
            />
          </Card>
        ) : (
          <>
            <View style={styles.stats}>
              <StatCard
                label={`Collected · ${monthShort}`}
                value={formatINR(fees.collected)}
                sub={`${fees.paid.length} ${fees.paid.length === 1 ? 'student' : 'students'} paid`}
                color={colors.green}
              />
              <StatCard
                label={`Pending · ${monthShort}`}
                value={formatINR(fees.dueTotal)}
                sub={`${fees.pending.length} ${fees.pending.length === 1 ? 'student' : 'students'}`}
                color={colors.red}
              />
            </View>

            <SectionHeader title="Today's batches" action={today.format('ddd, D MMM')} />
            <Card padded={false}>
              {todays.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No batches today" />
              ) : (
                todays.map(({ batch, count, done }, i) => (
                  <View key={batch.id}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${batch.name}, ${done ? 'attendance done' : 'mark attendance'}`}
                      onPress={() =>
                        router.navigate({ pathname: '/attendance', params: { batchId: batch.id } })
                      }
                      style={({ pressed }) => [styles.batchRow, pressed && { opacity: 0.8 }]}
                    >
                      <View style={styles.time}>
                        <Text style={styles.timeText}>{batch.timing}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={type.rowName} numberOfLines={1}>
                          {batch.name}
                        </Text>
                        <Text style={[type.caption, { color: colors.muted }]}>
                          {count} {count === 1 ? 'student' : 'students'}
                        </Text>
                      </View>
                      {done ? (
                        <Pill label="Done" tone="green" size="md" />
                      ) : (
                        <Pill label="Mark →" tone="primarySolid" size="md" />
                      )}
                    </Pressable>
                  </View>
                ))
              )}
            </Card>

            <SectionHeader
              title="Pending fees"
              action="See all"
              onAction={() => router.navigate('/fees')}
            />
            {fees.pending.length === 0 ? (
              <Card>
                <EmptyState
                  icon={PartyPopper}
                  title="All fees collected"
                  body="Nobody owes you this month."
                />
              </Card>
            ) : (
              <View style={{ gap: 8 }}>
                {fees.pending.slice(0, 3).map((r) => (
                  <DefaulterRow
                    key={r.fee.id}
                    name={r.student.name}
                    meta={`${r.batch?.name ?? 'No batch'} · ${monthShort}`}
                    amount={r.due}
                    onPress={() => router.push(`/student/${r.student.id}`)}
                    onRemind={() => remind(r.student, r.fee)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card style={{ flex: 1 }}>
      <Text style={[type.label, { color: colors.muted, fontFamily: fonts.regular }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[type.caption, { color: colors.muted }]}>{sub}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: spacing.gap + 4, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.gap, paddingTop: 8 },
  stats: { flexDirection: 'row', gap: spacing.gap },
  statValue: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, marginTop: 4 },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    padding: spacing.card,
    minHeight: 60,
  },
  time: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.input - 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
});
