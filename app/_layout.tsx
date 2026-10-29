import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthGate } from '@/hooks/useAuthGate';
import { useSession } from '@/store/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  useAuthGate();
  const authReady = useSession((s) => s.authReady);
  const signedIn = useSession((s) => !!s.uid);
  const tutorStatus = useSession((s) => s.tutorStatus);

  // Keep the splash up until we know where to send the user.
  const ready = fontsLoaded && authReady && !(signedIn && tutorStatus === 'loading');
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const hasTutor = signedIn && tutorStatus === 'ready';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
          >
            {/* Unguarded so `/` always resolves; it redirects based on the session. */}
            <Stack.Screen name="index" />
            <Stack.Protected guard={hasTutor}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="student/[id]" />
              <Stack.Screen name="student/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" />
              <Stack.Screen name="class-details" />
              <Stack.Screen name="batches" />
              <Stack.Screen name="batch-edit" />
            </Stack.Protected>
            <Stack.Protected guard={!hasTutor}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
