/**
 * Fixture-based test data for Checkout Payment Regression automation.
 * No real card data is used — SANDBOX_* values must point to test/sandbox
 * gateway credentials configured in the test environment, never production data.
 *
 * Values that are business-rule dependent and not yet confirmed (see Test Plan
 * blockers) are left undefined rather than guessed — tests that need them are
 * skipped with an explicit reason until the value is confirmed.
 */

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required test data env var "${name}". Configure it in the test ` +
        `environment (sandbox/test bank credentials only — see fixtures/test-data.ts).`
    );
  }
  return value;
}

// Sandbox card used for all card-payment scenarios. The actual authorization
// outcome (approved/declined/timeout) is controlled per-test via gateway
// route mocking, not by which sandbox card is used.
export const sandboxCard: CardDetails = {
  number: requireEnv('SANDBOX_CARD_NUMBER'),
  expiry: requireEnv('SANDBOX_CARD_EXPIRY'),
  cvv: requireEnv('SANDBOX_CARD_CVV'),
};

export const testPromoCode = requireEnv('TEST_PROMO_CODE');

// TC-008 fixture: a recalculated cart total value used to verify the debited
// amount matches recalculation after a price change. This is arbitrary test
// fixture data, not a measured production figure.
export const recalculatedCartTotalFixture = requireEnv('TEST_RECALCULATED_CART_TOTAL');

// TC-009/010/011: the promo's real minimum-eligible-cart-value threshold is
// TBD pending business-rule confirmation (see Test Plan blockers). Tests that
// depend on it are skipped when this env var is not configured — the
// threshold is never guessed.
const promoMinCartValueRaw = process.env.PROMO_MIN_CART_VALUE;
export const promoMinCartValue: number | undefined = promoMinCartValueRaw
  ? Number(promoMinCartValueRaw)
  : undefined;