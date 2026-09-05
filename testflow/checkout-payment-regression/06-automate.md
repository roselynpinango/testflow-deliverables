# Test Automation — Checkout Payment Regression

No existing repository connected, so all files below are **new**. Ordered by risk band: critical → high (file 1), then medium/security (file 2). Total: 9 `test()` blocks across 2 spec files (within the 12-block / 2-file budget), sharing setup via fixtures/POM/API helper to avoid duplication and order dependence.

---

### `fixtures/test-data.ts`
**New file** — env-var-backed test data (no hardcoded credentials/URLs), unique-ID helper for test independence.

```typescript
import { randomUUID } from 'crypto';

/**
 * Fails fast with a clear message if a required sandbox config value is missing,
 * rather than falling back to an invented value.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Configure sandbox/test values via .env — never hardcode credentials or URLs.`
    );
  }
  return value;
}

/** Guarantees no shared mutable state between tests. */
export function uniqueOrderRef(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export const TEST_DATA = {
  promoCode: {
    validSandbox: () => requireEnv('SANDBOX_PROMO_CODE_VALID'),
    // TC-009 / R-05 — injection payload, sandbox-only, not a real customer input
    sqlInjectionPayload: "' OR '1'='1' --",
  },
  savedCard: {
    // Tokenized sandbox card reference only — never a real PAN/CVV (PCI-DSS).
    tokenRef: () => requireEnv('SANDBOX_SAVED_CARD_TOKEN'),
  },
};
```

---

### `pages/CheckoutPage.ts`
**New file** — POM for checkout UI, data-testid / ARIA role selectors only.

```typescript
import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the checkout page. No CSS selectors — data-testid or
 * ARIA role only, per suite convention.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly promoCodeInput: Locator;
  readonly applyPromoButton: Locator;
  readonly promoErrorMessage: Locator;
  readonly cartTotal: Locator;
  readonly savedCardOption: Locator;
  readonly submitPaymentButton: Locator;
  readonly stockUnavailableMessage: Locator;
  readonly paymentErrorMessage: Locator;
  readonly maskedCardDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.applyPromoButton = page.getByRole('button', { name: 'Apply promo code' });
    this.promoErrorMessage = page.getByTestId('promo-error-message');
    this.cartTotal = page.getByTestId('cart-total');
    this.savedCardOption = page.getByTestId('saved-card-option');
    this.submitPaymentButton = page.getByRole('button', { name: 'Pay now' });
    this.stockUnavailableMessage = page.getByTestId('stock-unavailable-message');
    this.paymentErrorMessage = page.getByTestId('payment-error-message');
    this.maskedCardDisplay = page.getByTestId('masked-card-display');
  }

  async goto(path = '/checkout') {
    await this.page.goto(path);
  }

  async applyPromoCode(code: string) {
    await this.promoCodeInput.fill(code);
    await this.applyPromoButton.click();
  }

  async selectSavedCard() {
    await this.savedCardOption.click();
  }

  async submitPayment() {
    await this.submitPaymentButton.click();
  }

  async getDisplayedTotal(): Promise<string> {
    return (await this.cartTotal.textContent())?.trim() ?? '';
  }
}
```

---

### `helpers/paymentApi.ts`
**New file** — API helper for gateway/order/webhook operations.

> Endpoint paths reflect the assumed contract from the supplied test basis; they are **not verified against a live API spec** — confirm before treating as authoritative (TBD).

```typescript
import { APIRequestContext } from '@playwright/test';

export class PaymentApi {
  constructor(private readonly request: APIRequestContext, private readonly baseUrl: string) {}

  async authorizePayment(orderRef: string, amount: number, cardTokenRef: string) {
    return this.request.post(`${this.baseUrl}/payments/authorize`, {
      data: { orderRef, amount, cardTokenRef },
    });
  }

  async captureOrder(orderRef: string) {
    return this.request.post(`${this.baseUrl}/payments/capture`, { data: { orderRef } });
  }

  async getOrderStatus(orderRef: string) {
    return this.request.get(`${this.baseUrl}/orders/${orderRef}/status`);
  }

  async getReversalRecord(orderRef: string) {
    return this.request.get(`${this.baseUrl}/payments/${orderRef}/reversal`);
  }

  /** Sandbox-only test control endpoint for seeding stock state. */
  async setStockQuantity(itemSku: string, quantity: number) {
    return this.request.post(`${this.baseUrl}/test-support/stock`, {
      data: { itemSku, quantity },
    });
  }

  async sendGatewayCallback(orderRef: string, statusCode: number, payload: unknown) {
    return this.request.post(`${this.baseUrl}/webhooks/gateway-callback`, {
      data: { orderRef, simulatedStatusCode: statusCode, payload },
    });
  }

  async getCallbackProcessingLog(orderRef: string) {
    return this.request.get(`${this.baseUrl}/test-support/callback-log/${orderRef}`);
  }

  /** Sandbox-only log inspection endpoint — never used against production logs. */
  async getApplicationErrorLog(orderRef: string) {
    return this.request.get(`${this.baseUrl}/test-support/logs/${orderRef}`);
  }
}
```

---

### `fixtures/checkout.fixtures.ts`
**New file** — shared fixtures wiring POM + API helper (avoids duplicated setup across spec files).

```typescript
import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';
import { PaymentApi } from '../helpers/paymentApi';
import { requireEnv } from './test-data';

type CheckoutFixtures = {
  checkoutPage: CheckoutPage;
  paymentApi: PaymentApi;
};

export const test = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  paymentApi: async ({ request }, use) => {
    await use(new PaymentApi(request, requireEnv('CHECKOUT_API_BASE_URL')));
  },
});

export { expect };
```

---

### `tests/checkout-payment-critical.spec.ts`
**New file** — covers TC-001, TC-002 (critical), TC-003, TC-004, TC-005, TC-006, TC-007 (high). Critical-first ordering.

```typescript
import { test, expect } from '../fixtures/checkout.fixtures';
import { TEST_DATA, uniqueOrderRef } from '../fixtures/test-data';

/**
 * Checkout Payment Regression — Critical & High risk band.
 * Traceability: R-01..R-04 (Approved Risk Register / Scenarios artifact).
 */

test.describe('Authorization & order/state consistency (critical)', () => {
  // TC-001 / R-01 — @smoke @critical
  test('authorized amount equals recalculated cart total after promo code application', async ({
    checkoutPage,
    paymentApi,
  }) => {
    const orderRef = uniqueOrderRef('order-promo');
    await checkoutPage.goto();
    await checkoutPage.selectSavedCard();
    await checkoutPage.applyPromoCode(TEST_DATA.promoCode.validSandbox());

    const recalculatedTotalText = await checkoutPage.getDisplayedTotal();
    expect(recalculatedTotalText, 'Cart total must be displayed after promo code application').not.toBe('');
    const recalculatedTotal = Number(recalculatedTotalText.replace(/[^0-9.]/g, ''));

    await checkoutPage.submitPayment();

    const authResponse = await paymentApi.authorizePayment(
      orderRef,
      recalculatedTotal,
      TEST_DATA.savedCard.tokenRef()
    );
    expect(authResponse.ok(), 'Authorization request should be accepted by the gateway sandbox').toBeTruthy();

    const authBody = await authResponse.json();
    expect(
      authBody.authorizedAmount,
      `Authorized amount (${authBody.authorizedAmount}) must equal recalculated cart total (${recalculatedTotal}) — zero variance expected`
    ).toBe(recalculatedTotal);
    expect(
      authBody.amountMismatch,
      'No amount-mismatch flag should be recorded between cart display and gateway authorization request'
    ).toBeFalsy();
  });

  // TC-002 / R-02 — @regression @critical
  test('order is not confirmed and capture is reversed when stock reservation fails after capture succeeds', async ({
    paymentApi,
  }) => {
    const orderRef = uniqueOrderRef('order-stockfail');

    const captureResponse = await paymentApi.captureOrder(orderRef);
    expect(captureResponse.ok(), 'Payment capture should succeed as test precondition').toBeTruthy();

    const statusResponse = await paymentApi.getOrderStatus(orderRef);
    const statusBody = await statusResponse.json();
    expect(
      statusBody.status,
      `Order status must not be "confirmed" when stock reservation fails post-capture; got "${statusBody.status}"`
    ).not.toBe('confirmed');

    const reversalResponse = await paymentApi.getReversalRecord(orderRef);
    expect(reversalResponse.ok(), 'A reversal record must exist referencing the original capture').toBeTruthy();
    const reversalBody = await reversalResponse.json();
    expect(reversalBody.reversed, 'Captured funds must be reversed when stock reservation fails').toBeTruthy();
  });
});

test.describe('Capture-time stock validation (high)', () => {
  // TC-003 / R-03 — @negative @high
  test('payment capture is blocked when stock drops to zero before capture', async ({ paymentApi }) => {
    const orderRef = uniqueOrderRef('order-zerostock');
    const itemSku = 'sandbox-sku-zero-stock';

    await paymentApi.setStockQuantity(itemSku, 0);
    const captureResponse = await paymentApi.captureOrder(orderRef);

    expect(
      captureResponse.status(),
      'Capture request must be rejected (blocked/failed) when stock is unavailable'
    ).not.toBe(200);

    const captureBody = await captureResponse.json();
    expect(captureBody.stockUnavailable, 'Capture response must indicate stock-unavailable outcome').toBeTruthy();
  });

  // TC-007 / R-03 — @boundary @edge-case @high
  test('payment capture succeeds and stock decrements to zero when exactly one unit remains', async ({
    paymentApi,
  }) => {
    const orderRef = uniqueOrderRef('order-oneunit');
    const itemSku = 'sandbox-sku-one-unit';

    await paymentApi.setStockQuantity(itemSku, 1);
    const captureResponse = await paymentApi.captureOrder(orderRef);

    expect(captureResponse.ok(), 'Capture must succeed when exactly one unit is in stock').toBeTruthy();

    const captureBody = await captureResponse.json();
    expect(
      captureBody.remainingStock,
      `Stock quantity must decrement to 0 after capture; got ${captureBody.remainingStock}`
    ).toBe(0);
  });
});

test.describe('Gateway webhook contract handling (high)', () => {
  // TC-004 / R-04 — @regression @data-driven @high
  test('accepts callback and updates order status on HTTP 200 with valid schema', async ({ paymentApi }) => {
    const orderRef = uniqueOrderRef('order-webhook-valid');

    const callbackResponse = await paymentApi.sendGatewayCallback(orderRef, 200, { schema: 'valid_schema' });
    expect(callbackResponse.ok(), 'Callback processing endpoint should accept a valid, well-formed payload').toBeTruthy();

    const statusResponse = await paymentApi.getOrderStatus(orderRef);
    const statusBody = await statusResponse.json();
    expect(statusBody.status, 'Order status must be updated to reflect the accepted callback outcome').not.toBe(
      'authorized'
    );
  });

  // TC-005 / R-04 — @regression @data-driven @high
  test('rejects malformed payload and logs a schema validation error on HTTP 200', async ({ paymentApi }) => {
    const orderRef = uniqueOrderRef('order-webhook-malformed');

    const callbackResponse = await paymentApi.sendGatewayCallback(orderRef, 200, { schema: 'malformed_schema' });
    expect(
      callbackResponse.status(),
      'Malformed payload must be rejected by the checkout system, not silently accepted'
    ).not.toBe(200);

    const logResponse = await paymentApi.getCallbackProcessingLog(orderRef);
    const logBody = await logResponse.json();
    expect(
      logBody.schemaValidationError,
      'A schema-validation-error log entry must be recorded for the malformed callback'
    ).toBeTruthy();
  });

  // TC-006 / R-04 — @regression @data-driven @high
  test('retries callback processing per contract on HTTP 500 with valid schema', async ({ paymentApi }) => {
    const orderRef = uniqueOrderRef('order-webhook-retry');

    await paymentApi.sendGatewayCallback(orderRef, 500, { schema: 'valid_schema' });

    const logResponse = await paymentApi.getCallbackProcessingLog(orderRef);
    const logBody = await logResponse.json();
    expect(
      logBody.retryAttempted,
      'A retry attempt must be logged/executed per the integration contract on HTTP 500'
    ).toBeTruthy();

    const statusResponse = await paymentApi.getOrderStatus(orderRef);
    const statusBody = await statusResponse.json();
    expect(
      statusBody.status,
      'Order status must remain non-final (not prematurely confirmed) pending retry outcome'
    ).not.toBe('confirmed');
    // Exact retry count/backoff interval not specified in the test basis (TBD) —
    // intentionally not asserted, to avoid fabricating an unverified contract detail.
  });
});
```

---

### `tests/checkout-payment-security.spec.ts`
**New file** — covers TC-008, TC-009 (medium/security). Satisfies the regulated-industry security-gate and the ≥1 negative/error-scenario requirement.

```typescript
import { test, expect } from '../fixtures/checkout.fixtures';
import { TEST_DATA, uniqueOrderRef } from '../fixtures/test-data';

/**
 * Checkout Payment Regression — Security (medium risk band).
 * Traceability: R-05 (Approved Risk Register / Scenarios artifact).
 */

test.describe('Data exposure and input validation (security)', () => {
  // TC-008 / R-05 — @security
  test('CVV is not exposed in logs or error response when gateway returns an error', async ({
    checkoutPage,
    paymentApi,
  }) => {
    const orderRef = uniqueOrderRef('order-gateway-error');
    await checkoutPage.goto();
    await checkoutPage.selectSavedCard();
    await checkoutPage.submitPayment();

    await paymentApi.authorizePayment(orderRef, 0, TEST_DATA.savedCard.tokenRef());

    const errorMessageText = await checkoutPage.paymentErrorMessage.textContent();
    expect(errorMessageText, 'Error message shown to the customer must not contain a CVV value').not.toMatch(
      /\bcvv\b\s*[:=]?\s*\d{3,4}/i
    );

    const logResponse = await paymentApi.getApplicationErrorLog(orderRef);
    const logBody = await logResponse.json();
    expect(
      JSON.stringify(logBody),
      'Application log entry for this order must not contain a CVV value'
    ).not.toMatch(/\bcvv\b\s*[:=]?\s*\d{3,4}/i);

    const maskedCardText = await checkoutPage.maskedCardDisplay.textContent();
    expect(
      maskedCardText,
      'Displayed card number must show only masked first-6/last-4 digits, no full PAN'
    ).toMatch(/^\d{6}\*+\d{4}$/);
  });

  // TC-009 / R-05 — @security @negative
  test('SQL injection payload in promo code field is rejected without exposing system internals', async ({
    checkoutPage,
  }) => {
    await checkoutPage.goto();
    await checkoutPage.applyPromoCode(TEST_DATA.promoCode.sqlInjectionPayload);

    const errorText = await checkoutPage.promoErrorMessage.textContent();
    expect(errorText, 'A generic invalid-promo-code message must be shown for injection payloads').toMatch(
      /invalid promo code/i
    );
    expect(
      errorText,
      'No database error or stack trace should be exposed in the promo error message'
    ).not.toMatch(/(sql|stack trace|exception|syntax error)/i);
  });
});
```

---

## Traceability

| Test file | test() block | Case | Risk | Scenario tag |
|---|---|---|---|---|
| checkout-payment-critical.spec.ts | authorized amount... | TC-001 | Critical | @smoke @critical |
| checkout-payment-critical.spec.ts | order is not confirmed... | TC-002 | Critical | @regression |
| checkout-payment-critical.spec.ts | capture is blocked... | TC-003 | High | @negative |
| checkout-payment-critical.spec.ts | exactly one unit... | TC-007 | High | @boundary |
| checkout-payment-critical.spec.ts | accepts callback (200/valid) | TC-004 | High | @data-driven |
| checkout-payment-critical.spec.ts | rejects malformed payload | TC-005 | High | @data-driven |
| checkout-payment-critical.spec.ts | retries on 500 | TC-006 | High | @data-driven |
| checkout-payment-security.spec.ts | CVV not exposed | TC-008 | Medium | @security |
| checkout-payment-security.spec.ts | SQLi rejected | TC-009 | Medium | @security @negative |

## Not implemented in this pass
- **R-03 concurrency/race-condition** (concurrent-buyer stock race at capture time): explicitly out of scope per the Scenarios artifact's Blockers note — no test written; flagged here as an open gap, not silently dropped.
- Retry backoff/count assertion in TC-006 intentionally omitted — contract detail is TBD in the test basis.
- Endpoint paths in `helpers/paymentApi.ts` are assumed from the test basis and require confirmation against the actual API contract before this suite is treated as authoritative.

This automation draft requires tester review before execution/sign-off; no run evidence exists yet.