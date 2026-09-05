import { APIRequestContext, request } from '@playwright/test';

/**
 * Thin API client for verifying backend transaction/order/log state that isn't
 * observable purely through the UI. Base URL comes from an env var — never hardcoded.
 *
 * NOTE (transparency, not fabrication): the endpoints below (/test/transactions,
 * /test/orders/:id, /test/logs, /test/inventory/:id/set-stock,
 * /test/orders/:id/simulate-callback-failure) are ASSUMED test-environment hooks.
 * They have not been confirmed against a real API contract for this project.
 * Verify actual endpoint names/payloads with the environment owner before execution.
 */
export class PaymentApiClient {
  private constructor(
    private readonly context: APIRequestContext,
  ) {}

  static async create(): Promise<PaymentApiClient> {
    const baseURL = process.env.TEST_API_BASE_URL;
    if (!baseURL) {
      throw new Error(
        'TEST_API_BASE_URL is not set. Sandbox/test API endpoint is an open blocker (EN-2) — configure before running this suite.'
      );
    }
    const context = await request.newContext({ baseURL });
    return new PaymentApiClient(context);
  }

  async getTransactionsByIdempotencyKey(key: string) {
    const res = await this.context.get('/test/transactions', { params: { idempotencyKey: key } });
    return res.json();
  }

  async getOrderStatus(orderId: string) {
    const res = await this.context.get(`/test/orders/${orderId}`);
    return res.json();
  }

  async simulateCaptureCallbackFailure(orderId: string) {
    return this.context.post(`/test/orders/${orderId}/simulate-callback-failure`);
  }

  async setStockLevel(itemId: string, quantity: number) {
    return this.context.post(`/test/inventory/${itemId}/set-stock`, { data: { quantity } });
  }

  async getApplicationLogs(orderId: string) {
    const res = await this.context.get('/test/logs', { params: { orderId } });
    return res.json();
  }

  async dispose() {
    await this.context.dispose();
  }
}