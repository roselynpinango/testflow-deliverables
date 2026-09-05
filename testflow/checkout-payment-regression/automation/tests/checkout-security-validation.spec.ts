import { test, expect } from '../fixtures/checkout.fixtures';
import { simulateStockOutMidPayment } from '../helpers/stockSimulation';

/**
 * Covers: TC-003 (R-03, medium, security), TC-006/TC-007 (R-04, medium,
 * boundary/security), TC-008/TC-009/TC-010 (R-05, medium, promo logic).
 * Quality characteristics: security (data exposure, injection handling),
 * functional suitability (promo logic correctness).
 *
 * Limitation (transparency, not resolved here): application-log inspection
 * for CVV leakage is out of reach for UI-level Playwright automation and
 * must be verified separately via backend log audit — not covered by TC-003
 * below beyond UI/response-body checks.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/checkout');
});

test('TC-003: CVV is never exposed when a stock-out error occurs mid-payment', async ({
  checkoutPage,
  page,
  testData,
}) => {
  test.skip(!testData.sandboxCard.number, 'SANDBOX_CARD_* env vars not configured (TBD)');

  await simulateStockOutMidPayment(page);
  await checkoutPage.enterCardDetails(
    testData.sandboxCard.number!,
    testData.sandboxCard.expiry!,
    testData.sandboxCard.cvv!
  );
  await checkoutPage.submitPayment();

  const errorText = await checkoutPage.paymentErrorMessage.textContent();
  expect(errorText, 'Error message must never contain the entered CVV value').not.toContain(
    testData.sandboxCard.cvv
  );

  const pageContent = await page.content();
  expect(pageContent, 'Rendered page must never contain the raw CVV value').not.toContain(
    testData.sandboxCard.cvv!
  );

  const displayedCard = await checkoutPage.cardNumberDisplay.textContent();
  expect(
    displayedCard,
    'Displayed card number must be masked to first 6 and last 4 digits only'
  ).toMatch(/^\d{6}\*+\d{4}$/);
});

test('TC-006: oversized promo code input is safely rejected', async ({ checkoutPage, testData }) => {
  test.skip(
    !testData.maxPromoCodeLength,
    'PROMO_CODE_MAX_LENGTH not configured — maximum length is TBD, cannot construct a deterministic boundary input'
  );

  const oversizedCode = 'A'.repeat(testData.maxPromoCodeLength! + 1);
  await checkoutPage.applyPromoCode(oversizedCode);

  await expect(
    checkoutPage.promoMessage,
    'Oversized promo code must be rejected with a visible generic validation message'
  ).toBeVisible();

  const messageText = await checkoutPage.promoMessage.textContent();
  expect(
    messageText,
    'Validation message must not expose stack traces or internal system detail'
  ).not.toMatch(/(stack trace|exception|at\s+\w+\.\w+\()/i);
});

test('TC-007: injection-pattern input on the card number field is safely rejected', async ({
  checkoutPage,
  page,
}) => {
  const INJECTION_PATTERN = "' OR '1'='1'; <script>alert(1)</script>";
  let alertTriggered = false;
  page.on('dialog', async (dialog) => {
    alertTriggered = true;
    await dialog.dismiss();
  });

  await checkoutPage.cardNumberInput.fill(INJECTION_PATTERN);
  await checkoutPage.submitPayment();

  await expect(
    checkoutPage.paymentErrorMessage,
    'Injection-pattern input must be rejected with a visible generic error message'
  ).toBeVisible();

  expect(alertTriggered, 'Injected script must never execute in the browser context').toBe(false);

  const pageContent = await page.content();
  expect(
    pageContent,
    'Injected script/query pattern must never appear unescaped in the rendered response'
  ).not.toContain('<script>alert(1)</script>');
});

test('TC-008: expired promo code is rejected and full cart total is charged', async ({
  checkoutPage,
  testData,
}) => {
  test.skip(!testData.promoCodes.expired, 'PROMO_CODE_EXPIRED env var not configured (TBD)');

  const cartTotal = await checkoutPage.readAmount(checkoutPage.cartTotal);
  await checkoutPage.applyPromoCode(testData.promoCodes.expired!);

  await expect(
    checkoutPage.promoMessage,
    'Expired promo code must display an invalid/expired message'
  ).toContainText(/expired|invalid/i);

  const chargedTotal = await checkoutPage.readAmount(checkoutPage.cartTotal);
  expect(
    chargedTotal,
    'Full undiscounted cart total must be charged when the promo code is expired'
  ).toBeCloseTo(cartTotal, 2);
});

test('TC-009: only one discount is applied when two promo codes are stacked', async ({
  checkoutPage,
  testData,
}) => {
  test.skip(
    !testData.promoCodes.active || !testData.promoCodes.secondValid,
    'Two independently valid promo codes are not configured (PROMO_CODE_ACTIVE / PROMO_CODE_SECOND_VALID) — TBD'
  );

  await checkoutPage.applyPromoCode(testData.promoCodes.active!);
  const afterFirst = await checkoutPage.readAmount(checkoutPage.cartTotalAfterDiscount);

  await checkoutPage.applyPromoCode(testData.promoCodes.secondValid!);
  const afterSecond = await checkoutPage.readAmount(checkoutPage.cartTotalAfterDiscount);

  expect(
    afterSecond,
    'Applying a second promo code must not stack an additional discount onto the already-discounted total'
  ).toBeCloseTo(afterFirst, 2);
});

test('TC-010: non-existent promo code is rejected and full cart total is charged', async ({
  checkoutPage,
  testData,
}) => {
  const cartTotal = await checkoutPage.readAmount(checkoutPage.cartTotal);
  await checkoutPage.applyPromoCode(testData.promoCodes.nonExistent);

  await expect(
    checkoutPage.promoMessage,
    'Non-existent promo code must display an invalid code message'
  ).toContainText(/invalid/i);

  const chargedTotal = await checkoutPage.readAmount(checkoutPage.cartTotal);
  expect(
    chargedTotal,
    'Full undiscounted cart total must be charged when the promo code does not exist'
  ).toBeCloseTo(cartTotal, 2);
});