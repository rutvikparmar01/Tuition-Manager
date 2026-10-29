import { signOut } from '@react-native-firebase/auth';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  ChevronRight,
  Lock,
  LogOut,
  MessageCircle,
  SquareCheck,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, Divider } from '@/components/Card';
import { Field } from '@/components/Field';
import { Pill } from '@/components/Pill';
import { AppBar, Screen } from '@/components/Screen';
import { DEFAULT_REMINDER_TEMPLATE } from '@/data/parse';
import { updateReminderTemplate } from '@/data/repo';
import { useEntitlement } from '@/hooks/useEntitlement';
import { auth } from '@/lib/firebase';
import { toMonthKey } from '@/lib/format';
import { logOutPurchases, restorePurchases, subscribeYearly } from '@/lib/purchases';
import { buildReminder, openWhatsApp, TEMPLATE_TOKENS } from '@/lib/whatsapp';
import { useSession, useUid } from '@/store/session';
import { colors, fonts, radius, spacing, type } from '@/theme';

// TODO(you): set these in .env (see .env.example).
const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? '';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';
const PLAY_SUBSCRIPTIONS = 'https://play.google.com/store/account/subscriptions';

export default function Settings() {
  const uid = useUid();
  const tutor = useSession((s) => s.tutor);
  const ent = useEntitlement();
  const [buying, setBuying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const subscribe = async () => {
    setBuying(true);
    const result = await subscribeYearly();
    setBuying(false);
    if (result === 'purchased') Alert.alert('Thank you!', 'Your subscription is active.');
    else if (result === 'unavailable')
      Alert.alert('Not available yet', 'Subscriptions are not set up on this build.');
    else if (result === 'failed') Alert.alert('Purchase failed', 'Please try again in a moment.');
  };

  const restore = async () => {
    const ok = await restorePurchases();
    Alert.alert(
      ok ? 'Restored' : 'Nothing to restore',
      ok
        ? 'Your subscription is active.'
        : 'No active subscription was found for this Google account.',
    );
  };

  const logOut = () =>
    Alert.alert('Log out?', 'Your data stays safe in your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logOutPurchases();
          await signOut(auth);
        },
      },
    ]);

  const template = tutor?.reminderTemplate ?? DEFAULT_REMINDER_TEMPLATE;
  const preview = buildReminder(editing ? draft : template, {
    student: 'Aarav',
    amount: 1500,
    month: toMonthKey(),
    tutor: tutor?.name ?? 'Tutor',
  });

  return (
    <Screen>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.plan}>
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Your plan</Text>
            {ent.status === 'trial' ? (
              <Pill
                label={`Trial · ${ent.daysLeft} ${ent.daysLeft === 1 ? 'day' : 'days'} left`}
                tone="amber"
                size="md"
              />
            ) : ent.status === 'active' ? (
              <Pill label="Active" tone="green" size="md" />
            ) : (
              <Pill label="Trial ended" tone="red" size="md" />
            )}
          </View>
          <Text>
            <Text style={styles.price}>₹199</Text>
            <Text style={[type.body, { color: colors.muted }]}> / year</Text>
          </Text>
          <Text style={[type.body, { color: colors.muted }]}>
            Unlimited students, attendance, fees and WhatsApp reminders. Cancel anytime on Google
            Play.
          </Text>
          {ent.status === 'active' ? (
            <Button
              title="Manage on Google Play"
              variant="outline"
              onPress={() => Linking.openURL(PLAY_SUBSCRIPTIONS).catch(() => {})}
            />
          ) : (
            <>
              {ent.status === 'expired' ? (
                <View style={styles.readOnly}>
                  <Lock size={14} color={colors.red} />
                  <Text style={[type.caption, { color: colors.red, flex: 1 }]}>
                    Read-only until you subscribe. You can still view everything.
                  </Text>
                </View>
              ) : null}
              <Button title="Subscribe for ₹199/year" onPress={subscribe} loading={buying} />
              <Text style={[type.caption, { color: colors.muted }]}>
                Your data stays safe even after the trial ends.{' '}
                <Text style={styles.link} onPress={restore} accessibilityRole="link">
                  Restore purchase
                </Text>
              </Text>
            </>
          )}
        </View>

        <Card style={{ gap: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={type.section}>WhatsApp reminder message</Text>
            {!editing ? (
              <Pressable
                hitSlop={12}
                accessibilityRole="button"
                disabled={!ent.canWrite}
                onPress={() => {
                  setDraft(template);
                  setEditing(true);
                }}
              >
                <Text style={[styles.link, !ent.canWrite && { opacity: 0.4 }]}>Edit</Text>
              </Pressable>
            ) : null}
          </View>

          {editing ? (
            <>
              <Field
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                accessibilityLabel="Reminder message template"
              />
              <View style={styles.tokens}>
                {TEMPLATE_TOKENS.map((t) => (
                  <Pressable
                    key={t}
                    accessibilityRole="button"
                    accessibilityLabel={`Insert ${t}`}
                    onPress={() => setDraft((d) => `${d}${d.endsWith(' ') || !d ? '' : ' '}${t}`)}
                    style={styles.token}
                  >
                    <Text style={styles.tokenText}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[type.caption, { color: colors.muted }]}>Preview</Text>
              <Text style={styles.templateBox}>{preview}</Text>
              <View style={styles.rowBetween}>
                <Button
                  title="Reset"
                  variant="text"
                  height={44}
                  style={{ width: 'auto' }}
                  onPress={() => setDraft(DEFAULT_REMINDER_TEMPLATE)}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    height={44}
                    style={{ width: 'auto' }}
                    onPress={() => setEditing(false)}
                  />
                  <Button
                    title="Save"
                    height={44}
                    style={{ width: 'auto' }}
                    disabled={!draft.trim()}
                    onPress={() => {
                      updateReminderTemplate(uid, draft.trim());
                      setEditing(false);
                    }}
                  />
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.templateBox}>{template}</Text>
          )}
        </Card>

        <Card padded={false}>
          <Row icon={Users} label="Class details" onPress={() => router.push('/class-details')} />
          <Divider />
          <Row icon={SquareCheck} label="Batches" onPress={() => router.push('/batches')} />
          <Divider />
          <Row
            icon={MessageCircle}
            label="Help on WhatsApp"
            onPress={() =>
              SUPPORT_WHATSAPP
                ? openWhatsApp(SUPPORT_WHATSAPP, 'Hi, I need help with Tuition Manager.')
                : Alert.alert('Coming soon', 'Support chat is not set up yet.')
            }
          />
          <Divider />
          <Row
            icon={Lock}
            label="Privacy policy"
            onPress={() =>
              PRIVACY_URL
                ? Linking.openURL(PRIVACY_URL).catch(() => {})
                : Alert.alert('Coming soon', 'The privacy policy link is not set up yet.')
            }
          />
          <Divider />
          <Row icon={LogOut} label="Log out" danger onPress={logOut} />
        </Card>

        <Text style={styles.version}>Version {Constants.expoConfig?.version ?? '—'}</Text>
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.red : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]}
    >
      <Icon size={20} color={danger ? colors.red : colors.muted} />
      <Text style={[type.body, { flex: 1, color, fontFamily: fonts.medium }]}>{label}</Text>
      {!danger ? <ChevronRight size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.screen, gap: spacing.gap, paddingBottom: 32 },
  plan: {
    gap: 12,
    padding: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  price: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: radius.input,
    backgroundColor: colors.redTint,
  },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  templateBox: {
    ...type.body,
    fontSize: 14,
    padding: 12,
    borderRadius: radius.input,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  token: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  tokenText: { fontFamily: fonts.medium, fontSize: 13, color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.card,
    minHeight: 52,
  },
  version: { ...type.caption, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
