import { test, expect, gatewayRoutePattern } from '../fixtures/checkout-fixtures';
import { mockGatewayAuthorization } from '../helpers/payment-gateway-mock';

test.describe('Checkout Payment Regression — Data Masking & Promo Input Security', () => {

  // TC-007 — R-05 data masking — risk: Medium
  test('card number and CVV are never exposed in the API response or UI after a completed payment', async ({
    page,
    checkoutPage,
    testData,
  }) => {
    let responseBody: unknown;
    await mockGatewayAuthorization(page, gatewayRoutePattern, 'approved', testData.cartTotal);
    page.on('response', async (response) => {
      if (new RegExp(gatewayRoutePattern.replace(/\*\*/g, '.*')).test(response.url())) {
        try {
          responseBody = await response.json();
        } catch {
          // non-JSON response, ignore
        }
      }
    });

    await checkoutPage.goto();
    await checkoutPage.submitPayment();

    await expect(
      checkoutPage.cardNumberDisplay,
      'card number shown in UI must be masked to first6/last4 only'
    ).toContainText(/^\d{6}\*+\d{4}$/);

    const serialized = JSON.stringify(responseBody ?? {});
    expect(
      serialized,
      'full card number must not appear in the payment API response'
    ).not.toMatch(/\b\d{12,19}\b/);
    expect(
      serialized.toLowerCase(),
      'CVV value must never appear in the payment API response'
    ).not.toContain('cvv');

    // Application log inspection is not implemented here: no log-aggregation
    // endpoint was supplied in the test basis. This is an open gap against
    // R-05, not a resolved assertion — see "Not implemented" notes below.
  });

  // TC-008 — R-06 oversized input — risk: Medium
  test('promo code field rejects a string exceeding the maximum accepted length', async ({ checkoutPage }) => {
    // Exact maximum length is TBD — not specified in the test basis.
    // Using a deliberately oversized value to exercise the rejection path.
    const oversizedInput = 'A'.repeat(1000);

    await checkoutPage.goto();
    await checkoutPage.applyPromoCode(oversizedInput);

    await expect(
      checkoutPage.promoError,
      'oversized promo input must return a generic invalid-code error'
    ).toBeVisible();
    await expect(
      checkoutPage.promoError,
      'error message must not expose backend stack trace or internal detail'
    ).not.toContainText(/stack trace|exception|at\s+\w+\.\w+\(/i);
  });

  // TC-009 — R-06 SQL injection pattern — risk: Medium
  test('promo code field rejects a SQL injection pattern without exposing backend detail', async ({
    checkoutPage,
  }) => {
    const sqlInjectionInput = `' OR '1'='1`;

    await checkoutPage.goto();
    await checkoutPage.applyPromoCode(sqlInjectionInput);

    await expect(
      checkoutPage.promoError,
      'SQL injection pattern must return a generic invalid-code error'
    ).toBeVisible();
    await expect(
      checkoutPage.promoError,
      'error message must not expose SQL or backend error detail'
    ).not.toContainText(/sql|syntax error|stack trace/i);
  });

  // TC-010 — R-06 script injection pattern — risk: Medium
  test('promo code field rejects a script injection pattern and does not execute it', async ({
    page,
    checkoutPage,
  }) => {
    const scriptInjectionInput = `<script>alert(1)</script>`;
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await checkoutPage.goto();
    await checkoutPage.applyPromoCode(scriptInjectionInput);

    expect(dialogTriggered, 'script injection payload must not execute as a JavaScript alert').toBe(false);
    await expect(
      checkoutPage.promoError,
      'script injection pattern must return a generic invalid-code error'
    ).toBeVisible();

    const html = await page.content();
    expect(
      html,
      'injected script markup must not be rendered unescaped into the DOM'
    ).not.toContain('<script>alert(1)</script>');
  });
});