import { useEffect } from 'react';

import { ensureMonthlyFees, feeId } from '@/data/repo';
import { useFees, useStudents } from '@/hooks/data';
import { toMonthKey } from '@/lib/format';
import { useUid } from '@/store/session';

/**
 * On app open (and whenever students change) make sure this month's fee doc exists for every
 * active student. Runs off live listeners, so it is cheap and idempotent.
 */
export function useEnsureMonthlyFees(): void {
  const uid = useUid();
  const month = toMonthKey();
  const students = useStudents();
  const fees = useFees(month);

  useEffect(() => {
    if (students.loading || fees.loading || students.error || fees.error) return;
    const existing = new Set(fees.data.map((f) => feeId(f.studentId, f.month)));
    ensureMonthlyFees(uid, students.data, existing, month);
  }, [
    uid,
    month,
    students.data,
    students.loading,
    students.error,
    fees.data,
    fees.loading,
    fees.error,
  ]);
}
