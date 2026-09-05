import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout-page';
import { PaymentGatewaySandbox } from '../helpers/payment-gateway-sandbox';
import { CheckoutTestData, loadCheckoutTestData } from './test-data';

interface CheckoutFixtures {
  checkoutPage: CheckoutPage;
  gatewaySandbox: PaymentGatewaySandbox;
  testData: CheckoutTestData;
}

export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await use(checkoutPage);
  },

  gatewaySandbox: async ({ request }, use) => {
    const baseUrl = process.env.GATEWAY_SANDBOX_API_URL;
    if (!baseUrl) {
      throw new Error(
        'GATEWAY_SANDBOX_API_URL is not configured — set it to the sandbox gateway base URL before running gateway-dependent tests.'
      );
    }
    await use(new PaymentGatewaySandbox(request, baseUrl));
  },

  testData: async ({}, use) => {
    await use(loadCheckoutTestData());
  },
});

export { expect };