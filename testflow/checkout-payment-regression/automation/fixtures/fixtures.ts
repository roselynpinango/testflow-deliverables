import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderServiceClient, PaymentGatewaySandboxClient, ProductStockClient } from '../utils/apiClient';

type Fixtures = {
  checkoutPage: CheckoutPage;
  orderServiceClient: OrderServiceClient;
  gatewaySandboxClient: PaymentGatewaySandboxClient;
  productStockClient: ProductStockClient;
};

/**
 * Shared fixtures so each spec gets a fresh, independent instance per test —
 * no mutable state carries over between tests.
 */
export const test = base.extend<Fixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  orderServiceClient: async ({ request }, use) => {
    await use(new OrderServiceClient(request));
  },
  gatewaySandboxClient: async ({ request }, use) => {
    await use(new PaymentGatewaySandboxClient(request));
  },
  productStockClient: async ({ request }, use) => {
    await use(new ProductStockClient(request));
  },
});

export { expect };