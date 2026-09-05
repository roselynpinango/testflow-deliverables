import { test as base, Route } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout-page';

type GatewayResult = 'approved' | 'declined' | 'timeout';

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
  mockGatewayAuthorization: (result: GatewayResult) => Promise<void>;
};

/**
 * Shared fixtures for Checkout Payment Regression suite.
 * Centralizes cart setup and gateway mocking so specs never duplicate setup
 * (ISO/IEC 25010 maintainability: no duplicated setup, no order dependence).
 * Each test receives a fresh page/cart — no shared mutable state.
 */
export const test = base.extend<CheckoutFixtures>({
  page: async ({ page }, use) => {
    await page.goto('/cart');
    await page.getByTestId('add-eligible-item-to-cart').click();
    await use(page);
  },

  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.selectCardPaymentMethod();
    await use(checkoutPage);
  },

  mockGatewayAuthorization: async ({ page }, use) => {
    const mock = async (result: GatewayResult) => {
      await page.route('**/api/payments/authorize', async (route: Route) => {
        if (result === 'timeout') {
          await route.abort('timedout');
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result, orderId: 'test-order' }),
        });
      });
    };
    await use(mock);
  },
});

export { expect } from '@playwright/test';