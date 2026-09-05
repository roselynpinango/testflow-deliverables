/**
 * Non-secret, provisional test-data constants.
 * Anything sensitive (promo codes, card tokens, item ids, order ids, session tokens)
 * is NOT stored here — it is read from env vars via helpers/env.ts at test time.
 */

// TC-002 / Scenario 2: the exact order-state label is explicitly marked TBD in the
// Approved Cases artifact, pending confirmation of the stock validation timing model.
// This constant reproduces the illustrative label already used in TC-002 — it is not
// a fabricated fact, but it MUST be revisited once the real state model is confirmed.
export const PROVISIONAL_PENDING_FULFILLMENT_REVIEW_STATE = 'pending_fulfillment_review';