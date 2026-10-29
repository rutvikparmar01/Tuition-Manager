import { router } from 'expo-router';
import { ChevronLeft, CloudOff, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useSession } from '@/store/session';
import { colors, spacing, type } from '@/theme';

/** Safe-area screen shell with the offline banner. Tab screens skip the bottom edge (BottomNav owns it). */
export function Screen({
  children,
  tab = false,
  style,
}: {
  children: ReactNode;
  tab?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={tab ? ['top'] : ['top', 'bottom']} style={[styles.screen, style]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <OfflineBanner />
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function OfflineBanner() {
  const offline = useSession((s) => s.offline);
  if (!offline) return null;
  return (
    <View style={styles.offline} accessibilityRole="alert">
      <CloudOff size={14} color={colors.amber} />
      <Text style={styles.offlineText}>Offline — changes will sync when you reconnect.</Text>
    </View>
  );
}

/** Large page header used on tab screens: title + subtitle, optional right element. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.label, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Compact app bar for pushed screens: back/close, title, optional right action. */
export function AppBar({
  title,
  close = false,
  right,
}: {
  title: string;
  close?: boolean;
  right?: ReactNode;
}) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.appBar}>
      <IconButton
        icon={close ? X : ChevronLeft}
        onPress={goBack}
        accessibilityLabel={close ? 'Close' : 'Back'}
      />
      <Text style={[type.appBar, { flex: 1 }]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** White footer pinned to the bottom of a screen, for the primary action. */
export function StickyFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={[type.body, { color: colors.muted }]}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon size={24} color={colors.primary} />
      </View>
      <Text style={[type.section, { textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[type.body, { color: colors.muted, textAlign: 'center' }]}>{body}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 8, width: 'auto' }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.screen,
    paddingVertical: 6,
    backgroundColor: colors.amberTint,
  },
  offlineText: { ...type.caption, color: colors.amber },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 16,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gap,
    paddingHorizontal: spacing.screen,
    paddingVertical: 10,
  },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.screen,
    paddingVertical: 12,
    gap: 4,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
