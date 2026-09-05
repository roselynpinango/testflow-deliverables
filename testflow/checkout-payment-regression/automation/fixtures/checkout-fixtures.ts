import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { CheckoutPage } from '../pages/checkout-page';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CheckoutTestData {
  cartItems: CartItem[];
  cartTotal: number;
  idempotencyKey: string;
}

// Builds an isolated cart per test — no shared mutable state between tests,
// per ISO/IEC 25010 maintainability (no order dependence).
function buildCartFixture(): CheckoutTestData {
  const item: CartItem = {
    id: `item-${randomUUID()}`,
    name: 'Sandbox Test Item',
    price: 49.99,
    quantity: 1,
  };
  return {
    cartItems: [item],
    cartTotal: item.price * item.quantity,
    idempotencyKey: randomUUID(),
  };
}

type Fixtures = {
  checkoutPage: CheckoutPage;
  testData: CheckoutTestData;
};

export const test = base.extend<Fixtures>({
  testData: async ({}, use) => {
    await use(buildCartFixture());
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };

// Sandbox test payment credentials — sourced from environment configuration.
// Never real card data. Values are intentionally not fabricated here.
export const sandboxCard = {
  number: process.env.SANDBOX_CARD_NUMBER ?? '',
  cvv: process.env.SANDBOX_CARD_CVV ?? '',
  expiry: process.env.SANDBOX_CARD_EXPIRY ?? '',
};

// Base URL / route pattern for the test orders-and-charges API and the
// payment gateway call, both environment-configured. Exact paths were not
// supplied in the test basis — confirm against the application before
// relying on these in CI.
export const apiBaseUrl = process.env.ORDERS_API_BASE_URL ?? '';
export const gatewayRoutePattern = process.env.PAYMENT_GATEWAY_ROUTE_PATTERN ?? '**/api/payments/**';