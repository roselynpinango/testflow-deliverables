import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { CheckoutPage } from '../pages/checkout.page';
import { PaymentApiClient } from '../helpers/api-client';
import { testData } from './test-data';

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
  apiClient: PaymentApiClient;
  orderId: string;
  idempotencyKey: string;
};

/**
 * Each test gets its own orderId/idempotencyKey (runtime-generated, not fabricated
 * business data) so tests remain independent with no shared mutable state.
 */
export const test = base.extend<CheckoutFixtures>({
  orderId: async ({}, use) => {
    await use(randomUUID());
  },
  idempotencyKey: async ({}, use) => {
    await use(randomUUID());
  },
  apiClient: async ({}, use) => {
    const client = await PaymentApiClient.create();
    await use(client);
    await client.dispose();
  },
  checkoutPage: async ({ page, orderId }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto(orderId);
    await use(checkoutPage);
  },
});

export { expect, testData };