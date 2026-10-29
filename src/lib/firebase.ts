import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { getCrashlytics, recordError } from '@react-native-firebase/crashlytics';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
} from '@react-native-firebase/firestore';

// Native Firebase is configured from google-services.json at build time; no JS init needed.
// Firestore keeps an on-device cache by default, so listeners serve cached data while offline.
export const auth = getAuth();
export const db = getFirestore();

const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
if (__DEV__ && useEmulator) {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '10.0.2.2';
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
}

export type SubCollection = 'batches' | 'students' | 'attendance' | 'fees';

export const tutorRef = (uid: string) => doc(db, 'tutors', uid);
export const colRef = (uid: string, name: SubCollection) => collection(db, 'tutors', uid, name);
export const docRef = (uid: string, name: SubCollection, id: string) =>
  doc(db, 'tutors', uid, name, id);

/** Writes resolve only once the server acks; we never await them in UI flows, just report failures. */
export function reportError(e: unknown, context?: string): void {
  const err = e instanceof Error ? e : new Error(String(e));
  if (__DEV__) console.warn(context ?? 'error', err);
  try {
    recordError(getCrashlytics(), err, context);
  } catch {
    // Crashlytics unavailable (e.g. tests) — nothing else to do.
  }
}
