import { Timestamp, type DocumentData } from '@react-native-firebase/firestore';

import { feeStatusFor } from '@/lib/format';
import {
  WEEKDAYS,
  type Attendance,
  type Batch,
  type Fee,
  type FeeStatus,
  type Payment,
  type PaymentMode,
  type Student,
  type SubscriptionStatus,
  type Tutor,
  type Weekday,
} from '@/types';

// Firestore data is untyped at runtime; these parsers coerce documents into safe shapes
// so a malformed or partially-written doc never crashes a screen.

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const ts = (v: unknown): Timestamp | null => (v instanceof Timestamp ? v : null);

export const DEFAULT_REMINDER_TEMPLATE =
  "Hi, this is a reminder that {student}'s fee of ₹{amount} for {month} is pending. Please pay at your earliest. — {tutor}";

const SUB_STATUSES: SubscriptionStatus[] = ['trial', 'active', 'expired'];
const FEE_STATUSES: FeeStatus[] = ['pending', 'partial', 'paid'];
const MODES: PaymentMode[] = ['cash', 'upi', 'other'];

export function parseTutor(d: DocumentData): Tutor {
  const sub = (d.subscription ?? {}) as DocumentData;
  const status = SUB_STATUSES.find((s) => s === sub.status) ?? 'expired';
  return {
    name: str(d.name),
    phone: str(d.phone),
    className: str(d.className),
    reminderTemplate: str(d.reminderTemplate) || DEFAULT_REMINDER_TEMPLATE,
    createdAt: ts(d.createdAt),
    subscription: {
      status,
      // Missing trial end ⇒ treat as already ended (fail closed to read-only, never to free).
      trialEndsAt: ts(sub.trialEndsAt) ?? Timestamp.fromMillis(0),
    },
  };
}

export function parseBatch(id: string, d: DocumentData): Batch {
  return {
    id,
    name: str(d.name, 'Batch'),
    timing: str(d.timing),
    days: strArr(d.days).filter((x): x is Weekday => (WEEKDAYS as readonly string[]).includes(x)),
    monthlyFee: num(d.monthlyFee) || undefined,
    active: bool(d.active, true),
  };
}

export function parseStudent(id: string, d: DocumentData): Student {
  return {
    id,
    name: str(d.name, 'Student'),
    parentName: str(d.parentName),
    parentPhone: str(d.parentPhone),
    batchId: str(d.batchId),
    monthlyFee: num(d.monthlyFee),
    joinDate: str(d.joinDate),
    active: bool(d.active, true),
  };
}

export function parseAttendance(id: string, d: DocumentData): Attendance {
  const date = str(d.date);
  return {
    id,
    batchId: str(d.batchId),
    date,
    month: str(d.month) || date.slice(0, 7),
    absent: strArr(d.absent),
  };
}

function parsePayment(v: unknown): Payment | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as DocumentData;
  const amount = num(p.amount);
  if (amount <= 0) return null;
  return { amount, mode: MODES.find((m) => m === p.mode) ?? 'other', date: str(p.date) };
}

export function parseFee(id: string, d: DocumentData): Fee {
  const amountDue = num(d.amountDue);
  const amountPaid = num(d.amountPaid);
  const payments = Array.isArray(d.payments)
    ? d.payments.map(parsePayment).filter((p): p is Payment => p !== null)
    : [];
  return {
    id,
    studentId: str(d.studentId) || id.split('_')[0] || '',
    month: str(d.month) || id.split('_')[1] || '',
    amountDue,
    amountPaid,
    // Stored status can lag if a doc was created by `ensureMonthlyFees` with merge; derive when absent.
    status: FEE_STATUSES.find((s) => s === d.status) ?? feeStatusFor(amountDue, amountPaid),
    payments,
  };
}
