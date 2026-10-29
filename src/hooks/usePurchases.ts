import { useEffect } from 'react';

import { initPurchases } from '@/lib/purchases';
import { useUid } from '@/store/session';

/** Ties RevenueCat to the signed-in tutor while the main app is mounted. */
export function usePurchases(): void {
  const uid = useUid();
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    void initPurchases(uid).then((c) => {
      if (cancelled) c();
      else cleanup = c;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [uid]);
}
