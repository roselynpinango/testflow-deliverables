/**
 * Test basis: Approved Scenarios / Approved Cases — Checkout Card Payment,
 * Promo, and Stock Validation Regression.
 * Covers: TC-006, TC-008 (Medium), TC-009, TC-010, TC-011 (Medium/Boundary).
 * Draft artifact — not approved/signed off. See open items below.
 */
import { test, expect } from '../fixtures/checkout.fixture';
import {
  sandboxCard,
  testPromoCode,
  recalculatedCartTotalFixture,
  promoMinCartValue,
} from '../fixtures/test-data';

test.describe('Checkout Card Payment Regression — Medium Risk', () => {
  test('TC-006: payment submission is rejected when CVV contains invalid characters', async ({
    page,
    checkoutPage,
  }) => {
    let gatewayWasCalled = false;
    await page.route('**/api/payments/authorize', (route) => {
      gatewayWasCalled = true;
      route.continue();
    });

    await checkoutPage.fillCardDetails({ ...sandboxCard, cvv: '12a' });
    await checkoutPage.submitPayment();

    const message = await checkoutPage.getValidationMessageText();
    expect(
      message,
      `Expected a generic invalid-CVV validation message, got "${message}"`
    ).toMatch(/invalid cvv/i);
    expect(
      message,
      'Validation message must not leak stack traces, error codes, or system detail'
    ).not.toMatch(/stack|exception|trace|error code/i);
    expect(
      gatewayWasCalled,
      'Payment with an invalid CVV must be rejected client-side and never reach the gateway'
    ).toBeFalsy();
  });

  test('TC-008: bank debit matches recalculated cart total after a price change with promo applied', async ({
    page,
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await checkoutPage.applyPromoCode(testPromoCode);

    // Simulate the recalculated total (promo discount + updated item price) that the
    // cart service would return after a price change occurs before capture.
    await page.route('**/api/cart/total', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: recalculatedCartTotalFixture }),
      })
    );

    await mockGatewayAuthorization('approved');
    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    const displayedTotal = await checkoutPage.getCartTotalText();
    const debitedAmount = await checkoutPage.getDebitedAmountText();

    expect(
      debitedAmount,
      `Expected the debited amount to equal the recalculated cart total "${displayedTotal}", got "${debitedAmount}"`
    ).toBe(displayedTotal);
  });

  test('TC-009: promo is rejected when cart total is one unit below the minimum eligible value', async ({
    page,
    checkoutPage,
  }) => {
    test.skip(
      promoMinCartValue === undefined,
      'PROMO_MIN_CART_VALUE not configured — threshold is TBD pending business-rule confirmation (Test Plan blocker)'
    );
    const belowThreshold = promoMinCartValue! - 1;
    await page.route('**/api/cart/total', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: belowThreshold }),
      })
    );

    await checkoutPage.applyPromoCode(testPromoCode);
    const message = await checkoutPage.getPromoResultMessage();
    expect(
      message,
      `Expected a promo-rejection message when cart total (${belowThreshold}) is below the minimum eligible value, got "${message}"`
    ).toMatch(/minimum/i);
  });

  test('TC-010: promo is applied when cart total is exactly at the minimum eligible value', async ({
    page,
    checkoutPage,
  }) => {
    test.skip(
      promoMinCartValue === undefined,
      'PROMO_MIN_CART_VALUE not configured — threshold is TBD pending business-rule confirmation (Test Plan blocker)'
    );
    await page.route('**/api/cart/total', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: promoMinCartValue }),
      })
    );

    await checkoutPage.applyPromoCode(testPromoCode);
    const totalText = await checkoutPage.getCartTotalText();
    expect(
      totalText,
      `Expected the promo discount to be applied and reflected in the cart total when total is exactly at the minimum (${promoMinCartValue}), got "${totalText}"`
    ).not.toBe(String(promoMinCartValue));
  });

  test('TC-011: promo is applied when cart total is one unit above the minimum eligible value', async ({
    page,
    checkoutPage,
  }) => {
    test.skip(
      promoMinCartValue === undefined,
      'PROMO_MIN_CART_VALUE not configured — threshold is TBD pending business-rule confirmation (Test Plan blocker)'
    );
    const aboveThreshold = promoMinCartValue! + 1;
    await page.route('**/api/cart/total', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: aboveThreshold }),
      })
    );

    await checkoutPage.applyPromoCode(testPromoCode);
    const totalText = await checkoutPage.getCartTotalText();
    expect(
      totalText,
      `Expected the promo discount to be applied and reflected in the cart total when total is one unit above the minimum (${aboveThreshold}), got "${totalText}"`
    ).not.toBe(String(aboveThreshold));
  });
});