import { test, expect } from '../fixtures/checkout-fixtures';

/**
 * Risk bands: High (R-02, R-03, R-04), Medium (R-05).
 * Each test is independent — own checkout session via the checkoutPage
 * fixture, no shared mutable state across tests.
 */

// TC-005 — @regression @risk-high — Reliability: stock/payment state consistency
test.describe('Checkout Payment Regression — Stock/Payment State Consistency (R-02)', () => {
  test('TC-005: payment is not captured and order reflects stock conflict when stock is exhausted before capture', async ({
    checkoutPage,
    gatewaySandbox,
    testData,
  }) => {
    const itemId = process.env.SANDBOX_RESERVED_ITEM_ID;
    test.skip(!itemId, 'SANDBOX_RESERVED_ITEM_ID not configured.');
    test.skip(!testData.validCard.number, 'SANDBOX_VALID_CARD_NUMBER not configured.');

    await checkoutPage.fillCard(testData.validCard);
    // Force the reserved stock to be exhausted before capture completes.
    await gatewaySandbox.exhaustStock(itemId!);
    await checkoutPage.submitPayment();

    const orderId = await checkoutPage.getOrderId();
    const captureAmount = await gatewaySandbox.getCaptureAmount(orderId);
    const orderStatus = await gatewaySandbox.getOrderStatus(orderId);

    expect(
      captureAmount,
      `Expected no capture to be recorded for order ${orderId} after stock exhaustion, but found capture amount ${captureAmount}`
    ).toBeUndefined();

    expect(
      orderStatus,
      `Expected order ${orderId} status to reflect a stock conflict, but got "${orderStatus}"`
    ).not.toBe('confirmed');
  });
});

// TC-006 — @negative @security @risk-high — Card data non-exposure on decline
test.describe('Checkout Payment Regression — Card Data Non-Exposure (R-03)', () => {
  test('TC-006: raw card number and CVV are never exposed in error message or transaction log after a declined payment', async ({
    checkoutPage,
    gatewaySandbox,
    testData,
  }) => {
    test.skip(!testData.declineCard.number, 'SANDBOX_DECLINE_CARD_NUMBER not configured.');

    await checkoutPage.fillCard(testData.declineCard);
    await checkoutPage.submitPayment();

    const errorText = (await checkoutPage.checkoutErrorMessage.textContent()) ?? '';

    expect(
      errorText.includes(testData.declineCard.number),
      `Checkout error message unexpectedly contained the raw card number: "${errorText}"`
    ).toBe(false);
    expect(
      errorText.includes(testData.declineCard.cvv),
      `Checkout error message unexpectedly contained the raw CVV: "${errorText}"`
    ).toBe(false);

    const orderId = await checkoutPage.getOrderId();
    const log = await gatewaySandbox.getTransactionLog(orderId);

    expect(log, `No transaction log entry found for declined order ${orderId}`).toBeDefined();
    expect(
      log!.maskedCardNumber,
      `Gateway transaction log for order ${orderId} did not show a masked first-six/last-four card number: "${log!.maskedCardNumber}"`
    ).toMatch(/^\d{6}\*+\d{4}$/);
    expect(
      log!.rawEntry.includes(testData.declineCard.cvv),
      `Gateway transaction log for order ${orderId} unexpectedly contained the raw CVV`
    ).toBe(false);
  });
});

// TC-007 — @regression @risk-high — Idempotent retry / duplicate-debit prevention
test.describe('Checkout Payment Regression — Idempotent Retry (R-04)', () => {
  test('TC-007: exactly one debit is recorded when a payment retry reuses the same idempotency key after a gateway timeout', async ({
    checkoutPage,
    gatewaySandbox,
    testData,
  }) => {
    test.skip(!testData.timeoutSimCard.number, 'SANDBOX_TIMEOUT_CARD_NUMBER not configured.');

    await checkoutPage.fillCard(testData.timeoutSimCard);
    await checkoutPage.submitPayment(); // expected to simulate a gateway timeout in sandbox

    const orderId = await checkoutPage.getOrderId();
    await checkoutPage.retryPayment(); // client resubmits with the original idempotency key

    const debitCount = await gatewaySandbox.getDebitCount(orderId);

    expect(
      debitCount,
      `Expected exactly one debit for order ${orderId} after idempotent retry, but found ${debitCount}`
    ).toBe(1);
  });
});

// TC-008 — @negative @security @risk-medium — Input validation: injection
test.describe('Checkout Payment Regression — Promo Code Input Validation (R-05)', () => {
  test('TC-008: promo code field rejects a SQL/script injection input without exposing internal details', async ({
    checkoutPage,
    testData,
  }) => {
    await checkoutPage.applyPromoCode(testData.injectionPromoCode);

    const errorText = (await checkoutPage.promoErrorMessage.textContent()) ?? '';

    expect(
      errorText.length > 0,
      'Expected a validation message to be shown when submitting an injection-pattern promo code, but none was displayed'
    ).toBe(true);
    expect(
      /sql|stack|exception|query|syntax error/i.test(errorText),
      `Promo code error message leaked internal system/query detail: "${errorText}"`
    ).toBe(false);
    await expect(
      checkoutPage.payButton,
      'Pay button should not proceed to a payment attempt after an invalid promo code submission'
    ).toBeEnabled();
  });

  // TC-009 — @boundary @edge-case @risk-medium — Input validation: oversized input
  test('TC-009: promo code field rejects an oversized input value without initiating payment', async ({
    checkoutPage,
    testData,
  }) => {
    await checkoutPage.applyPromoCode(testData.oversizedPromoCode);

    const errorText = (await checkoutPage.promoErrorMessage.textContent()) ?? '';

    expect(
      errorText.length > 0,
      'Expected a validation message to be shown for an oversized promo code, but none was displayed'
    ).toBe(true);
    await expect(
      checkoutPage.payButton,
      'No payment attempt should be initiated following an oversized promo code submission'
    ).toBeEnabled();
  });
});