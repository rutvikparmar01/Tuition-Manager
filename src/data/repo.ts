import {
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { colRef, db, docRef, reportError, tutorRef } from '@/lib/firebase';
import { feeStatusFor, toMonthKey } from '@/lib/format';
import { DEFAULT_REMINDER_TEMPLATE } from '@/data/parse';
import type { Batch, DateKey, Fee, MonthKey, Payment, Student } from '@/types';

// All writes are fire-and-forget: Firestore applies them to the local cache immediately
// (listeners update at once, offline included) and the promise only settles on server ack.
// UI code calls these and moves on; failures go to Crashlytics.

const TRIAL_DAYS = 30;

export const feeId = (studentId: string, month: MonthKey) => `${studentId}_${month}`;
export const attendanceId = (batchId: string, date: DateKey) => `${batchId}_${date}`;
const newId = (uid: string, col: 'batches' | 'students') => doc(colRef(uid, col)).id;

function fire(p: Promise<unknown>, context: string): void {
  p.catch((e: unknown) => reportError(e, context));
}

export interface OnboardingInput {
  name: string;
  className: string;
  batch: Omit<Batch, 'id' | 'active'>;
}

export function createTutorWithBatch(uid: string, phone: string, input: OnboardingInput): void {
  const b = writeBatch(db);
  b.set(tutorRef(uid), {
    name: input.name,
    phone,
    className: input.className,
    reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
    createdAt: serverTimestamp(),
    subscription: {
      status: 'trial',
      trialEndsAt: Timestamp.fromMillis(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  b.set(docRef(uid, 'batches', newId(uid, 'batches')), { ...input.batch, active: true });
  fire(b.commit(), 'createTutorWithBatch');
}

export function updateTutorProfile(uid: string, data: { name: string; className: string }): void {
  fire(updateDoc(tutorRef(uid), data), 'updateTutorProfile');
}

export function updateReminderTemplate(uid: string, reminderTemplate: string): void {
  fire(updateDoc(tutorRef(uid), { reminderTemplate }), 'updateReminderTemplate');
}

export function saveBatch(uid: string, batch: Omit<Batch, 'id'> & { id?: string }): string {
  const { id = newId(uid, 'batches'), ...rest } = batch;
  // Firestore rejects `undefined` field values.
  const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  fire(setDoc(docRef(uid, 'batches', id), data, { merge: true }), 'saveBatch');
  return id;
}

function newFeeDoc(student: Pick<Student, 'id' | 'monthlyFee'>, month: MonthKey) {
  return {
    studentId: student.id,
    month,
    amountDue: student.monthlyFee,
    amountPaid: 0,
    status: 'pending' as const,
    payments: [] as Payment[],
  };
}

/** Creates the student and, if they have already joined, this month's pending fee. */
export function addStudent(uid: string, student: Omit<Student, 'id' | 'active'>): string {
  const id = newId(uid, 'students');
  const b = writeBatch(db);
  b.set(docRef(uid, 'students', id), { ...student, active: true });
  const month = toMonthKey();
  if (toMonthKey(student.joinDate) <= month) {
    b.set(docRef(uid, 'fees', feeId(id, month)), newFeeDoc({ id, ...student }, month));
  }
  fire(b.commit(), 'addStudent');
  return id;
}

export function updateStudent(uid: string, id: string, data: Partial<Omit<Student, 'id'>>): void {
  fire(updateDoc(docRef(uid, 'students', id), data), 'updateStudent');
}

/**
 * Idempotently makes sure every active student who has joined has a fee doc for `month`.
 * `existingFeeIds` must come from a live listener on that month so we only create missing docs;
 * deterministic IDs make a duplicate run converge on the same document.
 */
export function ensureMonthlyFees(
  uid: string,
  students: Student[],
  existingFeeIds: Set<string>,
  month: MonthKey,
): number {
  const missing = students.filter(
    (s) =>
      s.active &&
      s.monthlyFee > 0 &&
      toMonthKey(s.joinDate) <= month &&
      !existingFeeIds.has(feeId(s.id, month)),
  );
  if (!missing.length) return 0;
  const b = writeBatch(db);
  for (const s of missing) {
    // merge: if the cache was stale and the doc exists server-side, payments are left intact.
    // amountPaid / status / payments are omitted on purpose; parseFee defaults them.
    b.set(
      docRef(uid, 'fees', feeId(s.id, month)),
      { studentId: s.id, month, amountDue: s.monthlyFee },
      { merge: true },
    );
  }
  fire(b.commit(), 'ensureMonthlyFees');
  return missing.length;
}

export function saveAttendance(
  uid: string,
  batchId: string,
  date: DateKey,
  absent: string[],
): void {
  fire(
    setDoc(docRef(uid, 'attendance', attendanceId(batchId, date)), {
      batchId,
      date,
      month: date.slice(0, 7),
      absent,
      updatedAt: serverTimestamp(),
    }),
    'saveAttendance',
  );
}

export function recordPayment(uid: string, fee: Fee, payment: Payment): Fee {
  const amountPaid = fee.amountPaid + payment.amount;
  const next: Fee = {
    ...fee,
    amountPaid,
    status: feeStatusFor(fee.amountDue, amountPaid),
    payments: [...fee.payments, payment],
  };
  fire(
    setDoc(
      docRef(uid, 'fees', fee.id),
      {
        studentId: next.studentId,
        month: next.month,
        amountDue: next.amountDue,
        amountPaid: next.amountPaid,
        status: next.status,
        payments: next.payments,
      },
      { merge: true },
    ),
    'recordPayment',
  );
  return next;
}
