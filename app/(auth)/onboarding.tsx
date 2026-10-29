import { zodResolver } from '@hookform/resolvers/zod';
import { signOut } from '@react-native-firebase/auth';
import dayjs from 'dayjs';
import { Clock } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { DaysSelector } from '@/components/DaysSelector';
import { Field } from '@/components/Field';
import { Screen, StickyFooter } from '@/components/Screen';
import { createTutorWithBatch } from '@/data/repo';
import { auth } from '@/lib/firebase';
import { pickTime } from '@/lib/pickers';
import { useSession } from '@/store/session';
import { colors, fonts, spacing, type } from '@/theme';
import { WEEKDAYS } from '@/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  className: z.string().trim().min(2, 'Enter a class name'),
  batchName: z.string().trim().min(1, 'Enter a batch name'),
  timing: z.string().min(1, 'Pick a time'),
  monthlyFee: z
    .string()
    .regex(/^\d+$/, 'Enter the fee in whole rupees')
    .refine((v) => Number(v) > 0, 'Fee must be more than ₹0'),
  days: z.array(z.enum(WEEKDAYS)).min(1, 'Pick at least one day'),
});
type Form = z.infer<typeof schema>;

export default function Onboarding() {
  const uid = useSession((s) => s.uid);
  const phone = useSession((s) => s.phone);
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      className: '',
      batchName: '',
      timing: '5:00 PM',
      monthlyFee: '',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
  });

  const onSubmit = (f: Form) => {
    if (!uid) return;
    // The local write flips the tutor listener to "ready" and the root guard moves us to Home.
    createTutorWithBatch(uid, phone?.replace(/^\+91/, '') ?? '', {
      name: f.name.trim(),
      className: f.className.trim(),
      batch: {
        name: f.batchName.trim(),
        timing: f.timing,
        days: f.days,
        monthlyFee: Number(f.monthlyFee),
      },
    });
  };

  const chooseTime = async () => {
    const current = dayjs(getValues('timing'), 'h:mm A');
    const picked = await pickTime(current.isValid() ? current.toDate() : new Date());
    if (picked) setValue('timing', dayjs(picked).format('h:mm A'), { shouldValidate: true });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>Step 1 of 2</Text>
        <View style={styles.track}>
          <View style={styles.progress} />
        </View>
        <Text style={[type.title, { marginTop: 12 }]}>Set up your class</Text>
        <Text style={styles.sub}>Takes under a minute. You can change this later.</Text>

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              label="Your name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Priya Sharma"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="className"
          render={({ field }) => (
            <Field
              label="Class name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Priya's Tuition Classes"
              autoCapitalize="words"
              error={errors.className?.message}
            />
          )}
        />

        <Text style={[type.section, { marginTop: 8 }]}>First batch</Text>
        <Controller
          control={control}
          name="batchName"
          render={({ field }) => (
            <Field
              label="Batch name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Class 10 Maths"
              autoCapitalize="words"
              error={errors.batchName?.message}
            />
          )}
        />
        <View style={styles.row}>
          <Controller
            control={control}
            name="timing"
            render={({ field }) => (
              <Field
                label="Timing"
                value={field.value}
                onPress={chooseTime}
                leading={<Clock size={18} color={colors.muted} />}
                error={errors.timing?.message}
                style={{ flex: 1 }}
              />
            )}
          />
          <Controller
            control={control}
            name="monthlyFee"
            render={({ field }) => (
              <Field
                label="Monthly fee"
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
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[type.label, { color: colors.muted }]}>Days</Text>
          <Controller
            control={control}
            name="days"
            render={({ field }) => <DaysSelector value={field.value} onChange={field.onChange} />}
          />
          {errors.days ? (
            <Text style={[type.caption, { color: colors.red }]}>{errors.days.message}</Text>
          ) : null}
        </View>

        <Button
          title="Use a different number"
          variant="text"
          height={44}
          onPress={() => signOut(auth)}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
      <StickyFooter>
        <Button title="Continue" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      </StickyFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: 14, paddingBottom: 24 },
  step: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.segmentBg, overflow: 'hidden' },
  progress: { width: '50%', height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  sub: { ...type.body, color: colors.muted, marginTop: -8 },
  row: { flexDirection: 'row', gap: spacing.gap },
});
