/**
 * Fixture-based test data for Checkout Payment Regression automation.
 * All sandbox identifiers are sourced from environment variables — no real
 * card data or credentials are hardcoded here. Where an env var is not
 * configured, a clearly-marked TBD placeholder is used so failures are
 * traceable to missing configuration rather than a silent wrong value.
 */

export interface CardFixture {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export const validSandboxCard: CardFixture = {
  cardNumber: process.env.SANDBOX_CARD_VALID_NUMBER ?? 'TBD-SANDBOX-VALID-CARD-NUMBER',
  expiry: process.env.SANDBOX_CARD_VALID_EXPIRY ?? 'TBD-SANDBOX-VALID-EXPIRY',
  cvv: process.env.SANDBOX_CARD_VALID_CVV ?? 'TBD-SANDBOX-VALID-CVV',
};

export const declineSandboxCard: CardFixture = {
  cardNumber: process.env.SANDBOX_CARD_DECLINE_NUMBER ?? 'TBD-SANDBOX-DECLINE-CARD-NUMBER',
  expiry: process.env.SANDBOX_CARD_DECLINE_EXPIRY ?? 'TBD-SANDBOX-DECLINE-EXPIRY',
  cvv: process.env.SANDBOX_CARD_DECLINE_CVV ?? 'TBD-SANDBOX-DECLINE-CVV',
};

// Deliberately malformed (2-digit) CVV for negative-path validation testing.
export const invalidCvv = process.env.SANDBOX_CVV_INVALID_FORMAT ?? '9X';

export const promoCodes = {
  percentage: process.env.SANDBOX_PROMO_PERCENTAGE ?? 'TBD-PROMO-PERCENTAGE',
  flat: process.env.SANDBOX_PROMO_FLAT ?? 'TBD-PROMO-FLAT',
  expired: process.env.SANDBOX_PROMO_EXPIRED ?? 'TBD-PROMO-EXPIRED',
} as const;

/**
 * Generates a unique idempotency key per test invocation so tests remain
 * independent and never share mutable retry state across runs.
 */
export function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}