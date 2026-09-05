import { test, expect } from '../fixtures/checkout.fixture';
import { requireEnv } from '../helpers/env';

/**
 * Covers: TC-001 (critical), TC-009 (critical), TC-008 (medium)
 * Quality characteristic under test: functional suitability (ISO/IEC 25010) —
 * amount-integrity accuracy of the checkout payment flow.
 * Traceability: Scenario 1/7/6 -> R-01, R-01, R-05.
 */

test.describe('Checkout payment amount integrity', () => {
  test('TC-001: gateway authorization amount matches displayed cart total after promo + stock recalculation', async ({
    checkoutPage,
    checkoutApi,
  }) => {
    const promoCode = requireEnv('TEST_PROMO_CODE_VALID');
    const itemId = requireEnv('TEST_STOCK_ADJUSTABLE_ITEM_ID');

    await checkoutPage.applyPromoCode(promoCode);
    await checkoutApi.triggerStockAdjustment(itemId);
    await checkoutPage.reloadCart();

    const displayedTotalCents = await checkoutPage.getDisplayedTotalCents();
    await checkoutPage.submitPayment();
    const orderId = await checkoutPage.getOrderId();

    const authorization = await checkoutApi.getPaymentStatus(orderId);

    expect(
      authorization.amountInCents,
      `Gateway authorization amount for order ${orderId} must equal the displayed cart total of ${displayedTotalCents} cents to the cent`
    ).toBe(displayedTotalCents);
  });

  test('TC-009: minimum chargeable amount after maximum promo discount is accepted by the gateway', async ({
    checkoutPage,
    checkoutApi,
  }) => {
    const maxDiscountPromo = requireEnv('TEST_PROMO_CODE_MAX_DISCOUNT');

    await checkoutPage.applyPromoCode(maxDiscountPromo);
    const displayedTotalCents = await checkoutPage.getDisplayedTotalCents();

    await checkoutPage.submitPayment();
    const orderId = await checkoutPage.getOrderId();

    const authorization = await checkoutApi.getPaymentStatus(orderId);

    expect(
      authorization.status,
      `Gateway authorization for the minimum chargeable amount on order ${orderId} must succeed, got status "${authorization.status}"`
    ).toBe('authorized');

    expect(
      authorization.amountInCents,
      `Authorized amount for order ${orderId} must equal the minimum chargeable total of ${displayedTotalCents} cents displayed in the UI`
    ).toBe(displayedTotalCents);
  });

  test('TC-008: recalculated price after cart change matches UI display and captured payment amount', async ({
    checkoutPage,
    checkoutApi,
  }) => {
    const promoCode = requireEnv('TEST_PROMO_CODE_VALID');
    const unavailableItemId = requireEnv('TEST_ITEM_BECOMES_UNAVAILABLE_ID');

    await checkoutPage.applyPromoCode(promoCode);
    await checkoutApi.markItemUnavailable(unavailableItemId);
    await checkoutPage.reloadCart();

    const recalculatedTotalCents = await checkoutPage.getDisplayedTotalCents();
    await checkoutPage.submitPayment();
    const orderId = await checkoutPage.getOrderId();

    const payment = await checkoutApi.getPaymentStatus(orderId);

    expect(
      payment.capturedAmountInCents,
      `Captured amount for order ${orderId} must exactly equal the recalculated total of ${recalculatedTotalCents} cents shown in the UI`
    ).toBe(recalculatedTotalCents);
  });
});