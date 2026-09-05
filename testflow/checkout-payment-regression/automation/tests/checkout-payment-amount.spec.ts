import { test, expect } from '../fixtures/checkout.fixtures';
import { captureGatewayChargeAmount } from '../helpers/paymentGateway';
import { simulateStockDepletionBeforeCapture } from '../helpers/stockSimulation';

/**
 * Covers: TC-001, TC-004, TC-005 (R-01, critical) and TC-002 (R-02, high).
 * Quality characteristic: functional suitability (correctness), plus
 * reliability of order/payment state consistency for TC-002.
 *
 * Precondition assumption (open item, owner TBD per Test Basis): cart is
 * seeded with a stock-limited item and reachable at "/checkout" before each
 * test. Replace with the real seeding mechanism once confirmed.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/checkout');
});

test.describe('Payment amount integrity — critical', () => {
  test('TC-001: gateway amount reflects combined promo discount and stock-adjusted price', async ({
    checkoutPage,
    page,
    testData,
  }) => {
    test.skip(
      !testData.promoCodes.active || !testData.sandboxCard.number,
      'PROMO_CODE_ACTIVE / SANDBOX_CARD_* env vars not configured — sandbox data unavailable (TBD)'
    );

    await checkoutPage.applyPromoCode(testData.promoCodes.active!);
    const expectedAmount = await checkoutPage.readAmount(
      checkoutPage.cartTotalAfterDiscountAndStockAdjustment
    );
    await checkoutPage.enterCardDetails(
      testData.sandboxCard.number!,
      testData.sandboxCard.expiry!,
      testData.sandboxCard.cvv!
    );

    const chargedAmount = await captureGatewayChargeAmount(page, () => checkoutPage.submitPayment());
    expect(
      chargedAmount,
      'Amount sent to payment gateway must equal cart total minus promo discount, adjusted for stock-limited pricing'
    ).toBeCloseTo(expectedAmount, 2);

    const confirmationAmount = await checkoutPage.readAmount(checkoutPage.orderConfirmationAmount);
    expect(
      confirmationAmount,
      'Order confirmation displayed amount must match the amount charged to the gateway'
    ).toBeCloseTo(chargedAmount, 2);
  });

  test('TC-004: charged amount reflects promo discount only when stock is sufficient', async ({
    checkoutPage,
    page,
    testData,
  }) => {
    test.skip(
      !testData.promoCodes.active || !testData.sandboxCard.number,
      'PROMO_CODE_ACTIVE / SANDBOX_CARD_* env vars not configured (TBD)'
    );

    await checkoutPage.applyPromoCode(testData.promoCodes.active!);
    const expectedAmount = await checkoutPage.readAmount(checkoutPage.cartTotalAfterDiscount);
    await checkoutPage.enterCardDetails(
      testData.sandboxCard.number!,
      testData.sandboxCard.expiry!,
      testData.sandboxCard.cvv!
    );

    const chargedAmount = await captureGatewayChargeAmount(page, () => checkoutPage.submitPayment());
    expect(
      chargedAmount,
      'With sufficient stock, gateway amount must equal cart total minus promo discount only (no stock adjustment)'
    ).toBeCloseTo(expectedAmount, 2);
  });

  test('TC-005: charged amount reflects stock-adjusted price only when no promo is applied', async ({
    checkoutPage,
    page,
    testData,
  }) => {
    test.skip(!testData.sandboxCard.number, 'SANDBOX_CARD_* env vars not configured (TBD)');

    const expectedAmount = await checkoutPage.readAmount(
      checkoutPage.cartTotalAfterDiscountAndStockAdjustment
    );
    await checkoutPage.enterCardDetails(
      testData.sandboxCard.number!,
      testData.sandboxCard.expiry!,
      testData.sandboxCard.cvv!
    );

    const chargedAmount = await captureGatewayChargeAmount(page, () => checkoutPage.submitPayment());
    expect(
      chargedAmount,
      'With no promo applied, gateway amount must equal the stock-adjusted item price only'
    ).toBeCloseTo(expectedAmount, 2);
  });
});

test.describe('Order-payment state consistency — high', () => {
  test('TC-002: order stays "not confirmed" when stock depletes before capture completes', async ({
    checkoutPage,
    page,
    testData,
  }) => {
    test.skip(!testData.sandboxCard.number, 'SANDBOX_CARD_* env vars not configured (TBD)');

    await simulateStockDepletionBeforeCapture(page);
    await checkoutPage.enterCardDetails(
      testData.sandboxCard.number!,
      testData.sandboxCard.expiry!,
      testData.sandboxCard.cvv!
    );
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.orderStatus,
      'Order status must remain "not confirmed" when capture does not complete after stock depletion'
    ).toHaveText(/not confirmed/i);

    await expect(
      checkoutPage.orderConfirmationAmount,
      'No confirmed-order amount should render when payment capture did not proceed'
    ).toBeHidden();
  });
});