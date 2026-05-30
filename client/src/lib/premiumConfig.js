// Manual UPI premium pilot.
// Move to Razorpay/UPI AutoPay before real scale.

export const PREMIUM_PRICE_INR = 179;
export const FREE_AI_WEEKLY_LIMIT = 5;

export const UPI_ID = 'vaibhavvarunmr@okicici';
export const UPI_PAYEE_NAME = 'ChildBloom';
export const SUPPORT_EMAIL = 'childbloomenterprise@gmail.com';

export function buildUpiUrl({ amount = PREMIUM_PRICE_INR, note = 'ChildBloom Premium' } = {}) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: String(amount),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

// Opens email to childbloomenterprise@gmail.com so user can attach payment screenshot.
export function buildProofEmailUrl(email) {
  const subject = encodeURIComponent('ChildBloom Premium — Payment Proof');
  const body = encodeURIComponent(
    `Hi,\n\nI've paid ₹${PREMIUM_PRICE_INR} for ChildBloom Premium.\n\n` +
    `Account email: ${email || '(your account email)'}\n\n` +
    `Attaching my UPI payment screenshot.\n\nThank you!`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export const PREMIUM_BENEFITS = [
  'Unlimited Dr. Bloom AI chats',
  'Weekly AI insight summaries',
  'Doctor-ready PDF reports',
  'Family sharing & multiple children',
  'Premium multilingual voice',
];
