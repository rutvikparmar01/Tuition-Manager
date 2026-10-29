import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScroll } from '@/components/FormScroll';
import { DaysSelector } from '@/components/DaysSelector';
import { Field } from '@/components/Field';
import { AppBar, Screen, StickyFooter } from '@/components/Screen';
import { saveBatch } from '@/data/repo';
import { useBatches, useStudents } from '@/hooks/data';
import { pickTime } from '@/lib/pickers';
import { useUid } from '@/store/session';
import { colors, spacing, type } from '@/theme';
import type { Weekday } from '@/types';

export default function BatchEdit() {
  const uid = useUid();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const batches = useBatches();
  const students = useStudents();
  const existing = id ? batches.byId.get(id) : undefined;

  // Batches are already in the live cache when we arrive from the list, so read them once.
  const [name, setName] = useState(existing?.name ?? '');
  const [timing, setTiming] = useState(existing?.timing ?? '5:00 PM');
  const [fee, setFee] = useState(existing?.monthlyFee ? String(existing.monthlyFee) : '');
  const [days, setDays] = useState<Weekday[]>(existing?.days ?? ['Mon', 'Wed', 'Fri']);
  const [showErrors, setShowErrors] = useState(false);

  const errors = {
    name: name.trim() ? undefined : 'Enter a batch name',
    days: days.length ? undefined : 'Pick at least one day',
  };
  const valid = !errors.name && !errors.days;

  const save = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    saveBatch(uid, {
      id,
      name: name.trim(),
      timing,
      days,
      monthlyFee: Number(fee) || 0,
      active: true,
    });
    router.back();
  };

  const archive = () => {
    if (!id || !existing) return;
    const inBatch = students.data.filter((s) => s.batchId === id).length;
    if (inBatch > 0) {
      Alert.alert('Batch has students', `Move its ${inBatch} students to another batch first.`);
      return;
    }
    Alert.alert('Remove batch?', `${existing.name} will be hidden. Past attendance is kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          saveBatch(uid, { ...existing, active: false });
          router.back();
        },
      },
    ]);
  };

  const chooseTime = async () => {
    const current = dayjs(timing, 'h:mm A');
    const picked = await pickTime(current.isValid() ? current.toDate() : new Date());
    if (picked) setTiming(dayjs(picked).format('h:mm A'));
  };

  return (
    <Screen>
      <AppBar title={id ? 'Edit batch' : 'Add batch'} />
      <FormScroll contentContainerStyle={styles.body}>
        <Field
          label="Batch name"
          required
          value={name}
          onChangeText={setName}
          placeholder="Class 10 Maths"
          autoCapitalize="words"
          error={showErrors ? errors.name : undefined}
        />
        <View style={styles.row}>
          <Field
            label="Timing"
            value={timing}
            onPress={chooseTime}
            leading={<Clock size={18} color={colors.muted} />}
            style={{ flex: 1 }}
          />
          <Field
            label="Monthly fee"
            leading="₹"
            value={fee}
            onChangeText={(t) => setFee(t.replace(/\D/g, ''))}
            placeholder="1,500"
            keyboardType="number-pad"
            maxLength={6}
            helper="Default for new students"
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[type.label, { color: colors.muted }]}>Days</Text>
          <DaysSelector value={days} onChange={setDays} />
          {showErrors && errors.days ? (
            <Text style={[type.caption, { color: colors.red }]}>{errors.days}</Text>
          ) : null}
        </View>
        {id ? (
          <Button
            title="Remove batch"
            variant="text"
            height={44}
            onPress={archive}
            style={{ marginTop: 8 }}
          />
        ) : null}
      </FormScroll>
      <StickyFooter>
        <Button title="Save batch" onPress={save} />
      </StickyFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: 14 },
  row: { flexDirection: 'row', gap: spacing.gap },
});
