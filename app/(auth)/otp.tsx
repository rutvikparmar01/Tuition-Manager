import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScroll } from '@/components/FormScroll';
import { AppBar, Screen } from '@/components/Screen';
import { authErrorMessage } from '@/lib/authErrors';
import { auth, reportError } from '@/lib/firebase';
import { formatPhone } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, fonts, radius, type } from '@/theme';

const LENGTH = 6;
const RESEND_SECONDS = 30;

export default function Otp() {
  const confirmation = useSession((s) => s.confirmation);
  const phone = useSession((s) => s.pendingPhone);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!confirmation) router.replace('/login');
  }, [confirmation]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const verify = async (value = code) => {
    if (!confirmation || value.length !== LENGTH || verifying) return;
    setVerifying(true);
    setError(undefined);
    try {
      await confirmation.confirm(value);
      useSession.getState().setConfirmation(null, null);
      // onAuthStateChanged in the root layout routes to onboarding or home.
    } catch (e) {
      reportError(e, 'confirm OTP');
      setError(authErrorMessage(e));
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (!phone) return;
    setResending(true);
    setError(undefined);
    try {
      const c = await signInWithPhoneNumber(auth, '+91' + phone);
      useSession.getState().setConfirmation(c, phone);
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      reportError(e, 'resend OTP');
      setError(authErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <AppBar title="" />
      <FormScroll contentContainerStyle={styles.body}>
        <Text style={type.title}>Enter OTP</Text>
        <Text style={styles.sub}>
          Sent to{' '}
          <Text style={{ color: colors.ink, fontFamily: fonts.semibold }}>
            +91 {formatPhone(phone ?? '')}
          </Text>
          {'  '}
          <Text style={styles.link} onPress={() => router.back()} accessibilityRole="link">
            Change
          </Text>
        </Text>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.boxes}
          accessible={false}
        >
          {Array.from({ length: LENGTH }, (_, i) => {
            const active = i === code.length || (i === LENGTH - 1 && code.length === LENGTH);
            return (
              <View
                key={i}
                style={[styles.box, active && styles.boxActive, !!error && styles.boxError]}
              >
                <Text style={styles.digit}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => {
              const v = t.replace(/\D/g, '').slice(0, LENGTH);
              setCode(v);
              if (v.length === LENGTH) verify(v);
            }}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            autoFocus
            maxLength={LENGTH}
            accessibilityLabel="6-digit OTP"
            style={styles.hiddenInput}
            caretHidden
          />
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Verify"
          onPress={() => verify()}
          loading={verifying}
          disabled={code.length !== LENGTH}
          style={{ marginTop: 24 }}
        />

        <View style={styles.resendRow}>
          {secondsLeft > 0 ? (
            <Text style={styles.muted}>Resend OTP in 0:{String(secondsLeft).padStart(2, '0')}</Text>
          ) : (
            <Button
              title={resending ? 'Sending…' : 'Resend OTP'}
              variant="text"
              onPress={resend}
              disabled={resending}
              height={44}
              style={{ width: 'auto' }}
            />
          )}
        </View>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 8 },
  sub: { ...type.body, color: colors.muted, marginTop: 6 },
  link: { color: colors.primary, fontFamily: fonts.semibold },
  boxes: { flexDirection: 'row', gap: 8, marginTop: 32 },
  box: {
    flex: 1,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderWidth: 1.5, borderColor: colors.primary },
  boxError: { borderColor: colors.red },
  digit: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  error: { ...type.caption, color: colors.red, marginTop: 10 },
  resendRow: { alignItems: 'center', marginTop: 16, minHeight: 44, justifyContent: 'center' },
  muted: { ...type.label, color: colors.muted },
});
