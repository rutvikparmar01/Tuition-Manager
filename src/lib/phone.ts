import { z } from 'zod';

import { normalizeIndianPhone } from '@/lib/format';

/** 10-digit Indian mobile (starts 6–9). Accepts spaces/dashes/+91 and normalises to 10 digits. */
export const indianMobile = z
  .string()
  .transform(normalizeIndianPhone)
  .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number');

export const isIndianMobile = (raw: string) => indianMobile.safeParse(raw).success;
