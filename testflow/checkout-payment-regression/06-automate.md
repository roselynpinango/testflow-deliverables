# Test Automation — Checkout Payment Regression

No repository connected, so all files below are **new**. Total: **8 `test()` blocks across 2 spec files**, ordered critical → high → medium, sharing setup through fixtures/POM/helpers per the maintainability requirement. This covers all 8 approved cases (TC-001…TC-008); nothing is deferred.

Traceability: risk band and case ID are in each test title; R-01…R-05 map to the risk register per the approved artifacts.

---

### `fixtures/checkout-fixtures.ts` — new file (test-scoped fixtures, no shared mutable state)

```typescript
import { test as base, request, APIRequestContext } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';

type CardDetails = {
  cardNumber: string;
  expiry: string;
  cvv: string;
};

type OrderFixture = {
  orderId: string;
};

type Fixtures = {
  checkoutPage: CheckoutPage;
  apiContext: APIRequestContext;
  sandboxSuccessCard: CardDetails;
  sandboxDeclineCard: CardDetails;
  lastUnitStockOrder: OrderFixture & { sku: string };
  discountedCartOrder: OrderFixture;
  fractionalRoundingOrder: OrderFixture;
  confirmedWebhookOrder: OrderFixture & { paymentReference: string };
};

// NOTE: fixture provisioning mechanism (how these orders/SKUs are seeded in the
// sandbox environment) is not specified in the test basis — marked TBD.
// All values come from environment configuration, never hardcoded here.
export const test = base.extend<Fixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.MERCHANT_API_BASE_URL ?? '',
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.TEST_API_TOKEN ?? ''}`,
      },
    });
    await use(context);
    await context.dispose();
  },

  sandboxSuccessCard: async ({}, use) => {
    await use({
      cardNumber: process.env.SANDBOX_CARD_SUCCESS ?? '',
      expiry: process.env.SANDBOX_CARD_EXPIRY ?? '',
      cvv: process.env.SANDBOX_CARD_CVV ?? '',
    });
  },

  sandboxDeclineCard: async ({}, use) => {
    await use({
      cardNumber: process.env.SANDBOX_CARD_DECLINE ?? '',
      expiry: process.env.SANDBOX_CARD_EXPIRY ?? '',
      cvv: process.env.SANDBOX_CARD_CVV ?? '',
    });
  },

  lastUnitStockOrder: async ({}, use) => {
    await use({
      orderId: process.env.FIXTURE_STOCK_RACE_ORDER_ID ?? '',
      sku: process.env.FIXTURE_LAST_UNIT_SKU ?? '',
    });
  },

  discountedCartOrder: async ({}, use) => {
    await use({ orderId: process.env.FIXTURE_DISCOUNTED_ORDER_ID ?? '' });
  },

  fractionalRoundingOrder: async ({}, use) => {
    await use({ orderId: process.env.FIXTURE_FRACTIONAL_ORDER_ID ?? '' });
  },

  confirmedWebhookOrder: async ({}, use) => {
    await use({
      orderId: process.env.FIXTURE_CONFIRMED_ORDER_ID ?? '',
      paymentReference: process.env.FIXTURE_CONFIRMED_PAYMENT_REF ?? '',
    });
  },
});

export { expect } from '@playwright/test';
```

---

### `pages/CheckoutPage.ts` — new file (Page Object Model, data-testid selectors only)

```typescript
import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly promoCodeInput: Locator;
  readonly applyPromoButton: Locator;
  readonly promoMessage: Locator;
  readonly cartTotal: Locator;
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvvInput: Locator;
  readonly submitPaymentButton: Locator;
  readonly paymentErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.applyPromoButton = page.getByTestId('apply-promo-button');
    this.promoMessage = page.getByTestId('promo-message');
    this.cartTotal = page.getByTestId('cart-total');
    this.cardNumberInput = page.getByTestId('card-number-input');
    this.cardExpiryInput = page.getByTestId('card-expiry-input');
    this.cardCvvInput = page.getByTestId('card-cvv-input');
    this.submitPaymentButton = page.getByTestId('submit-payment-button');
    this.paymentErrorMessage = page.getByTestId('payment-error-message');
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.applyPromoButton.click();
  }

  async getPromoMessageText(): Promise<string> {
    return (await this.promoMessage.textContent())?.trim() ?? '';
  }

  async getCartTotalText(): Promise<string> {
    return (await this.cartTotal.textContent())?.trim() ?? '';
  }

  async submitCardPayment(card: { cardNumber: string; expiry: string; cvv: string }): Promise<void> {
    await this.cardNumberInput.fill(card.cardNumber);
    await this.cardExpiryInput.fill(card.expiry);
    await this.cardCvvInput.fill(card.cvv);
    await this.submitPaymentButton.click();
  }

  async getPaymentErrorResponseText(): Promise<string> {
    return (await this.paymentErrorMessage.textContent())?.trim() ?? '';
  }
}
```

---

### `helpers/payment-api.ts` — new file (shared API helpers, avoids duplicated request logic)

```typescript
import { APIRequestContext, APIResponse } from '@playwright/test';

export async function getOrderStatus(api: APIRequestContext, orderId: string): Promise<APIResponse> {
  return api.get(`/orders/${orderId}/status`);
}

export async function getGatewayAuthorizationOutcome(
  api: APIRequestContext,
  paymentRef: string
): Promise<APIResponse> {
  return api.get(`/sandbox-gateway/authorizations/${paymentRef}`);
}

// TBD: assumes a sandbox-only test hook for simulating a stock race condition.
// Not confirmed against a real environment contract — flag for tester review.
export async function triggerConcurrentStockDepletingOrder(
  api: APIRequestContext,
  sku: string
): Promise<APIResponse> {
  return api.post('/test-hooks/deplete-stock', { data: { sku } });
}

export async function getCaptureRecord(api: APIRequestContext, orderId: string): Promise<APIResponse> {
  return api.get(`/sandbox-gateway/captures/${orderId}`);
}

// TBD: assumes a sandbox-only replay endpoint for webhook redelivery.
export async function resendWebhookCallback(api: APIRequestContext, paymentRef: string): Promise<APIResponse> {
  return api.post('/webhooks/payment-gateway/replay', { data: { paymentRef } });
}

export async function getOrderStatusTransitionLog(api: APIRequestContext, orderId: string): Promise<APIResponse> {
  return api.get(`/orders/${orderId}/status-history`);
}
```

---

### `tests/payment-integrity.spec.ts` — new file
Covers TC-001 (critical), TC-002/TC-003/TC-004/TC-005 (high), ordered by risk.

```typescript
import { test, expect } from '../fixtures/checkout-fixtures';
import {
  getOrderStatus,
  getGatewayAuthorizationOutcome,
  triggerConcurrentStockDepletingOrder,
  getCaptureRecord,
  resendWebhookCallback,
  getOrderStatusTransitionLog,
} from '../helpers/payment-api';

test.describe('Checkout Payment Regression — Payment Integrity', () => {
  test('TC-001 @smoke @critical order is not confirmed when stock depletes during in-progress authorization (R-01)', async ({
    checkoutPage,
    apiContext,
    sandboxSuccessCard,
    lastUnitStockOrder,
  }) => {
    await checkoutPage.submitCardPayment(sandboxSuccessCard);

    const depleteResponse = await triggerConcurrentStockDepletingOrder(apiContext, lastUnitStockOrder.sku);
    expect(
      depleteResponse.ok(),
      'Precondition failed: concurrent stock-depleting test hook must succeed to exercise this race condition'
    ).toBeTruthy();

    const orderStatusResponse = await getOrderStatus(apiContext, lastUnitStockOrder.orderId);
    const orderStatusBody = await orderStatusResponse.json();

    const gatewayOutcomeResponse = await getGatewayAuthorizationOutcome(apiContext, orderStatusBody.paymentReference);
    const gatewayOutcomeBody = await gatewayOutcomeResponse.json();

    expect(
      orderStatusBody.status,
      'Order status must not be "confirmed" when stock depleted before capture completed'
    ).not.toBe('confirmed');

    expect(
      orderStatusBody.status,
      'Order status must match the gateway authorization outcome — both must report payment as not captured'
    ).toBe(gatewayOutcomeBody.status);

    expect(
      gatewayOutcomeBody.captured,
      'Gateway authorization outcome must report captured=false when capture did not complete'
    ).toBe(false);
  });

  test('TC-002 @regression @risk-high captured amount matches discounted cart total after promo recalculation (R-02)', async ({
    checkoutPage,
    apiContext,
    sandboxSuccessCard,
    discountedCartOrder,
  }) => {
    const displayedTotalText = await checkoutPage.getCartTotalText();
    const displayedTotal = parseFloat(displayedTotalText.replace(/[^0-9.]/g, ''));

    await checkoutPage.submitCardPayment(sandboxSuccessCard);

    const captureResponse = await getCaptureRecord(apiContext, discountedCartOrder.orderId);
    const captureBody = await captureResponse.json();

    expect(
      captureBody.amount,
      `Captured amount (${captureBody.amount}) must equal the displayed discounted cart total (${displayedTotal}) exactly`
    ).toBe(displayedTotal);
  });

  test('TC-003 @boundary @edge-case @risk-high captured amount is correctly rounded for fractional sub-unit promo totals (R-02)', async ({
    checkoutPage,
    apiContext,
    sandboxSuccessCard,
    fractionalRoundingOrder,
  }) => {
    const displayedTotalText = await checkoutPage.getCartTotalText();
    const displayedTotal = parseFloat(displayedTotalText.replace(/[^0-9.]/g, ''));

    await checkoutPage.submitCardPayment(sandboxSuccessCard);

    const captureResponse = await getCaptureRecord(apiContext, fractionalRoundingOrder.orderId);
    const captureBody = await captureResponse.json();
    const difference = Math.abs(captureBody.amount - displayedTotal);

    expect(
      difference,
      `Captured amount (${captureBody.amount}) must match displayed total (${displayedTotal}) rounded to the currency's smallest unit with zero discrepancy`
    ).toBe(0);
  });

  test('TC-004 @negative @security @risk-high CVV is not exposed and card number is masked when payment is declined (R-03)', async ({
    checkoutPage,
    sandboxDeclineCard,
  }) => {
    await checkoutPage.submitCardPayment(sandboxDeclineCard);

    const errorResponseText = await checkoutPage.getPaymentErrorResponseText();

    expect(
      errorResponseText.includes(sandboxDeclineCard.cvv),
      'Declined-payment error response must never contain the raw CVV value'
    ).toBeFalsy();

    const unmaskedPanPattern = /\b\d{7,}\b/;
    expect(
      unmaskedPanPattern.test(errorResponseText),
      'Declined-payment error response must not contain an unmasked card number (7+ consecutive digits)'
    ).toBeFalsy();

    // Server-side log inspection (raw CVV/PAN never written to logs) is NOT exercised
    // here — Playwright has no access to application logs. TBD: requires a log
    // assertion hook or manual verification before this part of TC-004 can be closed.
  });

  test('TC-005 @regression @risk-high duplicate webhook redelivery does not alter a confirmed order status (R-04)', async ({
    apiContext,
    confirmedWebhookOrder,
  }) => {
    const beforeLogResponse = await getOrderStatusTransitionLog(apiContext, confirmedWebhookOrder.orderId);
    const beforeLogBody = await beforeLogResponse.json();
    const transitionCountBefore = beforeLogBody.transitions.length;

    const replayResponse = await resendWebhookCallback(apiContext, confirmedWebhookOrder.paymentReference);
    expect(
      replayResponse.ok(),
      'Webhook replay endpoint must accept the redelivered callback for this test to be valid'
    ).toBeTruthy();

    const orderStatusResponse = await getOrderStatus(apiContext, confirmedWebhookOrder.orderId);
    const orderStatusBody = await orderStatusResponse.json();

    const afterLogResponse = await getOrderStatusTransitionLog(apiContext, confirmedWebhookOrder.orderId);
    const afterLogBody = await afterLogResponse.json();
    const transitionCountAfter = afterLogBody.transitions.length;

    expect(
      orderStatusBody.status,
      'Order status must remain "confirmed" after a duplicate webhook redelivery'
    ).toBe('confirmed');

    expect(
      transitionCountAfter,
      `Status-transition log must show no additional entry after redelivery (before=${transitionCountBefore}, after=${transitionCountAfter})`
    ).toBe(transitionCountBefore);
  });
});
```

---

### `tests/promo-validation.spec.ts` — new file
Covers TC-006, TC-007, TC-008 (medium risk, R-05). Shared assertion logic factored into one helper to avoid duplication; each partition kept as its own independent test per the approved cases' explicit split.

```typescript
import { test, expect } from '../fixtures/checkout-fixtures';
import { CheckoutPage } from '../pages/CheckoutPage';

async function assertPromoRejectedWithoutTotalChange(
  checkoutPage: CheckoutPage,
  code: string,
  expectedMessage: string
): Promise<string> {
  const preTotalText = await checkoutPage.getCartTotalText();

  await checkoutPage.applyPromoCode(code);

  const messageText = await checkoutPage.getPromoMessageText();
  const postTotalText = await checkoutPage.getCartTotalText();

  expect(
    messageText.toLowerCase(),
    `Promo response for "${code}" must read "${expectedMessage}" but was "${messageText}"`
  ).toBe(expectedMessage.toLowerCase());

  expect(
    postTotalText,
    `Cart total must remain unchanged at "${preTotalText}" after promo code "${code}" is rejected`
  ).toBe(preTotalText);

  return messageText;
}

test.describe('Checkout Payment Regression — Promo Code Validation (R-05)', () => {
  test('TC-006 @regression @data-driven @risk-medium expired promo code is rejected without changing cart total', async ({
    checkoutPage,
  }) => {
    await assertPromoRejectedWithoutTotalChange(checkoutPage, 'EXPIRED2023', 'promo code expired');
  });

  test('TC-007 @regression @data-driven @risk-medium malformed promo code is rejected with invalid-format message and no stack trace leak', async ({
    checkoutPage,
  }) => {
    const messageText = await assertPromoRejectedWithoutTotalChange(
      checkoutPage,
      'ABC#$%123',
      'promo code invalid format'
    );

    expect(
      /exception|stack trace|at \w+\.\w+/i.test(messageText),
      'Invalid-format promo response must not leak a server exception or stack trace (data-exposure risk)'
    ).toBeFalsy();
  });

  test('TC-008 @regression @data-driven @risk-medium non-existent promo code is rejected as not recognized', async ({
    checkoutPage,
  }) => {
    await assertPromoRejectedWithoutTotalChange(checkoutPage, 'NOTEXIST99', 'promo code not recognized');
  });
});
```

---

## Notes for tester review

- **Selectors** are invented `data-testid` names (no baseline was supplied) — confirm they match the real DOM before running.
- **Environment variables required** (not fabricated values, names only): `MERCHANT_API_BASE_URL`, `TEST_API_TOKEN`, `SANDBOX_CARD_SUCCESS`, `SANDBOX_CARD_DECLINE`, `SANDBOX_CARD_CVV`, `SANDBOX_CARD_EXPIRY`, `FIXTURE_STOCK_RACE_ORDER_ID`, `FIXTURE_LAST_UNIT_SKU`, `FIXTURE_DISCOUNTED_ORDER_ID`, `FIXTURE_FRACTIONAL_ORDER_ID`, `FIXTURE_CONFIRMED_ORDER_ID`, `FIXTURE_CONFIRMED_PAYMENT_REF`.
- **TBD / open questions**:
  - The stock-depletion and webhook-replay endpoints in `helpers/payment-api.ts` are assumed sandbox test hooks — their real contract is not in the test basis and needs confirmation.
  - TC-004's log-inspection requirement (no raw CVV/PAN in application logs) is not automatable via Playwright UI/API access alone; flagged inline as a manual/verification gap.

## Not implemented in this pass
None — all 8 approved cases (TC-001…TC-008) are implemented. Broader security categories called out by the regulated-industry directive (authentication brute-force/lockout, authorization/role-boundary, injection/oversized-input, session-token expiry) have **no corresponding approved scenario or case** in this artifact set and are out of scope here — recommend raising them at the Scenarios/Cases stage for a future cycle.