import { signOut } from '@react-native-firebase/auth';
import { CloudOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { auth } from '@/lib/firebase';
import { colors, type } from '@/theme';

const SLOW_MS = 15_000;

/**
 * Shown after sign-in while we wait for the server to say whether this tutor already has a profile.
 * If Firestore never answers (offline, or the project has no database yet) we explain instead of
 * spinning forever, and offer a way back to the login screen.
 */
export function AccountLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        {slow ? (
          <>
            <CloudOff size={36} color={colors.muted} />
            <Text style={[type.section, styles.center]}>Can’t reach the server</Text>
            <Text style={[type.body, styles.center, { color: colors.muted }]}>
              Check your internet connection. We’ll continue automatically once it’s back.
            </Text>
            <Button
              title="Log out"
              variant="outline"
              onPress={() => signOut(auth)}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[type.body, { color: colors.muted }]}>Loading your account…</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  center: { textAlign: 'center' },
});
