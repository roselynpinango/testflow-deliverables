import { test, expect } from '../fixtures/checkout-fixtures';

/**
 * Risk band: Critical (R-01 — amount integrity across promo types).
 * Covers Approved Scenarios 1–2 / Approved Cases TC-001..TC-004.
 */
test.describe('Checkout Payment Regression — Promo Discount Amount Integrity (R-01)', () => {
  // TC-001 — @smoke @critical @risk-critical
  test('TC-001: gateway capture amount equals cart total minus single fixed promo discount', async ({
    checkoutPage,
    gatewaySandbox,
    testData,
  }) => {
    test.skip(
      testData.cartTotal === undefined || testData.promoFixedDiscount === undefined,
      'Sandbox test data not configured: set SANDBOX_CART_TOTAL and SANDBOX_PROMO_FIXED_DISCOUNT env vars.'
    );
    test.skip(!testData.validCard.number, 'SANDBOX_VALID_CARD_NUMBER not configured.');

    const promoCode = process.env.SANDBOX_FIXED_PROMO_CODE;
    test.skip(!promoCode, 'SANDBOX_FIXED_PROMO_CODE not configured.');

    await checkoutPage.applyPromoCode(promoCode!);
    await checkoutPage.fillCard(testData.validCard);
    await checkoutPage.submitPayment();

    const orderId = await checkoutPage.getOrderId();
    const captureAmount = await gatewaySandbox.getCaptureAmount(orderId);
    const expectedAmount = testData.cartTotal! - testData.promoFixedDiscount!;

    expect(
      captureAmount,
      `Gateway capture amount for order ${orderId} was ${captureAmount}, expected cart total (${testData.cartTotal}) minus fixed discount (${testData.promoFixedDiscount}) = ${expectedAmount}`
    ).toBe(expectedAmount);
  });

  // TC-002 — @regression @data-driven @risk-critical (percentage promo)
  test.fixme(
    'TC-002: gateway capture amount reflects correct discount for a percentage-type promo',
    async () => {
      // Blocked: Approved Scenarios Examples table marks expected_amount as
      // "TBD — tester to supply sandbox test data". No percentage rate or
      // expected total was supplied in the test basis; implementing this
      // assertion now would require fabricating a figure, which is prohibited.
    }
  );

  // TC-003 — @regression @data-driven @risk-critical (fixed_amount promo, distinct rate from TC-001)
  test.fixme(
    'TC-003: gateway capture amount reflects correct discount for a fixed-amount-type promo',
    async () => {
      // Blocked: same TBD condition as TC-002 — sandbox fixed discount value
      // and expected total not supplied in the test basis.
    }
  );

  // TC-004 — @regression @data-driven @risk-critical (stacked promo)
  test.fixme(
    'TC-004: gateway capture amount reflects correct discount for a stacked promo combination',
    async () => {
      // Blocked: same TBD condition — sandbox stacking rule and expected
      // total not supplied in the test basis.
    }
  );
});