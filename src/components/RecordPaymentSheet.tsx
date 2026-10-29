import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { OptionGroup } from '@/components/Segmented';
import { recordPayment } from '@/data/repo';
import { dateLabel, formatINR, monthLabel, toDateKey } from '@/lib/format';
import { pickDate } from '@/lib/pickers';
import { buildReceipt, openWhatsApp } from '@/lib/whatsapp';
import { useSession, useUid } from '@/store/session';
import { colors, radius, spacing, type } from '@/theme';
import type { DateKey, Fee, PaymentMode, Student } from '@/types';

export interface PaymentTarget {
  fee: Fee;
  student: Student;
}

interface Props {
  /** Non-null opens the sheet for that student/month. */
  target: PaymentTarget | null;
  onClose: () => void;
}

const MODES: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
];

export function RecordPaymentSheet({ target, onClose }: Props) {
  const ref = useRef<ComponentRef<typeof BottomSheetModal>>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (target) ref.current?.present();
    else ref.current?.dismiss();
  }, [target]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, { backgroundColor: colors.scrim }]}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        {target ? (
          <PaymentForm
            key={target.fee.id + target.fee.amountPaid}
            target={target}
            onDone={() => ref.current?.dismiss()}
          />
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function PaymentForm({ target, onDone }: { target: PaymentTarget; onDone: () => void }) {
  const uid = useUid();
  const tutorName = useSession((s) => s.tutor?.name ?? '');
  const { fee, student } = target;
  const due = Math.max(0, fee.amountDue - fee.amountPaid);

  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [mode, setMode] = useState<PaymentMode>('upi');
  const [date, setDate] = useState<DateKey>(toDateKey());
  const [sendReceipt, setSendReceipt] = useState(true);
  const [error, setError] = useState<string>();

  const chooseDate = async () => {
    const picked = await pickDate(new Date(date), { maximumDate: new Date() });
    if (picked) setDate(toDateKey(picked));
  };

  const save = () => {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError('Enter an amount in whole rupees');
      return;
    }
    const next = recordPayment(uid, fee, { amount: value, mode, date });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (sendReceipt && student.parentPhone) {
      void openWhatsApp(
        student.parentPhone,
        buildReceipt({
          student: student.name,
          amount: value,
          month: fee.month,
          date,
          mode,
          balance: Math.max(0, next.amountDue - next.amountPaid),
          tutor: tutorName,
        }),
      );
    }
    onDone();
  };

  return (
    <View style={{ gap: 14 }}>
      <Text style={type.appBar}>Record payment</Text>
      <View style={styles.summary}>
        <Avatar name={student.name} />
        <View style={{ flex: 1 }}>
          <Text style={type.rowName} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={[type.caption, { color: colors.muted }]}>
            {monthLabel(fee.month)} · Due {formatINR(due)}
          </Text>
        </View>
      </View>

      <Field
        inSheet
        label="Amount received"
        leading="₹"
        value={amount}
        onChangeText={(t) => {
          setAmount(t.replace(/\D/g, ''));
          setError(undefined);
        }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
      />

      <View style={{ gap: 6 }}>
        <Text style={[type.label, { color: colors.muted }]}>Payment mode</Text>
        <OptionGroup options={MODES} value={mode} onChange={setMode} />
      </View>

      <Field
        label="Date"
        value={dateLabel(date)}
        onPress={chooseDate}
        leading={<Calendar size={18} color={colors.muted} />}
      />

      <View style={styles.switchRow}>
        <Text style={[type.body, { flex: 1 }]}>Send receipt on WhatsApp</Text>
        <Switch
          value={sendReceipt}
          onValueChange={setSendReceipt}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.white}
          accessibilityLabel="Send receipt on WhatsApp"
        />
      </View>

      <Button title="Save payment" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.card, borderRadius: radius.sheet },
  handle: { backgroundColor: colors.border, width: 40 },
  body: { paddingHorizontal: spacing.screen, paddingTop: 4 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    padding: spacing.row,
    borderRadius: radius.row,
    backgroundColor: colors.bg,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
});
