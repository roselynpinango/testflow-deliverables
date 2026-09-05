import { test as base } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { testData } from './test-data';

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
  testData: typeof testData;
};

/**
 * Shared fixtures so specs never duplicate page-object construction or test-data
 * imports. Each test receives a fresh Playwright `page`, so no mutable state is
 * shared across tests.
 */
export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  testData: async ({}, use) => {
    await use(testData);
  },
});

export { expect } from '@playwright/test';