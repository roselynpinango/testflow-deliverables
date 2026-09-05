import { test, expect, testData } from '../fixtures/checkout.fixtures';

/**
 * Covers TC-007 through TC-009 (Medium risk band, R-05).
 * TC-008/TC-009 derive from the two Examples rows of the "Promo code stacking and
 * expiry" Scenario Outline — kept as separate tests since they exercise distinct
 * equivalence partitions (already-stacked vs. expired).
 */
test.describe('Checkout Payment — Promo Code Negative Validation', () => {

  test('TC-007 [Medium][Negative] malformed promo code is rejected and charged amount is unaffected', async ({
    checkoutPage,
  }) => {
    const originalTotal = await checkoutPage.cartTotal.textContent();

    await checkoutPage.applyPromoCode(testData.promoCodes.malformed);

    await expect(
      checkoutPage.promoCodeError,
      'Malformed promo code must be rejected with a validation message'
    ).toBeVisible();
    expect(
      await checkoutPage.cartTotal.textContent(),
      'Charged amount must remain equal to the original cart total when the promo code is rejected'
    ).toEqual(originalTotal);
  });

  test('TC-008 [Medium][Negative] second promo code is rejected when one promo is already applied', async ({
    checkoutPage,
  }) => {
    await checkoutPage.applyPromoCode(testData.promoCodes.valid);
    const discountedTotal = await checkoutPage.cartTotal.textContent();

    await checkoutPage.applyPromoCode(testData.promoCodes.stacked);

    await expect(
      checkoutPage.promoCodeError,
      'Second (stacked) promo code must be rejected with a stacking-not-allowed message'
    ).toBeVisible();
    expect(
      await checkoutPage.cartTotal.textContent(),
      'Charged amount must remain the previously discounted total, unaffected by the rejected stacked promo code'
    ).toEqual(discountedTotal);
  });

  test('TC-009 [Medium][Negative] expired promo code is rejected and full cart total is charged', async ({
    checkoutPage,
  }) => {
    const originalTotal = await checkoutPage.cartTotal.textContent();

    await checkoutPage.applyPromoCode(testData.promoCodes.expired);

    await expect(
      checkoutPage.promoCodeError,
      'Expired promo code must be rejected with an expiry-specific validation message'
    ).toBeVisible();
    expect(
      await checkoutPage.cartTotal.textContent(),
      'Charged amount must equal the full original cart total when an expired promo code is rejected'
    ).toEqual(originalTotal);
  });
});