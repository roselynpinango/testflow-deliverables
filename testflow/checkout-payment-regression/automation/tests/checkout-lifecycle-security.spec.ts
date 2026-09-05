import { test, expect } from '../fixtures/checkout.fixture';
import { requireEnv } from '../helpers/env';
import { PROVISIONAL_PENDING_FULFILLMENT_REVIEW_STATE } from '../fixtures/test-data';

/**
 * Covers: TC-002 (critical), TC-006 (high, security), TC-007 (high, security),
 *         TC-003/TC-004/TC-005 (high, data-driven callback lifecycle)
 * Quality characteristics under test: functional suitability (lifecycle consistency),
 * security (data masking, session/authentication handling) per ISO/IEC 25010.
 * Traceability: Scenario 2/4/5/3 -> R-02, R-03, R-03, R-04.
 */

test.describe('Order lifecycle consistency and security', () => {
  test('TC-002: payment stays authorized (not captured) and order enters pending-fulfillment-review when stock depletes mid-authorization', async ({
    checkoutApi,
  }) => {
    const itemId = requireEnv('TEST_LIMITED_STOCK_ITEM_ID');

    const { orderId } = await checkoutApi.initiatePaymentAuthorization(itemId);

    // Simulates a concurrent transaction depleting stock before authorization completes.
    await checkoutApi.depleteStock(itemId);

    const paymentStatus = await checkoutApi.getPaymentStatus(orderId);
    expect(
      paymentStatus.status,
      `Order ${orderId} payment must remain "authorized" and must not be auto-captured when stock depletes mid-authorization`
    ).toBe('authorized');

    const order = await checkoutApi.getOrderStatus(orderId);
    expect(
      order.stockHoldReleased,
      `Stock hold for item ${itemId} must be released once authorization completes without capture`
    ).toBe(true);

    expect(
      order.status,
      `Order ${orderId} status must not be "confirmed" when payment was not captured due to stock depletion`
    ).not.toBe('confirmed');

    // Provisional label per TC-002 / Scenario 2 — the exact state name is TBD pending
    // confirmation of the stock validation timing model (see Test Plan open items).
    // Update this assertion once that model is confirmed.
    expect(
      order.status,
      `Order ${orderId} status is expected to be the provisional "${PROVISIONAL_PENDING_FULFILLMENT_REVIEW_STATE}" state (label TBD — revisit once confirmed)`
    ).toBe(PROVISIONAL_PENDING_FULFILLMENT_REVIEW_STATE);
  });

  test('TC-006: decline response masks card data to first6/last4 and omits CVV from response and logs', async ({
    checkoutApi,
  }) => {
    const declineCardNumber = requireEnv('TEST_CARD_DECLINE_NUMBER');
    const declineCardCvv = requireEnv('TEST_CARD_DECLINE_CVV');
    const first6 = declineCardNumber.slice(0, 6);
    const last4 = declineCardNumber.slice(-4);

    const response = await checkoutApi.submitDeclinedCardPayment({
      cardNumber: declineCardNumber,
      cvv: declineCardCvv,
    });
    const body = await response.json();

    expect(body.cardDisplay, 'Decline response must include a masked card display field').toBeDefined();

    expect(
      String(body.cardDisplay).startsWith(first6),
      `Masked card display "${body.cardDisplay}" must start with the first six digits of the card`
    ).toBe(true);

    expect(
      String(body.cardDisplay).endsWith(last4),
      `Masked card display "${body.cardDisplay}" must end with the last four digits of the card`
    ).toBe(true);

    expect(
      String(body.cardDisplay).replace(/\D/g, '').length,
      'Masked card display must not expose the full PAN length'
    ).toBeLessThan(declineCardNumber.length);

    const bodyText = JSON.stringify(body);
    expect(bodyText.includes(declineCardCvv), 'Decline response body must not contain the CVV value').toBe(false);

    expect(body.transactionId, 'Decline response must include a transactionId to look up its log entry').toBeDefined();

    const log = await checkoutApi.getTransactionLog(body.transactionId);
    const logText = JSON.stringify(log);

    expect(logText.includes(declineCardNumber), 'Application log must not contain the full card number').toBe(false);
    expect(logText.includes(declineCardCvv), 'Application log must not contain the CVV').toBe(false);
  });

  test('TC-007: expired session token is rejected on payment submission', async ({ checkoutApi }) => {
    const expiredToken = requireEnv('TEST_EXPIRED_SESSION_TOKEN');
    const orderId = requireEnv('TEST_ORDER_ID_FOR_EXPIRED_TOKEN');

    const response = await checkoutApi.submitPaymentWithToken(orderId, expiredToken);

    expect(
      [401, 403].includes(response.status()),
      `Expired session token must be rejected with an authentication error (401/403), got ${response.status()} (exact code TBD per Approved Cases)`
    ).toBe(true);

    const order = await checkoutApi.getOrderStatus(orderId);
    expect(
      order.paymentAuthorizationId,
      `No payment authorization should be created for order ${orderId} when the request is rejected due to an expired token`
    ).toBeUndefined();
  });

  const callbackCases = [
    { callbackStatus: 'success' as const, expectedState: 'confirmed' },
    { callbackStatus: 'failure' as const, expectedState: 'payment_failed' },
    { callbackStatus: 'timeout' as const, expectedState: 'pending_retry' },
  ];

  for (const { callbackStatus, expectedState } of callbackCases) {
    test(`TC-003/004/005: gateway callback "${callbackStatus}" transitions order to "${expectedState}"`, async ({
      checkoutApi,
    }) => {
      // Each iteration creates its own order — no shared mutable state between cases.
      const { orderId } = await checkoutApi.createOrderAwaitingCallback();

      await checkoutApi.sendGatewayCallback(orderId, callbackStatus);

      const order = await checkoutApi.getOrderStatus(orderId);
      expect(
        order.status,
        `Order ${orderId} should transition to "${expectedState}" after a "${callbackStatus}" gateway callback, got "${order.status}"`
      ).toBe(expectedState);
    });
  }
});