import { Alert, Linking } from 'react-native';

import { dateLabel, formatINR, monthName } from '@/lib/format';
import type { DateKey, MonthKey, PaymentMode } from '@/types';

export const TEMPLATE_TOKENS = ['{student}', '{amount}', '{month}', '{tutor}'] as const;

interface ReminderVars {
  student: string;
  /** Whole rupees; rendered with Indian grouping but no ₹ (the template supplies it). */
  amount: number;
  month: MonthKey;
  tutor: string;
}

export function buildReminder(template: string, v: ReminderVars): string {
  return template
    .replaceAll('{student}', v.student)
    .replaceAll('{amount}', Math.round(v.amount).toLocaleString('en-IN'))
    .replaceAll('{month}', monthName(v.month))
    .replaceAll('{tutor}', v.tutor);
}

const MODE_LABEL: Record<PaymentMode, string> = { cash: 'cash', upi: 'UPI', other: 'other mode' };

export function buildReceipt(v: {
  student: string;
  amount: number;
  month: MonthKey;
  date: DateKey;
  mode: PaymentMode;
  balance: number;
  tutor: string;
}): string {
  const balance = v.balance > 0 ? ` Balance due: ${formatINR(v.balance)}.` : '';
  return (
    `Received ${formatINR(v.amount)} for ${v.student}'s ${monthName(v.month)} fee ` +
    `on ${dateLabel(v.date)} via ${MODE_LABEL[v.mode]}.${balance} Thank you! — ${v.tutor}`
  );
}

/** Opens a WhatsApp chat with a 10-digit Indian number and a prefilled message. */
export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message);
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open WhatsApp', 'Make sure WhatsApp is installed on this phone.');
  }
}
