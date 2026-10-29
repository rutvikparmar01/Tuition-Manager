import type { ConfirmationResult } from '@react-native-firebase/auth';
import { create } from 'zustand';

import type { Tutor } from '@/types';

export type TutorStatus = 'idle' | 'loading' | 'missing' | 'ready';

interface SessionState {
  /** True once Firebase Auth has reported the persisted user (or lack of one). */
  authReady: boolean;
  uid: string | null;
  phone: string | null;
  tutor: Tutor | null;
  tutorStatus: TutorStatus;
  /** Derived from snapshot metadata: true while Firestore is serving from the on-device cache. */
  offline: boolean;
  /** Pending phone verification between the Login and OTP screens. Not serialisable, memory only. */
  confirmation: ConfirmationResult | null;
  pendingPhone: string | null;
  /** RevenueCat entitlement is active on this device. */
  storeEntitled: boolean;

  setAuth: (user: { uid: string; phone: string | null } | null) => void;
  setTutor: (tutor: Tutor | null, status: TutorStatus) => void;
  setOffline: (offline: boolean) => void;
  setConfirmation: (c: ConfirmationResult | null, phone: string | null) => void;
  setStoreEntitled: (v: boolean) => void;
}

export const useSession = create<SessionState>()((set) => ({
  authReady: false,
  uid: null,
  phone: null,
  tutor: null,
  tutorStatus: 'idle',
  offline: false,
  confirmation: null,
  pendingPhone: null,
  storeEntitled: false,

  setAuth: (user) =>
    set(
      user
        ? { authReady: true, uid: user.uid, phone: user.phone, tutorStatus: 'loading' }
        : { authReady: true, uid: null, phone: null, tutor: null, tutorStatus: 'idle' },
    ),
  setTutor: (tutor, tutorStatus) => set({ tutor, tutorStatus }),
  setOffline: (offline) => set({ offline }),
  setConfirmation: (confirmation, pendingPhone) => set({ confirmation, pendingPhone }),
  setStoreEntitled: (storeEntitled) => set({ storeEntitled }),
}));

/** For hooks that only run inside the signed-in area. */
export function useUid(): string {
  const uid = useSession((s) => s.uid);
  if (!uid) throw new Error('useUid() called while signed out');
  return uid;
}
