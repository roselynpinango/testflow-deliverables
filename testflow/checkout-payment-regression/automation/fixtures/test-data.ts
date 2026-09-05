/**
 * Fixture-based test data for Checkout Payment regression.
 * No real card/CVV values are hardcoded — sandbox/test bank credentials remain
 * an open blocker (EN-2, carried forward from the Scenarios stage). Populate the
 * referenced env vars with sandbox-issued test values before executing this suite.
 */

export const testData = {
  cart: {
    // TBD: populate with the sandbox test item id once EN-2 is resolved.
    itemId: process.env.TEST_ITEM_ID ?? 'TBD',
  },
  promoCodes: {
    // TBD: populate with a sandbox-valid promo code once EN-2 is resolved.
    valid: process.env.TEST_PROMO_VALID ?? 'TBD',
    malformed: '!!invalid-format!!',
    stacked: 'STACK2',
    expired: 'EXPIRED10',
    // Oversized-input length is not sourced from a documented field limit (not measured).
    // Using an arbitrary large value to exercise the boundary; confirm the real limit
    // with the test basis before treating this as a precise boundary test.
    oversized: 'A'.repeat(2049),
    injection: '<script>alert(1)</script>',
  },
  card: {
    // TBD: sandbox/test bank credentials (EN-2 open blocker). Never populate with real card data.
    number: process.env.TEST_CARD_NUMBER ?? 'TBD',
    cvv: process.env.TEST_CARD_CVV ?? 'TBD',
    expiry: process.env.TEST_CARD_EXPIRY ?? 'TBD',
  },
};