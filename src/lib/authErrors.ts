/** Maps Firebase Auth error codes to short, user-facing messages. */
export function authErrorMessage(e: unknown): string {
  const code = typeof e === 'object' && e && 'code' in e ? String(e.code) : '';
  if (code.includes('network')) return 'No internet connection. Check your network and try again.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
  if (code.includes('invalid-phone-number')) return 'That mobile number looks invalid.';
  if (code.includes('invalid-verification-code')) return 'Incorrect OTP. Please check and retry.';
  if (code.includes('session-expired') || code.includes('code-expired'))
    return 'This OTP has expired. Tap Resend to get a new one.';
  return 'Something went wrong. Please try again.';
}
