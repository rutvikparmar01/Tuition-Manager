import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Contact } from 'expo-contacts';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  ChevronRight,
  Contact as ContactIcon,
  Info,
  MessageCircle,
} from 'lucide-react-native';
import { useEffect, useEffectEvent, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { PlanBanner } from '@/components/PlanBanner';
import { AppBar, LoadingView, Screen, StickyFooter } from '@/components/Screen';
import { Select } from '@/components/Select';
import { addStudent, updateStudent } from '@/data/repo';
import { useBatches, useStudent } from '@/hooks/data';
import { useEntitlement } from '@/hooks/useEntitlement';
import {
  dateLabel,
  formatINR,
  monthName,
  normalizeIndianPhone,
  toDateKey,
  toMonthKey,
} from '@/lib/format';
import { reportError } from '@/lib/firebase';
import { indianMobile } from '@/lib/phone';
import { pickDate } from '@/lib/pickers';
import { useUid } from '@/store/session';
import { colors, fonts, radius, spacing, type } from '@/theme';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the student’s name'),
  parentName: z.string().trim(),
  parentPhone: indianMobile,
  batchId: z.string().min(1, 'Pick a batch'),
  monthlyFee: z
    .string()
    .regex(/^\d+$/, 'Enter the fee in whole rupees')
    .refine((v) => Number(v) > 0, 'Fee must be more than ₹0'),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

export default function AddStudent() {
  const uid = useUid();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useStudent(id);
  const batches = useBatches();
  const { canWrite } = useEntitlement();
  const andAnother = useRef(false);

  const { control, handleSubmit, reset, setValue, getValues, formState } = useForm<
    FormIn,
    unknown,
    FormOut
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      parentName: '',
      parentPhone: '',
      batchId: '',
      monthlyFee: '',
      joinDate: toDateKey(),
    },
  });
  const { errors } = formState;
  const feeInput = useWatch({ control, name: 'monthlyFee' });
  const joinDate = useWatch({ control, name: 'joinDate' });

  // Edit mode: load the student once.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    const s = editing.data;
    if (!s || loadedFor.current === s.id) return;
    loadedFor.current = s.id;
    reset({
      name: s.name,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      batchId: s.batchId,
      monthlyFee: String(s.monthlyFee),
      joinDate: s.joinDate || toDateKey(),
    });
  }, [editing.data, reset]);

  const onBatchChange = (batchId: string) => {
    setValue('batchId', batchId, { shouldValidate: true });
    const fee = batches.byId.get(batchId)?.monthlyFee;
    if (fee && !getValues('monthlyFee')) setValue('monthlyFee', String(fee));
  };

  // New student: default to the only batch, if there is just one.
  const selectOnlyBatch = useEffectEvent(() => {
    const only = batches.data.length === 1 ? batches.data[0] : undefined;
    if (!id && only && !getValues('batchId')) onBatchChange(only.id);
  });
  useEffect(() => selectOnlyBatch(), [batches.data]);

  const pickContact = async () => {
    try {
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const [fullName, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
      const mobile = phones
        .map((p) => normalizeIndianPhone(p.number ?? ''))
        .find((n) => /^[6-9]\d{9}$/.test(n));
      if (fullName) setValue('parentName', fullName);
      if (mobile) setValue('parentPhone', mobile, { shouldValidate: true });
      else Alert.alert('No mobile number', 'This contact has no 10-digit Indian mobile number.');
    } catch (e) {
      reportError(e, 'pickContact');
      Alert.alert('Could not open contacts', 'Please type the number instead.');
    }
  };

  const chooseJoinDate = async () => {
    const picked = await pickDate(dayjs(getValues('joinDate')).toDate());
    if (picked) setValue('joinDate', toDateKey(picked));
  };

  const onSubmit = (f: FormOut) => {
    const data = {
      name: f.name.trim(),
      parentName: f.parentName.trim(),
      parentPhone: f.parentPhone,
      batchId: f.batchId,
      monthlyFee: Number(f.monthlyFee),
      joinDate: f.joinDate,
    };
    if (id) {
      updateStudent(uid, id, data);
      router.back();
      return;
    }
    addStudent(uid, data);
    if (andAnother.current) {
      reset({ ...f, name: '', parentName: '', parentPhone: '' });
    } else {
      router.back();
    }
  };

  const submit = (another: boolean) => {
    andAnother.current = another;
    void handleSubmit(onSubmit)();
  };

  if (id && editing.loading) {
    return (
      <Screen>
        <AppBar title="Edit student" close />
        <LoadingView />
      </Screen>
    );
  }

  const fee = Number(feeInput) || 0;
  const currentMonth = toMonthKey();
  const showFeeNote = !id && fee > 0 && toMonthKey(joinDate) <= currentMonth;

  return (
    <Screen>
      <AppBar title={id ? 'Edit student' : 'Add student'} close />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!canWrite ? <PlanBanner /> : null}

        {!id ? (
          <Pressable
            accessibilityRole="button"
            onPress={pickContact}
            style={({ pressed }) => [styles.contactTile, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.contactIcon}>
              <ContactIcon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.rowName, { color: colors.primary }]}>Pick from contacts</Text>
              <Text style={[type.caption, { color: colors.muted }]}>
                Fill the parent’s name and number
              </Text>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </Pressable>
        ) : null}

        <Text style={type.section}>Student</Text>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label="Student name"
              required
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Aarav Patel"
              autoCapitalize="words"
              error={errors.name?.message}
            />
          )}
        />

        <Text style={type.section}>Parent</Text>
        <Controller
          control={control}
          name="parentName"
          render={({ field }) => (
            <Field
              label="Parent name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Rakesh Patel"
              autoCapitalize="words"
            />
          )}
        />
        <Controller
          control={control}
          name="parentPhone"
          render={({ field }) => (
            <Field
              label="Parent WhatsApp number"
              required
              leading="+91"
              trailing={<MessageCircle size={18} color={colors.whatsapp} />}
              value={field.value}
              onChangeText={(t) => field.onChange(t.replace(/[^\d\s]/g, ''))}
              onBlur={field.onBlur}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={11}
              error={errors.parentPhone?.message}
              helper="Fee reminders and receipts go to this number."
            />
          )}
        />

        <Text style={type.section}>Batch and fee</Text>
        <Controller
          control={control}
          name="batchId"
          render={({ field }) => (
            <Select
              label="Batch"
              required
              value={field.value || null}
              onChange={onBatchChange}
              placeholder={batches.data.length ? 'Select batch' : 'No batches yet'}
              options={batches.data.map((b) => ({
                value: b.id,
                label: b.timing ? `${b.name} · ${b.timing}` : b.name,
              }))}
              error={errors.batchId?.message}
            />
          )}
        />
        <View style={styles.row}>
          <Controller
            control={control}
            name="monthlyFee"
            render={({ field }) => (
              <Field
                label="Monthly fee"
                required
                leading="₹"
                value={field.value}
                onChangeText={(t) => field.onChange(t.replace(/\D/g, ''))}
                onBlur={field.onBlur}
                placeholder="1,500"
                keyboardType="number-pad"
                maxLength={6}
                error={errors.monthlyFee?.message}
                style={{ flex: 1 }}
              />
            )}
          />
          <Field
            label="Joining date"
            value={dateLabel(joinDate)}
            onPress={chooseJoinDate}
            leading={<Calendar size={18} color={colors.muted} />}
            style={{ flex: 1 }}
          />
        </View>

        {showFeeNote ? (
          <View style={styles.note}>
            <Info size={16} color={colors.primary} />
            <Text style={styles.noteText}>
              {monthName(currentMonth)} fee of {formatINR(fee)} will be added as pending.
            </Text>
          </View>
        ) : null}
        {id ? (
          <Text style={[type.caption, { color: colors.muted }]}>
            Fee changes apply from next month. This month’s fee stays as recorded.
          </Text>
        ) : null}
      </ScrollView>

      <StickyFooter>
        <Button
          title={id ? 'Save changes' : 'Save student'}
          onPress={() => submit(false)}
          disabled={!canWrite}
        />
        {!id ? (
          <Button
            title="Save and add another"
            variant="text"
            height={44}
            onPress={() => submit(true)}
            disabled={!canWrite}
          />
        ) : null}
      </StickyFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: 14, paddingBottom: 24 },
  contactTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    padding: 14,
    borderRadius: radius.row,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: spacing.gap },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.input,
    backgroundColor: colors.primaryTint,
  },
  noteText: { ...type.caption, flex: 1, color: colors.primary, fontFamily: fonts.medium },
});
