import { test, expect } from '../fixtures/fixtures';
import { CheckoutPage } from '../pages/CheckoutPage';
import { validSandboxCard, promoCodes, generateIdempotencyKey } from '../fixtures/test-data';

/**
 * Covers TC-008–TC-012 (Medium risk: stock validation during checkout,
 * promo-adjusted amount consistency) from the approved Test Cases artifact.
 */

const productId = process.env.SANDBOX_PRODUCT_ID ?? 'TBD-SANDBOX-PRODUCT-ID';

test.describe('Stock Validation During Checkout', () => {
  test('TC-008 authorization rolled back when stock depletes to zero before capture', async ({
    gatewaySandboxClient,
    orderServiceClient,
    productStockClient,
  }) => {
    await productStockClient.setStockLevel(productId, 1);

    const idempotencyKey = generateIdempotencyKey();
    const authResponse = await gatewaySandboxClient.submitPayment({
      card: validSandboxCard,
      idempotencyKey,
      productId,
      outcome: 'hold-before-capture',
    });
    const orderId = authResponse.body.orderId as string | undefined;
    expect(orderId, 'Authorization response must include an orderId while capture is held in-flight').toBeTruthy();

    await productStockClient.depleteStockConcurrently(productId);

    const orderStatus = await orderServiceClient.getOrderStatus(orderId as string);
    expect(
      orderStatus.status,
      `Expected order ${orderId} status "stock unavailable" after concurrent depletion blocked capture`
    ).toBe('stock unavailable');

    const captureCount = await orderServiceClient.getCaptureCount(orderId as string);
    expect(captureCount, `Expected zero captures recorded for order ${orderId} after the rollback`).toBe(0);
  });

  test('TC-009 customer sees out-of-stock error after concurrent stock depletion, no authorization initiated', async ({
    checkoutPage,
    productStockClient,
  }) => {
    await productStockClient.setStockLevel(productId, 0);

    let gatewayCalled = false;
    await checkoutPage.page.route('**/payments**', (route) => {
      gatewayCalled = true;
      return route.continue();
    });

    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.outOfStockError,
      'Checkout must display an out-of-stock error when the product stock has been depleted'
    ).toBeVisible();

    expect(
      gatewayCalled,
      'No payment authorization request should be sent to the gateway when the product is out of stock'
    ).toBe(false);
  });

  test('TC-010 two concurrent checkouts contend for the last unit of stock', async ({
    browser,
    productStockClient,
  }) => {
    await productStockClient.setStockLevel(productId, 1);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    try {
      const checkoutA = new CheckoutPage(await contextA.newPage());
      const checkoutB = new CheckoutPage(await contextB.newPage());

      await checkoutA.goto();
      await checkoutB.goto();

      await Promise.all([
        checkoutA.submitPayment().catch(() => undefined),
        checkoutB.submitPayment().catch(() => undefined),
      ]);

      const outOfStockA = await checkoutA.outOfStockError.isVisible().catch(() => false);
      const outOfStockB = await checkoutB.outOfStockError.isVisible().catch(() => false);

      expect(
        [outOfStockA, outOfStockB].filter(Boolean).length,
        'Exactly one of the two concurrent checkout sessions must be shown an out-of-stock error when contending for the last unit of stock'
      ).toBe(1);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

test.describe('Promo-Adjusted Amount Consistency', () => {
  test('TC-011 authorization and settlement amounts match cart total across promo types', async ({
    checkoutPage,
    gatewaySandboxClient,
  }) => {
    const cases: Array<{ promoType: keyof typeof promoCodes }> = [
      { promoType: 'percentage' },
      { promoType: 'flat' },
      { promoType: 'expired' },
    ];

    for (const { promoType } of cases) {
      await checkoutPage.goto();
      await checkoutPage.applyPromoCode(promoCodes[promoType]);

      const cartTotalText = await checkoutPage.cartTotal.innerText();
      const cartTotal = Number(cartTotalText.replace(/[^0-9.]/g, ''));

      const paymentResponse = await gatewaySandboxClient.submitPayment({
        card: validSandboxCard,
        idempotencyKey: generateIdempotencyKey(),
        promoType,
      });
      const authorizationAmount = paymentResponse.body.authorizationAmount as number | undefined;
      const settlementAmount = paymentResponse.body.settlementAmount as number | undefined;

      expect(
        authorizationAmount,
        `Authorization amount must equal the cart total (${cartTotal}) for promo type "${promoType}"`
      ).toBe(cartTotal);
      expect(
        settlementAmount,
        `Settlement amount must equal the cart total (${cartTotal}) for promo type "${promoType}"`
      ).toBe(cartTotal);
    }
  });

  test('TC-012 expired promo code is rejected and cart total reverts to original price', async ({
    checkoutPage,
  }) => {
    await checkoutPage.goto();

    const originalCartTotalText = await checkoutPage.cartTotal.innerText();

    await checkoutPage.applyPromoCode(promoCodes.expired);

    await expect(
      checkoutPage.promoError,
      'Cart must display an expired-promo error when an expired promo code is applied'
    ).toBeVisible();

    const revertedCartTotalText = await checkoutPage.cartTotal.innerText();
    expect(
      revertedCartTotalText,
      'Cart total must revert to the original, undiscounted price after the expired promo code is rejected'
    ).toBe(originalCartTotalText);
  });
});