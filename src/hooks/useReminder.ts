import { useCallback } from 'react';

import { buildReminder, openWhatsApp } from '@/lib/whatsapp';
import { useSession } from '@/store/session';
import type { Fee, Student } from '@/types';

/** Returns `remind(student, fee)` which opens WhatsApp with the tutor's reminder template filled in. */
export function useReminder() {
  const tutor = useSession((s) => s.tutor);
  return useCallback(
    (student: Student, fee: Fee) => {
      if (!tutor) return;
      const message = buildReminder(tutor.reminderTemplate, {
        student: student.name,
        amount: Math.max(0, fee.amountDue - fee.amountPaid),
        month: fee.month,
        tutor: tutor.name,
      });
      void openWhatsApp(student.parentPhone, message);
    },
    [tutor],
  );
}
