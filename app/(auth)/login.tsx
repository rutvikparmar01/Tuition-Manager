import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { BookOpen, Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScroll } from '@/components/FormScroll';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { authErrorMessage } from '@/lib/authErrors';
import { auth, reportError } from '@/lib/firebase';
import { indianMobile } from '@/lib/phone';
import { useSession } from '@/store/session';
import { colors, radius, spacing, type } from '@/theme';

const FEATURES = [
  'Mark attendance in seconds',
  'Track monthly fees and dues',
  'Remind parents on WhatsApp',
];

export default function Login() {
  const [phone, setPhone] = useState(useSession.getState().pendingPhone ?? '');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  const sendOtp = async () => {
    const parsed = indianMobile.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSending(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, '+91' + parsed.data);
      useSession.getState().setConfirmation(confirmation, parsed.data);
      router.push('/otp');
    } catch (e) {
      reportError(e, 'signInWithPhoneNumber');
      setError(authErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <FormScroll contentContainerStyle={styles.body}>
        <View style={styles.logo}>
          <BookOpen size={30} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={[type.display, { marginTop: 20 }]}>Tuition Manager</Text>
        <Text style={styles.tagline}>Know who owes you, in 5 seconds.</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.feature}>
              <View style={styles.check}>
                <Check size={14} color={colors.green} strokeWidth={3} />
              </View>
              <Text style={type.body}>{f}</Text>
            </View>
          ))}
        </View>

        <Field
          label="Mobile number"
          leading="+91"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^\d\s]/g, ''))}
          placeholder="98765 43210"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={11}
          returnKeyType="done"
          onSubmitEditing={sendOtp}
          error={error}
          helper="We'll send a 6-digit OTP to verify your number."
          style={{ marginTop: 40 }}
        />
        <Button title="Send OTP" onPress={sendOtp} loading={sending} style={{ marginTop: 20 }} />
        <Text style={styles.terms}>By continuing you agree to the Terms and Privacy Policy.</Text>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 48 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: { ...type.body, fontSize: 16, color: colors.muted, marginTop: 6 },
  features: { gap: 14, marginTop: 24 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.gap },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terms: { ...type.caption, color: colors.muted, textAlign: 'center', marginTop: 20 },
});
