import { test, expect } from '../fixtures/fixtures';
import {
  validSandboxCard,
  declineSandboxCard,
  invalidCvv,
  generateIdempotencyKey,
} from '../fixtures/test-data';

/**
 * Covers TC-001–TC-002 (Critical: payment authorization → order status
 * consistency) and TC-003–TC-007 (High: CVV/card protection, idempotent
 * retry) from the approved Test Cases artifact. Ordered by risk band.
 */

test.describe('Payment Authorization and Order Status Consistency', () => {
  test('TC-001 order is confirmed after successful authorization and capture', async ({
    gatewaySandboxClient,
    orderServiceClient,
  }) => {
    const idempotencyKey = generateIdempotencyKey();
    const paymentResponse = await gatewaySandboxClient.submitPayment({
      card: validSandboxCard,
      idempotencyKey,
      outcome: 'success',
    });

    const orderId = paymentResponse.body.orderId as string | undefined;
    expect(orderId, 'Payment response must include an orderId to verify order status against').toBeTruthy();

    const orderStatus = await orderServiceClient.getOrderStatus(orderId as string);
    expect(
      orderStatus.status,
      `Expected order-service API status "confirmed" for order ${orderId} after successful authorization and capture`
    ).toBe('confirmed');
  });

  test('TC-002 order remains "payment failed" when gateway declines authorization', async ({
    gatewaySandboxClient,
    orderServiceClient,
  }) => {
    const idempotencyKey = generateIdempotencyKey();
    const paymentResponse = await gatewaySandboxClient.submitPayment({
      card: declineSandboxCard,
      idempotencyKey,
      outcome: 'decline',
    });

    const orderId = paymentResponse.body.orderId as string | undefined;
    expect(orderId, 'Payment response must include an orderId even when the gateway declines').toBeTruthy();

    const orderStatus = await orderServiceClient.getOrderStatus(orderId as string);
    expect(
      orderStatus.status,
      `Expected order-service API status "payment failed" for order ${orderId} after a gateway decline`
    ).toBe('payment failed');

    const captureCount = await orderServiceClient.getCaptureCount(orderId as string);
    expect(captureCount, `Expected zero captures recorded for declined order ${orderId}`).toBe(0);
  });
});

test.describe('CVV and Card Data Protection', () => {
  test('TC-003 CVV is masked in the UI after field loses focus', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.fillCard(validSandboxCard);
    await checkoutPage.blurCvv();

    const cvvFieldType = await checkoutPage.cvvInput.getAttribute('type');
    expect(
      cvvFieldType,
      'CVV input must render as a masked field (type="password") once focus leaves the field, per PCI-DSS masking requirement'
    ).toBe('password');

    const pageText = await checkoutPage.page.locator('body').innerText();
    expect(
      pageText.includes(validSandboxCard.cvv),
      `Raw CVV value must not appear anywhere in the rendered page text (searched for "${validSandboxCard.cvv}")`
    ).toBe(false);
  });

  test('TC-004 checkout rejects payment when CVV format is invalid', async ({ checkoutPage }) => {
    await checkoutPage.goto();

    let gatewayCalled = false;
    await checkoutPage.page.route('**/payments**', (route) => {
      gatewayCalled = true;
      return route.continue();
    });

    await checkoutPage.fillCard({ ...validSandboxCard, cvv: invalidCvv });
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.cvvValidationError,
      'Checkout must display a validation error requesting a valid CVV when the CVV format is invalid'
    ).toBeVisible();

    expect(
      gatewayCalled,
      'No outbound request to the payment gateway should be made when client-side CVV format validation fails'
    ).toBe(false);
  });

  test('TC-005 CVV is absent from network logs and error payloads across failure types', async ({
    gatewaySandboxClient,
  }) => {
    const failureTypes = ['invalid CVV', 'gateway timeout', 'gateway decline'];

    for (const failureType of failureTypes) {
      const { networkLogEntry, errorMessagePayload } = await gatewaySandboxClient.triggerFailure(failureType);

      expect(
        networkLogEntry.includes(validSandboxCard.cvv),
        `Network log entry for failure type "${failureType}" must not contain the submitted CVV value`
      ).toBe(false);

      expect(
        errorMessagePayload.includes(validSandboxCard.cvv),
        `Error-message payload for failure type "${failureType}" must not contain the submitted CVV value`
      ).toBe(false);
    }
  });
});

test.describe('Idempotent Payment Retry', () => {
  test('TC-006 duplicate debit prevented when retried with same idempotency key after timeout', async ({
    gatewaySandboxClient,
    orderServiceClient,
  }) => {
    const idempotencyKey = generateIdempotencyKey();
    const payload = { card: validSandboxCard, idempotencyKey, outcome: 'timeout-then-retry' };

    const firstAttempt = await gatewaySandboxClient.submitPayment(payload);
    const orderId = firstAttempt.body.orderId as string | undefined;
    expect(
      orderId,
      'First payment attempt must return an orderId even when the gateway times out, so the retry can be tracked'
    ).toBeTruthy();

    await gatewaySandboxClient.submitPayment(payload);

    const captureCount = await orderServiceClient.getCaptureCount(orderId as string);
    expect(
      captureCount,
      `Expected exactly one capture recorded for order ${orderId} after retrying with the same idempotency key`
    ).toBe(1);
  });

  test('TC-007 payment request without idempotency key is rejected before reaching the gateway', async ({
    gatewaySandboxClient,
  }) => {
    const payload = { card: validSandboxCard }; // idempotencyKey deliberately omitted

    const response = await gatewaySandboxClient.submitPayment(payload);

    expect(
      response.status,
      'Request missing an idempotency key must be rejected with a client validation error status (4xx)'
    ).toBeGreaterThanOrEqual(400);
    expect(
      response.status,
      'Rejection must be a client error, not a server error, confirming the request was validated before gateway processing'
    ).toBeLessThan(500);
  });
});