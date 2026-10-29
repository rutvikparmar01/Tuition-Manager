import type { Timestamp } from '@react-native-firebase/firestore';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type SubscriptionStatus = 'trial' | 'active' | 'expired';
export type FeeStatus = 'pending' | 'partial' | 'paid';
export type PaymentMode = 'cash' | 'upi' | 'other';

/** `YYYY-MM-DD` */
export type DateKey = string;
/** `YYYY-MM` */
export type MonthKey = string;

export interface Tutor {
  name: string;
  phone: string;
  className: string;
  reminderTemplate: string;
  createdAt: Timestamp | null;
  subscription: {
    status: SubscriptionStatus;
    trialEndsAt: Timestamp;
  };
}

export interface Batch {
  id: string;
  name: string;
  timing: string;
  days: Weekday[];
  /** Default fee for new students in this batch (whole rupees). */
  monthlyFee?: number;
  active: boolean;
}

export interface Student {
  id: string;
  name: string;
  parentName: string;
  /** 10-digit Indian mobile, without +91 */
  parentPhone: string;
  batchId: string;
  /** Whole rupees */
  monthlyFee: number;
  joinDate: DateKey;
  active: boolean;
}

export interface Attendance {
  id: string;
  batchId: string;
  date: DateKey;
  /** Denormalised from `date` so a batch's month can be queried with equality filters only. */
  month: MonthKey;
  absent: string[];
}

export interface Payment {
  /** Whole rupees */
  amount: number;
  mode: PaymentMode;
  date: DateKey;
}

export interface Fee {
  id: string;
  studentId: string;
  month: MonthKey;
  amountDue: number;
  amountPaid: number;
  status: FeeStatus;
  payments: Payment[];
}
