/**
 * Test basis: Approved Scenarios / Approved Cases — Checkout Card Payment,
 * Promo, and Stock Validation Regression.
 * Covers: TC-001, TC-002, TC-003 (Critical), TC-004, TC-005, TC-007 (High).
 * Draft artifact — not approved/signed off. See open items below.
 */
import { test, expect } from '../fixtures/checkout.fixture';
import { sandboxCard } from '../fixtures/test-data';

test.describe('Checkout Card Payment Regression — Critical & High Risk', () => {
  test('TC-001: order status reflects an approved gateway authorization', async ({
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await mockGatewayAuthorization('approved');
    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    const status = await checkoutPage.getOrderStatusText();
    // Literal status string is draft-only — verify against system's order-status enum (open item).
    expect(
      status,
      `Expected order status "Confirmed" after an approved gateway authorization, got "${status}"`
    ).toBe('Confirmed');
  });

  test('TC-002: order is marked payment failed on a declined gateway authorization', async ({
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await mockGatewayAuthorization('declined');
    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    const status = await checkoutPage.getOrderStatusText();
    expect(
      status,
      `Expected order status "Payment Failed" after a declined gateway authorization, got "${status}"`
    ).toBe('Payment Failed');
  });

  test('TC-003: order is set to pending retry on a gateway timeout, with a retry option offered', async ({
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await mockGatewayAuthorization('timeout');
    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    const status = await checkoutPage.getOrderStatusText();
    expect(
      status,
      `Expected order status "Pending Retry" after a gateway timeout, got "${status}"`
    ).toBe('Pending Retry');

    const retryVisible = await checkoutPage.getRetryButtonVisible();
    expect(
      retryVisible,
      'Expected a retry option to be offered to the customer after a gateway timeout'
    ).toBeTruthy();
  });

  test('TC-004: payment authorization is reversed when the last locked unit sells out before capture', async ({
    page,
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await mockGatewayAuthorization('approved');

    // Simulate the locked item's last unit going out of stock before capture completes.
    await page.route('**/api/inventory/stock-check', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ inStock: false }),
      })
    );

    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    const status = await checkoutPage.getOrderStatusText();
    // Literal status string is draft-only — verify against system's order-status enum (open item).
    expect(
      status,
      `Expected order status to reflect the order could not be fulfilled, got "${status}"`
    ).toBe('Could Not Be Fulfilled');
  });

  test('TC-005: CVV and card number are masked across the checkout journey', async ({
    page,
    checkoutPage,
    mockGatewayAuthorization,
  }) => {
    await mockGatewayAuthorization('approved');

    const responseBodies: string[] = [];
    page.on('response', async (response) => {
      try {
        responseBodies.push(await response.text());
      } catch {
        // Non-text bodies (e.g. binary assets) are not relevant to CVV/PAN exposure checks.
      }
    });

    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment();

    for (const body of responseBodies) {
      expect(
        body,
        'CVV value must never appear in any API response payload during checkout'
      ).not.toContain(sandboxCard.cvv);
    }

    const displayedCard = await checkoutPage.getDisplayedCardNumber();
    const first6 = sandboxCard.number.slice(0, 6);
    const last4 = sandboxCard.number.slice(-4);
    expect(
      displayedCard,
      `Expected the displayed card number to show only first 6 and last 4 digits, got "${displayedCard}"`
    ).toBe(`${first6}******${last4}`);
    expect(
      displayedCard,
      'Full unmasked card number must never be shown in the UI'
    ).not.toContain(sandboxCard.number);
  });

  test('TC-007: retrying a card payment after a network timeout results in exactly one capture', async ({
    page,
    checkoutPage,
  }) => {
    // Provisional per Test Plan blocker — idempotency-key mechanism is not yet confirmed.
    let gatewayCallCount = 0;
    const idempotencyKeysSeen = new Set<string>();

    await page.route('**/api/payments/authorize', async (route, request) => {
      gatewayCallCount++;
      const key = await request.headerValue('Idempotency-Key');
      if (key) idempotencyKeysSeen.add(key);

      if (gatewayCallCount === 1) {
        await route.abort('timedout');
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: 'approved', orderId: 'test-order' }),
      });
    });

    await checkoutPage.fillCardDetails(sandboxCard);
    await checkoutPage.submitPayment(); // initial attempt times out
    await checkoutPage.submitPayment(); // customer retries the identical payment

    expect(
      idempotencyKeysSeen.size,
      `Expected the retry to reuse the same Idempotency-Key as the original attempt ` +
        `(provisional — pending confirmation of idempotency mechanism, Test Plan blocker), ` +
        `got ${idempotencyKeysSeen.size} distinct key(s)`
    ).toBe(1);

    const captureCount = await checkoutPage.getCaptureCountText();
    expect(
      captureCount,
      `Expected exactly one capture recorded against the order after retry, got "${captureCount}"`
    ).toBe('1');
  });
});