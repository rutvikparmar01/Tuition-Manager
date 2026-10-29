import { Tabs } from 'expo-router/tabs';

import { BottomNav } from '@/components/BottomNav';
import { useEnsureMonthlyFees } from '@/hooks/useEnsureMonthlyFees';
import { usePurchases } from '@/hooks/usePurchases';
import { colors } from '@/theme';

export default function TabsLayout() {
  useEnsureMonthlyFees();
  usePurchases();
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="attendance" />
      <Tabs.Screen name="fees" />
      <Tabs.Screen name="students" />
    </Tabs>
  );
}
