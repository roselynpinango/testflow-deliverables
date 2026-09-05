/**
 * Fixture-based test data for Checkout Payment Regression automation.
 * No real card data or hardcoded amounts — all values come from environment
 * variables set for the sandbox environment. If a variable is not configured,
 * the dependent test is skipped rather than falling back to a fabricated value
 * (ISO/IEC 42001 — no invented figures).
 */

export interface CardFixture {
  number: string;
  cvv: string;
  expiry: string;
}

export interface CheckoutTestData {
  cartTotal: number | undefined;
  promoFixedDiscount: number | undefined;
  declineCard: CardFixture;
  validCard: CardFixture;
  timeoutSimCard: CardFixture;
  oversizedPromoCode: string;
  injectionPromoCode: string;
  maxPromoCodeLength: number | undefined;
}

function parseNumberEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function loadCheckoutTestData(): CheckoutTestData {
  return {
    // TC-001: relational assertion only (capture == cartTotal - discount) —
    // exact figures come from sandbox config, never invented here.
    cartTotal: parseNumberEnv('SANDBOX_CART_TOTAL'),
    promoFixedDiscount: parseNumberEnv('SANDBOX_PROMO_FIXED_DISCOUNT'),

    declineCard: {
      number: process.env.SANDBOX_DECLINE_CARD_NUMBER ?? '',
      cvv: process.env.SANDBOX_DECLINE_CARD_CVV ?? '',
      expiry: process.env.SANDBOX_DECLINE_CARD_EXPIRY ?? '',
    },
    validCard: {
      number: process.env.SANDBOX_VALID_CARD_NUMBER ?? '',
      cvv: process.env.SANDBOX_VALID_CARD_CVV ?? '',
      expiry: process.env.SANDBOX_VALID_CARD_EXPIRY ?? '',
    },
    timeoutSimCard: {
      number: process.env.SANDBOX_TIMEOUT_CARD_NUMBER ?? '',
      cvv: process.env.SANDBOX_TIMEOUT_CARD_CVV ?? '',
      expiry: process.env.SANDBOX_TIMEOUT_CARD_EXPIRY ?? '',
    },

    // Deliberately test-authored injection/oversized payloads — not app data.
    injectionPromoCode: process.env.SANDBOX_INJECTION_PROMO_PAYLOAD ?? "PROMO' OR '1'='1",
    oversizedPromoCode: 'A'.repeat(2048),
    maxPromoCodeLength: parseNumberEnv('SANDBOX_PROMO_CODE_MAX_LENGTH'),
  };
}