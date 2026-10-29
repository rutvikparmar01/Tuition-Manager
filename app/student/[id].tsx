import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Phone, ReceiptText, UserX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card, Divider } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { StatusPill } from '@/components/Pill';
import { RecordPaymentSheet, type PaymentTarget } from '@/components/RecordPaymentSheet';
import { AppBar, EmptyState, LoadingView, Screen, StickyFooter } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useBatchMonthAttendance, useBatches, useStudent, useStudentFees } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import { dateLabel, formatINR, formatPhone, monthLabel, monthName, toMonthKey } from '@/lib/format';
import { openWhatsApp } from '@/lib/whatsapp';
import { colors, fonts, spacing, type } from '@/theme';
import type { Fee } from '@/types';

const GRID = 24;
const PER_ROW = 12;

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const student = useStudent(id);
  const batches = useBatches();
  const fees = useStudentFees(id);
  const month = toMonthKey();
  const attendance = useBatchMonthAttendance(student.data?.batchId, month);
  const { canWrite } = useEntitlement();
  const [payment, setPayment] = useState<PaymentTarget | null>(null);

  const s = student.data;

  // Sessions this month since the student joined: true = present.
  const sessions = useMemo(() => {
    if (!s) return [];
    return attendance.data.filter((a) => a.date >= s.joinDate).map((a) => !a.absent.includes(s.id));
  }, [attendance.data, s]);

  if (student.loading) {
    return (
      <Screen>
        <AppBar title="Student" />
        <LoadingView />
      </Screen>
    );
  }
  if (!s) {
    return (
      <Screen>
        <AppBar title="Student" />
        <EmptyState icon={UserX} title="Student not found" body="They may have been removed." />
      </Screen>
    );
  }

  const batch = batches.byId.get(s.batchId);
  const presentCount = sessions.filter(Boolean).length;
  const pct = sessions.length ? Math.round((presentCount / sessions.length) * 100) : null;
  const unpaid = fees.data.filter((f) => f.status !== 'paid');
  const dueNow = unpaid.reduce((sum, f) => sum + Math.max(0, f.amountDue - f.amountPaid), 0);
  // Footer records against the oldest unpaid month, falling back to the current one.
  const payFee: Fee | undefined =
    [...unpaid].sort((a, b) => a.month.localeCompare(b.month))[0] ??
    fees.data.find((f) => f.month === month);

  const rows = Array.from(
    { length: Math.ceil(Math.max(GRID, sessions.length) / PER_ROW) },
    (_, r) => Array.from({ length: PER_ROW }, (_, c) => sessions[r * PER_ROW + c]),
  );

  return (
    <Screen>
      <AppBar
        title="Student"
        right={
          <IconButton
            icon={Pencil}
            accessibilityLabel="Edit student"
            disabled={!canWrite}
            onPress={() => router.push({ pathname: '/student/new', params: { id: s.id } })}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={{ gap: 14 }}>
          <View style={styles.profile}>
            <Avatar name={s.name} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={[type.caption, { color: colors.muted }]} numberOfLines={1}>
                {batch?.name ?? 'No batch'} · since {dayjs(s.joinDate).format('MMM YYYY')}
              </Text>
              <Text style={[type.caption, { color: colors.muted }]} numberOfLines={1}>
                Parent: {s.parentName || '—'} · {formatPhone(s.parentPhone)}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              title="Call"
              variant="outline"
              icon={Phone}
              height={42}
              style={{ flex: 1 }}
              onPress={() => Linking.openURL('tel:+91' + s.parentPhone).catch(() => {})}
            />
            <Button
              title="WhatsApp"
              variant="whatsapp"
              height={42}
              style={{ flex: 1 }}
              onPress={() => openWhatsApp(s.parentPhone, '')}
            />
          </View>
        </Card>

        <View style={styles.stats}>
          <MiniStat
            label="Attendance"
            value={pct === null ? '—' : `${pct}%`}
            color={colors.green}
          />
          <MiniStat label="Monthly fee" value={formatINR(s.monthlyFee)} color={colors.ink} />
          <MiniStat
            label="Due now"
            value={formatINR(dueNow)}
            color={dueNow ? colors.red : colors.ink}
          />
        </View>

        <Card style={{ gap: 12 }}>
          <View style={styles.cardHeader}>
            <Text style={type.section}>{monthName(month)} attendance</Text>
            <Text style={[type.caption, { color: colors.muted }]}>
              {presentCount}/{sessions.length} classes
            </Text>
          </View>
          {attendance.loading ? (
            <LoadingView />
          ) : (
            <View style={{ gap: 6 }}>
              {rows.map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((present, c) => (
                    <View
                      key={c}
                      accessibilityLabel={
                        present === undefined ? undefined : present ? 'Present' : 'Absent'
                      }
                      style={[
                        styles.cell,
                        present === true && { backgroundColor: colors.green },
                        present === false && { backgroundColor: colors.red },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          <View style={styles.legend}>
            <LegendDot color={colors.green} label="Present" />
            <LegendDot color={colors.red} label="Absent" />
            <LegendDot color={colors.segmentBg} label="No class yet" />
          </View>
        </Card>

        <SectionHeader title="Fee history" />
        <Card padded={false}>
          {fees.loading ? (
            <LoadingView />
          ) : fees.data.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No fees yet"
              body="Fees appear from the joining month."
            />
          ) : (
            fees.data.map((f, i) => {
              const last = f.payments[f.payments.length - 1];
              const due = Math.max(0, f.amountDue - f.amountPaid);
              const sub =
                f.status === 'paid' && last
                  ? `Paid on ${dateLabel(last.date)} · ${last.mode === 'upi' ? 'UPI' : last.mode === 'cash' ? 'Cash' : 'Other'}`
                  : f.status === 'partial'
                    ? `Paid ${formatINR(f.amountPaid)} · ${formatINR(due)} due`
                    : 'Not paid yet';
              return (
                <View key={f.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.feeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={type.rowName}>{monthLabel(f.month)}</Text>
                      <Text style={[type.caption, { color: colors.muted }]}>{sub}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.amount}>{formatINR(f.amountDue)}</Text>
                      <StatusPill status={f.status} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      <StickyFooter>
        <Button
          title={dueNow ? `Record payment · ${formatINR(dueNow)} due` : 'Record payment'}
          disabled={!canWrite || !payFee}
          onPress={() => payFee && setPayment({ fee: payFee, student: s })}
        />
      </StickyFooter>
      <RecordPaymentSheet target={payment} onClose={() => setPayment(null)} />
    </Screen>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <Text style={[type.caption, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.miniValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={[type.caption, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: spacing.gap, paddingBottom: 24 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  actions: { flexDirection: 'row', gap: 10 },
  stats: { flexDirection: 'row', gap: 8 },
  miniValue: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, marginTop: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridRow: { flexDirection: 'row', gap: 5 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 5, backgroundColor: colors.segmentBg },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  feeRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.card, gap: spacing.gap },
  amount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
