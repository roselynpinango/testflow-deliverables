import { test, expect, apiBaseUrl, gatewayRoutePattern } from '../fixtures/checkout-fixtures';
import { mockGatewayAuthorization } from '../helpers/payment-gateway-mock';
import { OrdersApiClient } from '../helpers/orders-api-client';

test.describe('Checkout Payment Regression — Authorization, Stock, Promo, Idempotency', () => {

  // TC-001 — R-01 positive path — risk: Critical
  test('order is confirmed and exactly one charge is created when gateway approves authorization', async ({
    page,
    checkoutPage,
    testData,
    request,
  }) => {
    await mockGatewayAuthorization(page, gatewayRoutePattern, 'approved', testData.cartTotal);
    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.orderStatus,
      'order status should read Confirmed after an approved authorization'
    ).toHaveText('Confirmed');

    const ordersApi = new OrdersApiClient(request, apiBaseUrl);
    const chargeCount = await ordersApi.getChargeCount(testData.idempotencyKey);
    expect(chargeCount, 'exactly one charge record must exist for the authorized amount').toBe(1);
  });

  // TC-002 — R-01 negative (declined) — risk: Critical
  test('no order is created and a generic message is shown when gateway declines authorization', async ({
    page,
    checkoutPage,
    testData,
    request,
  }) => {
    await mockGatewayAuthorization(page, gatewayRoutePattern, 'declined', testData.cartTotal);
    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.errorMessage,
      'customer should see a generic payment declined message'
    ).toBeVisible();
    await expect(
      checkoutPage.errorMessage,
      'declined message must not leak gateway-specific error detail'
    ).not.toContainText(/gateway|code\s*\d+/i);

    const ordersApi = new OrdersApiClient(request, apiBaseUrl);
    const orderCount = await ordersApi.getOrderCount(testData.idempotencyKey);
    expect(orderCount, 'no order record should be created after a declined authorization').toBe(0);
  });

  // TC-003 — R-01 negative (timeout) — risk: Critical
  test('no order is created and a generic message is shown when gateway authorization times out', async ({
    page,
    checkoutPage,
    testData,
    request,
  }) => {
    await mockGatewayAuthorization(page, gatewayRoutePattern, 'timeout', testData.cartTotal);
    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.errorMessage,
      'customer should see a generic payment timeout message'
    ).toBeVisible();

    const ordersApi = new OrdersApiClient(request, apiBaseUrl);
    const orderCount = await ordersApi.getOrderCount(testData.idempotencyKey);
    expect(orderCount, 'no order record should be created after a gateway timeout').toBe(0);
  });

  // TC-004 — R-02 stock depleted before capture — risk: High
  test('payment authorization is reversed when stock depletes before capture', async ({
    page,
    checkoutPage,
    testData,
    request,
  }) => {
    await mockGatewayAuthorization(page, gatewayRoutePattern, 'approved', testData.cartTotal);
    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    const ordersApi = new OrdersApiClient(request, apiBaseUrl);
    const itemId = testData.cartItems[0].id;
    await ordersApi.setItemStock(itemId, 0);

    // Assumption: the app exposes no explicit "capture completed" signal in
    // the test basis, so we poll the authorization state instead of a fixed
    // wait. Replace with an event-based wait if the app provides one.
    await expect
      .poll(async () => ordersApi.getAuthorizationState(itemId), {
        message: 'authorization must transition to Reversed once stock is depleted before capture',
      })
      .toBe('Reversed');

    await expect(
      checkoutPage.errorMessage,
      'customer should see a message that the item is no longer available'
    ).toContainText(/no longer available/i);
  });

  // TC-005 — R-03 boundary: discount equals subtotal — risk: High
  test('capture amount floors at zero when promo discount equals cart subtotal', async ({
    page,
    checkoutPage,
  }) => {
    let capturedAmount: number | undefined;
    await page.route(gatewayRoutePattern, async (route) => {
      const req = route.request();
      if (req.url().includes('/capture')) {
        const body = req.postDataJSON();
        capturedAmount = body?.amount;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ captured: true }),
        });
        return;
      }
      await route.continue();
    });

    await checkoutPage.goto();
    // Promo code value is environment-configured; not hardcoded.
    await checkoutPage.applyPromoCode(process.env.SANDBOX_PROMO_FULL_DISCOUNT_CODE ?? '');
    await checkoutPage.submitPayment();

    expect(capturedAmount, 'amount submitted for capture must equal the recalculated total of zero').toBe(0);
    expect(capturedAmount, 'capture amount must never be negative').toBeGreaterThanOrEqual(0);
  });

  // TC-006 — R-04 idempotency retry — risk: High
  test('retrying a timed-out payment with the same idempotency key does not duplicate the charge', async ({
    page,
    checkoutPage,
    testData,
    request,
  }) => {
    let attempt = 0;
    let firstIdempotencyKey: string | null = null;
    let secondIdempotencyKey: string | null = null;

    // Assumption: idempotency key travels as an 'idempotency-key' request
    // header. Adjust the header name if the app uses a different convention.
    await page.route(gatewayRoutePattern, async (route) => {
      attempt += 1;
      const headerKey = route.request().headers()['idempotency-key'] ?? null;
      if (attempt === 1) {
        firstIdempotencyKey = headerKey;
        await route.abort('timedout');
        return;
      }
      secondIdempotencyKey = headerKey;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ outcome: 'approved', authorizedAmount: testData.cartTotal }),
      });
    });

    await checkoutPage.goto();
    await checkoutPage.submitPayment(); // first attempt times out
    await checkoutPage.submitPayment(); // retry — should reuse the same key

    expect(
      secondIdempotencyKey,
      'retry must reuse the same idempotency key as the original timed-out request'
    ).toBe(firstIdempotencyKey);

    const ordersApi = new OrdersApiClient(request, apiBaseUrl);
    const key = firstIdempotencyKey ?? testData.idempotencyKey;
    const chargeCount = await ordersApi.getChargeCount(key);
    const orderCount = await ordersApi.getOrderCount(key);

    expect(chargeCount, 'exactly one charge must exist after retrying with the same idempotency key').toBe(1);
    expect(orderCount, 'exactly one order must exist after retrying with the same idempotency key').toBe(1);
  });
});