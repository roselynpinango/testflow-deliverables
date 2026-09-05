import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin client over the checkout/payment sandbox API.
 *
 * ASSUMPTION (flagged, not fabricated as fact): the `/test-support/...` endpoints below
 * represent an assumed sandbox test-orchestration contract (stock manipulation, gateway
 * callback simulation, log inspection) needed to exercise race conditions and callback
 * lifecycles deterministically. Confirm the actual contract with the API/backend team
 * before running this suite against a real sandbox — paths and payload shapes are TBD
 * until then.
 *
 * All requests are relative; the base URL comes from the Playwright config the
 * application already owns (no URL is hardcoded here).
 */
export class CheckoutApiClient {
  constructor(private readonly request: APIRequestContext) {}

  // --- Amount integrity / recalculation support ---

  async triggerStockAdjustment(itemId: string): Promise<APIResponse> {
    return this.request.post('/test-support/stock/adjust', { data: { itemId } });
  }

  async markItemUnavailable(itemId: string): Promise<APIResponse> {
    return this.request.post('/test-support/stock/mark-unavailable', { data: { itemId } });
  }

  async getPaymentStatus(orderId: string): Promise<{ status: string; amountInCents?: number; capturedAmountInCents?: number }> {
    const res = await this.request.get(`/test-support/orders/${orderId}/payment-status`);
    return res.json();
  }

  // --- Stock/authorization race condition support (TC-002) ---

  async initiatePaymentAuthorization(itemId: string): Promise<{ orderId: string }> {
    const res = await this.request.post('/test-support/orders/initiate-authorization', { data: { itemId } });
    return res.json();
  }

  async depleteStock(itemId: string): Promise<APIResponse> {
    return this.request.post('/test-support/stock/deplete', { data: { itemId } });
  }

  async getOrderStatus(orderId: string): Promise<{ status: string; stockHoldReleased?: boolean; paymentAuthorizationId?: string }> {
    const res = await this.request.get(`/orders/${orderId}`);
    return res.json();
  }

  // --- Gateway callback lifecycle support (TC-003/004/005) ---

  async createOrderAwaitingCallback(): Promise<{ orderId: string }> {
    const res = await this.request.post('/test-support/orders/awaiting-callback');
    return res.json();
  }

  async sendGatewayCallback(orderId: string, status: 'success' | 'failure' | 'timeout'): Promise<APIResponse> {
    return this.request.post('/test-support/gateway-callback', { data: { orderId, status } });
  }

  // --- Security support (TC-006/007) ---

  async submitDeclinedCardPayment(input: { cardNumber: string; cvv: string }): Promise<APIResponse> {
    return this.request.post('/payments', {
      data: { cardNumber: input.cardNumber, cvv: input.cvv },
    });
  }

  async getTransactionLog(transactionId: string): Promise<unknown> {
    const res = await this.request.get(`/test-support/logs/${transactionId}`);
    return res.json();
  }

  async submitPaymentWithToken(orderId: string, sessionToken: string): Promise<APIResponse> {
    return this.request.post('/payments', {
      headers: { Authorization: `Bearer ${sessionToken}` },
      data: { orderId },
    });
  }
}