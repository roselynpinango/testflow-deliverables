import { APIRequestContext } from '@playwright/test';

/**
 * Thin client over the orders/charges test API used to verify backend state
 * after a UI-driven checkout flow. Endpoint paths are assumptions pending
 * confirmation against the application's actual test API.
 */
export class OrdersApiClient {
  constructor(private request: APIRequestContext, private baseUrl: string) {}

  async getChargeCount(idempotencyKey: string): Promise<number> {
    const res = await this.request.get(`${this.baseUrl}/charges`, {
      params: { idempotencyKey },
    });
    const body = await res.json();
    return Array.isArray(body.charges) ? body.charges.length : 0;
  }

  async getOrderCount(idempotencyKey: string): Promise<number> {
    const res = await this.request.get(`${this.baseUrl}/orders`, {
      params: { idempotencyKey },
    });
    const body = await res.json();
    return Array.isArray(body.orders) ? body.orders.length : 0;
  }

  async setItemStock(itemId: string, quantity: number): Promise<void> {
    await this.request.post(`${this.baseUrl}/test-data/stock`, {
      data: { itemId, quantity },
    });
  }

  async getAuthorizationState(itemId: string): Promise<string> {
    const res = await this.request.get(`${this.baseUrl}/authorizations`, {
      params: { itemId },
    });
    const body = await res.json();
    return body.status;
  }
}