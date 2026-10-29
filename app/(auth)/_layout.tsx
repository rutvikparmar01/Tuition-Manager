import { Stack } from 'expo-router';

import { useSession } from '@/store/session';
import { colors } from '@/theme';

export default function AuthLayout() {
  const signedIn = useSession((s) => !!s.uid);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
