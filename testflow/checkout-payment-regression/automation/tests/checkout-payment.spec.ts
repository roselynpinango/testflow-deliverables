import { test, expect, testData } from '../fixtures/checkout.fixtures';

/**
 * Covers TC-001 through TC-006 (Critical → High risk band).
 * Traceability: R-01 (TC-001), R-02 (TC-002), R-03 (TC-003, TC-004),
 * R-04 (TC-005, TC-006) — from the Approved Risk Register via Approved Cases.
 */
test.describe('Checkout Payment — Capture, Retry, Callback, Stock, Security', () => {

  test('TC-001 [Critical] captured amount matches recalculated cart total after promo application', async ({
    checkoutPage,
    apiClient,
    orderId,
  }) => {
    const originalTotalText = await checkoutPage.cartTotal.textContent();
    expect(originalTotalText, 'Cart total must be visible before promo application').not.toBeNull();

    await checkoutPage.applyPromoCode(testData.promoCodes.valid);
    const recalculatedTotalText = await checkoutPage.cartTotal.textContent();
    expect(
      recalculatedTotalText,
      'Cart total must change once a valid promo code is applied (recalculation did not occur)'
    ).not.toEqual(originalTotalText);

    await checkoutPage.fillCardDetails(testData.card.number, testData.card.cvv, testData.card.expiry);
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.orderConfirmationTotal,
      'Order confirmation total must render after a successful payment submission'
    ).toBeVisible();
    const confirmationTotalText = await checkoutPage.orderConfirmationTotal.textContent();

    const transaction = await apiClient.getTransactionsByIdempotencyKey(orderId);
    expect(
      transaction?.capturedAmount?.toString(),
      'Gateway-captured amount must equal the recalculated (post-discount) cart total — mismatch is a promo-recalculation defect (R-01)'
    ).toEqual(recalculatedTotalText?.replace(/[^0-9.]/g, ''));

    expect(
      confirmationTotalText,
      'Order confirmation screen must display the same recalculated total as the captured amount'
    ).toEqual(recalculatedTotalText);
  });

  test('TC-002 [Critical] exactly one authorization recorded when retrying payment after timeout with the same idempotency key', async ({
    checkoutPage,
    apiClient,
    idempotencyKey,
    page,
  }) => {
    await checkoutPage.fillCardDetails(testData.card.number, testData.card.cvv, testData.card.expiry);

    // NOTE: route pattern is an assumption of the payment submission endpoint's path —
    // confirm against the real network call before execution.
    let firstAttempt = true;
    await page.route('**/payment/submit', async (route) => {
      if (firstAttempt) {
        firstAttempt = false;
        await route.abort('timedout');
      } else {
        await route.continue();
      }
    });

    await checkoutPage.paymentSubmitButton.click();
    // Retry reuses the same idempotency key — assumed to be carried by the app's
    // client-side retry logic; confirm this against actual implementation.
    await checkoutPage.paymentSubmitButton.click();

    const transactions = await apiClient.getTransactionsByIdempotencyKey(idempotencyKey);
    const recordedCount = Array.isArray(transactions) ? transactions.length : transactions?.count;
    expect(
      recordedCount,
      'Exactly one authorization must exist per idempotency key after a client-side retry — duplicates indicate a duplicate-debit defect (R-02)'
    ).toEqual(1);
  });

  test('TC-003 [High] order remains pending when the capture callback does not arrive', async ({
    checkoutPage,
    apiClient,
    orderId,
  }) => {
    await checkoutPage.fillCardDetails(testData.card.number, testData.card.cvv, testData.card.expiry);
    await checkoutPage.submitPayment();

    await apiClient.simulateCaptureCallbackFailure(orderId);

    const order = await apiClient.getOrderStatus(orderId);
    expect(
      order?.status,
      'Order must remain "Pending" when the capture callback never arrives — a "Confirmed" status here is a gateway/order state-mismatch defect (R-03)'
    ).toEqual('Pending');
    expect(
      order?.confirmationSent,
      'No order confirmation notification should be sent while capture is unconfirmed'
    ).toBeFalsy();
  });

  test('TC-004 [High] payment capture is blocked when stock reaches zero at the moment of submission', async ({
    checkoutPage,
    apiClient,
    orderId,
  }) => {
    await checkoutPage.fillCardDetails(testData.card.number, testData.card.cvv, testData.card.expiry);

    await apiClient.setStockLevel(testData.cart.itemId, 0);
    await checkoutPage.submitPayment();

    const order = await apiClient.getOrderStatus(orderId);
    expect(
      order?.status,
      'Order status must indicate "Unconfirmed – pending stock re-validation" when stock hits zero at submission time (R-03 boundary)'
    ).toEqual('Unconfirmed – pending stock re-validation');

    const transactions = await apiClient.getTransactionsByIdempotencyKey(orderId);
    const recordedCount = Array.isArray(transactions) ? transactions.length : (transactions?.count ?? 0);
    expect(
      recordedCount,
      'No debit should be recorded when payment capture is correctly blocked by stock depletion'
    ).toEqual(0);
  });

  test('TC-005 [High][Security] CVV and card number are masked in UI, API response, and logs', async ({
    checkoutPage,
    apiClient,
    orderId,
  }) => {
    await checkoutPage.fillCardDetails(testData.card.number, testData.card.cvv, testData.card.expiry);
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.orderConfirmationTotal,
      'Confirmation screen must render after submission for masking to be verifiable in the UI'
    ).toBeVisible();
    const pageContent = await checkoutPage.page.content();
    expect(pageContent, 'CVV must never appear in the rendered UI (PCI-DSS)').not.toContain(testData.card.cvv);
    expect(pageContent, 'Full card number must never appear unmasked in the UI (PCI-DSS)').not.toContain(testData.card.number);

    const transaction = await apiClient.getTransactionsByIdempotencyKey(orderId);
    const transactionJson = JSON.stringify(transaction);
    expect(transactionJson, 'CVV must not be present in any API response payload').not.toContain(testData.card.cvv);
    expect(transactionJson, 'Full card number must not be present in any API response payload').not.toContain(testData.card.number);
    expect(
      transaction?.maskedCardNumber,
      'API response must expose only a masked card number (first 6 + last 4 digits)'
    ).toMatch(/^\d{6}\*+\d{4}$/);

    const logs = await apiClient.getApplicationLogs(orderId);
    const logsText = JSON.stringify(logs);
    expect(logsText, 'CVV must never be written to application logs (PCI-DSS)').not.toContain(testData.card.cvv);
    expect(logsText, 'Full card number must never be written to application logs (PCI-DSS)').not.toContain(testData.card.number);
  });

  test('TC-006 [High][Security][Negative] promo code field rejects oversized and script-injection input', async ({
    checkoutPage,
    apiClient,
    orderId,
  }) => {
    const originalTotal = await checkoutPage.cartTotal.textContent();

    await checkoutPage.applyPromoCode(testData.promoCodes.oversized);
    await expect(
      checkoutPage.promoCodeError,
      'Oversized promo code input must be rejected with a validation message'
    ).toBeVisible();
    expect(
      await checkoutPage.cartTotal.textContent(),
      'Cart total must not change after an oversized promo code is rejected'
    ).toEqual(originalTotal);

    await checkoutPage.applyPromoCode(testData.promoCodes.injection);
    await expect(
      checkoutPage.promoCodeError,
      'Script-injection promo code input must be rejected with a validation message'
    ).toBeVisible();
    expect(
      await checkoutPage.cartTotal.textContent(),
      'Cart total must not change after a script-injection promo code is rejected'
    ).toEqual(originalTotal);

    const logs = await apiClient.getApplicationLogs(orderId);
    const logsText = JSON.stringify(logs);
    expect(
      logsText,
      'Raw oversized promo code value must not appear in application logs'
    ).not.toContain(testData.promoCodes.oversized);
    expect(
      logsText,
      'Raw script-injection payload must not appear unsanitized in application logs'
    ).not.toContain(testData.promoCodes.injection);
  });
});