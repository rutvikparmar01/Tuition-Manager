import { onAuthStateChanged } from '@react-native-firebase/auth';
import { getCrashlytics, setUserId } from '@react-native-firebase/crashlytics';
import { onSnapshot } from '@react-native-firebase/firestore';
import { useEffect } from 'react';

import { parseTutor } from '@/data/parse';
import { auth, reportError, tutorRef } from '@/lib/firebase';
import { useSession } from '@/store/session';

/** Mirrors Firebase Auth + the tutor doc into the session store. Mount once in the root layout. */
export function useAuthGate(): void {
  const uid = useSession((s) => s.uid);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        useSession.getState().setAuth(user ? { uid: user.uid, phone: user.phoneNumber } : null);
        if (user) setUserId(getCrashlytics(), user.uid).catch(() => {});
      }),
    [],
  );

  useEffect(() => {
    if (!uid) return;
    const { setTutor, setOffline } = useSession.getState();
    return onSnapshot(
      tutorRef(uid),
      { includeMetadataChanges: true },
      (snap) => {
        setOffline(snap.metadata.fromCache);
        if (snap.exists()) setTutor(parseTutor(snap.data()), 'ready');
        // An empty cache right after sign-in is not proof the tutor is new — wait for the server.
        else if (!snap.metadata.fromCache) setTutor(null, 'missing');
      },
      (e) => {
        reportError(e, 'tutor listener');
        setTutor(null, 'missing');
      },
    );
  }, [uid]);
}
