import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutApiClient } from '../api/checkoutApiClient';

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
  checkoutApi: CheckoutApiClient;
};

/**
 * Shared fixtures so specs never repeat navigation/setup boilerplate
 * (maintainability requirement: no duplicated setup, no order dependence).
 * Each test gets a fresh CheckoutPage/CheckoutApiClient instance — no
 * mutable state is shared across tests.
 */
export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.gotoCheckout();
    await use(checkoutPage);
  },

  checkoutApi: async ({ request }, use) => {
    await use(new CheckoutApiClient(request));
  },
});

export { expect };