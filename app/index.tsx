import { Redirect } from 'expo-router';

import { useSession } from '@/store/session';

// Entry point for `/` (app launch and deep links). Always accessible, so the router never lands on
// a guarded route with nothing to show; it just forwards to the right place for the current session.
export default function Index() {
  const signedIn = useSession((s) => !!s.uid);
  const hasTutor = useSession((s) => s.tutorStatus === 'ready');

  if (!signedIn) return <Redirect href="/login" />;
  return <Redirect href={hasTutor ? '/home' : '/onboarding'} />;
}
