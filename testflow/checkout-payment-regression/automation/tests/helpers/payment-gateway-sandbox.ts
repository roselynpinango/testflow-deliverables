import { APIRequestContext } from '@playwright/test';

/**
 * Thin API client over the payment gateway sandbox used for assertions that
 * cannot be observed from the UI alone (capture amount, masked log entries,
 * debit counts, stock-exhaustion side channel).
 *
 * Endpoint paths below are draft assumptions for this test suite — confirm
 * against the actual sandbox API contract before relying on them in CI.
 * Base URL is read from GATEWAY_SANDBOX_API_URL; never hardcoded.
 */
export class PaymentGatewaySandbox {
  constructor(private readonly request: APIRequestContext, private readonly baseUrl: string) {}

  async getCaptureAmount(orderId: string): Promise<number | undefined> {
    const res = await this.request.get(`${this.baseUrl}/transactions/${orderId}`);
    if (!res.ok()) return undefined;
    const body = await res.json();
    return body.captureAmount;
  }

  async getTransactionLog(orderId: string): Promise<{ maskedCardNumber: string; rawEntry: string } | undefined> {
    const res = await this.request.get(`${this.baseUrl}/transactions/${orderId}/log`);
    if (!res.ok()) return undefined;
    const body = await res.json();
    return { maskedCardNumber: body.maskedCardNumber, rawEntry: JSON.stringify(body) };
  }

  async getDebitCount(orderId: string): Promise<number | undefined> {
    const res = await this.request.get(`${this.baseUrl}/transactions/${orderId}/debits`);
    if (!res.ok()) return undefined;
    const body = await res.json();
    return body.debitCount;
  }

  async getOrderStatus(orderId: string): Promise<string | undefined> {
    const res = await this.request.get(`${this.baseUrl}/orders/${orderId}`);
    if (!res.ok()) return undefined;
    const body = await res.json();
    return body.status;
  }

  async exhaustStock(itemId: string): Promise<void> {
    await this.request.post(`${this.baseUrl}/test-hooks/stock/${itemId}/exhaust`);
  }
}