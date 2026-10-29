import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import type { DateKey, FeeStatus, MonthKey } from '@/types';

dayjs.extend(customParseFormat);

/** ₹ with Indian digit grouping, e.g. `₹1,25,000`. Amounts are whole rupees. */
export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** `98765 43210` */
export function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
}

/** Keeps the last 10 digits, so `+91 98765-43210` and `098765 43210` both become `9876543210`. */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export const toDateKey = (d: Date | dayjs.Dayjs = new Date()): DateKey =>
  dayjs(d).format('YYYY-MM-DD');
export const toMonthKey = (d: Date | dayjs.Dayjs | DateKey = new Date()): MonthKey =>
  dayjs(d).format('YYYY-MM');

/** `Oct 2026` */
export const monthLabel = (m: MonthKey) => dayjs(m + '-01').format('MMM YYYY');
/** `October` */
export const monthName = (m: MonthKey) => dayjs(m + '-01').format('MMMM');
/** `29 Oct 2026` */
export const dateLabel = (d: DateKey) => dayjs(d).format('D MMM YYYY');

export function feeStatusFor(amountDue: number, amountPaid: number): FeeStatus {
  if (amountPaid >= amountDue) return 'paid';
  if (amountPaid > 0) return 'partial';
  return 'pending';
}

export function greeting(now = dayjs()): string {
  const h = now.hour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Batch timings are stored as display strings (`5:00 PM`); this gives a sortable value. */
export function timingToMinutes(timing: string): number {
  const t = dayjs(timing, ['h:mm A', 'H:mm'], true);
  return t.isValid() ? t.hour() * 60 + t.minute() : Number.MAX_SAFE_INTEGER;
}
