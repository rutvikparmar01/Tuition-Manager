import { useEffect, useState } from 'react';

import { useSession } from '@/store/session';

const DAY_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 60 * 60 * 1000;

export interface Entitlement {
  status: 'trial' | 'active' | 'expired';
  /** Whole days left in the trial (0 unless status is 'trial'). */
  daysLeft: number;
  /** False once the trial has ended without a subscription: the app becomes read-only. */
  canWrite: boolean;
}

/** Current time, refreshed hourly so a trial that ends while the app is open locks it. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * Combines the server-side subscription on the tutor doc with RevenueCat's on-device entitlement.
 * RevenueCat wins immediately after a purchase; the doc wins on other devices / after reinstall
 * (it should be kept in sync by a RevenueCat webhook — see README).
 */
export function useEntitlement(): Entitlement {
  const sub = useSession((s) => s.tutor?.subscription);
  const storeEntitled = useSession((s) => s.storeEntitled);
  const now = useNow();

  if (storeEntitled || sub?.status === 'active') {
    return { status: 'active', daysLeft: 0, canWrite: true };
  }
  const msLeft = sub && sub.status === 'trial' ? sub.trialEndsAt.toMillis() - now : 0;
  if (msLeft > 0) {
    return { status: 'trial', daysLeft: Math.ceil(msLeft / DAY_MS), canWrite: true };
  }
  return { status: 'expired', daysLeft: 0, canWrite: false };
}
