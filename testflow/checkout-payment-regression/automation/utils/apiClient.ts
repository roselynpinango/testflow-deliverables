import { APIRequestContext } from '@playwright/test';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} env var is not set — this base URL is not specified in the test basis (TBD). ` +
        'Configure it before running this suite.'
    );
  }
  return value;
}

/** Thin wrapper over the order-service API used for status/capture/debit assertions. */
export class OrderServiceClient {
  constructor(private readonly request: APIRequestContext) {}

  async getOrderStatus(orderId: string): Promise<{ status: string }> {
    const baseUrl = requireEnv('ORDER_SERVICE_URL');
    const response = await this.request.get(`${baseUrl}/orders/${orderId}/status`);
    return response.json();
  }

  async getCaptureCount(orderId: string): Promise<number> {
    const baseUrl = requireEnv('ORDER_SERVICE_URL');
    const response = await this.request.get(`${baseUrl}/orders/${orderId}/captures`);
    const body = await response.json();
    return body.captures?.length ?? 0;
  }

  async getDebitCount(accountId: string): Promise<number> {
    const baseUrl = requireEnv('ORDER_SERVICE_URL');
    const response = await this.request.get(`${baseUrl}/accounts/${accountId}/debits`);
    const body = await response.json();
    return body.debits?.length ?? 0;
  }
}

/** Thin wrapper over the sandbox payment gateway used for authorization/failure simulation. */
export class PaymentGatewaySandboxClient {
  constructor(private readonly request: APIRequestContext) {}

  async submitPayment(
    payload: Record<string, unknown>
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const baseUrl = requireEnv('PAYMENT_GATEWAY_SANDBOX_URL');
    const response = await this.request.post(`${baseUrl}/payments`, { data: payload });
    return { status: response.status(), body: await response.json() };
  }

  async triggerFailure(
    failureType: string
  ): Promise<{ networkLogEntry: string; errorMessagePayload: string }> {
    const baseUrl = requireEnv('PAYMENT_GATEWAY_SANDBOX_URL');
    const response = await this.request.post(`${baseUrl}/sandbox/trigger-failure`, {
      data: { failureType },
    });
    const body = await response.json();
    return {
      networkLogEntry: body.networkLogEntry ?? '',
      errorMessagePayload: JSON.stringify(body.errorMessagePayload ?? {}),
    };
  }
}

/** Thin wrapper over sandbox stock control used to simulate concurrent depletion. */
export class ProductStockClient {
  constructor(private readonly request: APIRequestContext) {}

  async setStockLevel(productId: string, level: number): Promise<void> {
    const baseUrl = requireEnv('ORDER_SERVICE_URL');
    await this.request.post(`${baseUrl}/products/${productId}/stock`, { data: { level } });
  }

  async depleteStockConcurrently(productId: string): Promise<void> {
    const baseUrl = requireEnv('ORDER_SERVICE_URL');
    await this.request.post(`${baseUrl}/products/${productId}/stock/deplete`);
  }
}