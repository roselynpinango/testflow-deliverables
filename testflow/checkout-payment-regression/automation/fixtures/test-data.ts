/**
 * Fixture-based test data. No credentials or endpoints are hardcoded — all
 * sandbox values are sourced from environment variables so the suite never
 * embeds real or plausible-looking card data in source control.
 *
 * Open item (carried from Test Basis, owner TBD): sandbox/test bank credential
 * and promo code availability for execution is not yet confirmed.
 */
export const testData = {
  sandboxCard: {
    number: process.env.SANDBOX_CARD_NUMBER,
    expiry: process.env.SANDBOX_CARD_EXPIRY,
    cvv: process.env.SANDBOX_CARD_CVV,
  },
  promoCodes: {
    active: process.env.PROMO_CODE_ACTIVE,
    expired: process.env.PROMO_CODE_EXPIRED,
    secondValid: process.env.PROMO_CODE_SECOND_VALID,
    // Synthetic literal for a negative-path lookup — not a credential, not app data.
    nonExistent: 'QA-NONEXISTENT-CODE-0001',
  },
  // TBD in Test Basis: "Exact maximum accepted length for promo code field — not specified".
  maxPromoCodeLength: process.env.PROMO_CODE_MAX_LENGTH
    ? Number(process.env.PROMO_CODE_MAX_LENGTH)
    : undefined,
};