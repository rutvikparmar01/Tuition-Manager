import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, PartyPopper, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { RecordPaymentSheet, type PaymentTarget } from '@/components/RecordPaymentSheet';
import { EmptyState, LoadingView, Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { DefaulterRow, StudentRow } from '@/components/StudentRow';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useFeeRows, type FeeRow } from '@/hooks/useFeeRows';
import { useReminder } from '@/hooks/useReminder';
import { formatINR, monthLabel, toMonthKey } from '@/lib/format';
import { colors, fonts, spacing, type } from '@/theme';
import type { MonthKey } from '@/types';

type Tab = 'pending' | 'paid';

export default function Fees() {
  const current = toMonthKey();
  const [month, setMonth] = useState<MonthKey>(current);
  const [tab, setTab] = useState<Tab>('pending');
  const [payment, setPayment] = useState<PaymentTarget | null>(null);
  const fees = useFeeRows(month);
  const remind = useReminder();
  const { canWrite } = useEntitlement();

  const shift = (n: number) => setMonth(toMonthKey(dayjs(month + '-01').add(n, 'month')));
  const progress = fees.total ? Math.min(1, fees.collected / fees.total) : 0;
  const list = tab === 'pending' ? fees.pending : fees.paid;

  const open = (r: FeeRow) => {
    if (canWrite && r.fee.status !== 'paid') setPayment({ fee: r.fee, student: r.student });
    else router.push(`/student/${r.student.id}`);
  };

  return (
    <Screen tab>
      <View style={styles.header}>
        <Text style={[type.title, { flex: 1 }]}>Fees</Text>
        <IconButton
          icon={ChevronLeft}
          onPress={() => shift(-1)}
          accessibilityLabel="Previous month"
        />
        <Text style={styles.month}>{monthLabel(month)}</Text>
        <IconButton
          icon={ChevronRight}
          onPress={() => shift(1)}
          disabled={month >= current}
          accessibilityLabel="Next month"
        />
      </View>

      {fees.loading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(r) => r.fee.id}
          contentContainerStyle={styles.body}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={
            <View style={{ gap: spacing.gap, marginBottom: spacing.gap }}>
              <Card style={{ gap: 10 }}>
                <Text style={[type.label, { color: colors.muted, fontFamily: fonts.regular }]}>
                  Collected {month === current ? 'this month' : `in ${monthLabel(month)}`}
                </Text>
                <Text>
                  <Text style={styles.big}>{formatINR(fees.collected)}</Text>
                  <Text style={[type.body, { color: colors.muted }]}>
                    {' '}
                    of {formatINR(fees.total)}
                  </Text>
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={styles.legend}>
                  <Dot color={colors.green} />
                  <Text style={styles.legendText}>{fees.paid.length} paid</Text>
                  <Dot color={colors.red} />
                  <Text style={styles.legendText}>
                    {fees.pending.length} pending · {formatINR(fees.dueTotal)}
                  </Text>
                </View>
              </Card>
              <Segmented<Tab>
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'pending', label: `Pending (${fees.pending.length})` },
                  { value: 'paid', label: `Paid (${fees.paid.length})` },
                ]}
              />
            </View>
          }
          ListEmptyComponent={
            <Card>
              {fees.rows.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title="No fees for this month"
                  body="Fees are added automatically for every active student."
                />
              ) : tab === 'pending' ? (
                <EmptyState icon={PartyPopper} title="Everyone has paid" />
              ) : (
                <EmptyState icon={ReceiptText} title="No payments yet" />
              )}
            </Card>
          }
          renderItem={({ item: r }) => {
            const meta = `${r.batch?.name ?? 'No batch'} · ${dayjs(month + '-01').format('MMM')}`;
            return tab === 'pending' ? (
              <DefaulterRow
                name={r.student.name}
                meta={r.fee.status === 'partial' ? `${meta} · part paid` : meta}
                amount={r.due}
                onPress={() => open(r)}
                onRemind={() => remind(r.student, r.fee)}
              />
            ) : (
              <StudentRow
                name={r.student.name}
                meta={meta}
                amount={r.fee.amountPaid}
                status={r.fee.status}
                onPress={() => open(r)}
              />
            );
          }}
        />
      )}
      <RecordPaymentSheet target={payment} onClose={() => setPayment(null)} />
    </Screen>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 12,
  },
  month: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    minWidth: 76,
    textAlign: 'center',
  },
  body: { paddingHorizontal: spacing.screen, paddingBottom: 24 },
  big: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.segmentBg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { ...type.caption, color: colors.muted, marginRight: 8 },
});
