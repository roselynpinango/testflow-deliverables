import { Page } from '@playwright/test';

/**
 * Captures the amount transmitted to the payment gateway by observing the
 * outbound network request triggered by a checkout action.
 *
 * TBD: the exact payment-gateway request path was not provided in the Test
 * Basis. Update GATEWAY_REQUEST_PATTERN once the real API route is confirmed.
 */
const GATEWAY_REQUEST_PATTERN = /\/api\/payment\/(charge|authorize)/;

export async function captureGatewayChargeAmount(
  page: Page,
  triggerAction: () => Promise<void>
): Promise<number> {
  const requestPromise = page.waitForRequest(
    (request) => GATEWAY_REQUEST_PATTERN.test(request.url()) && request.method() === 'POST'
  );
  await triggerAction();
  const request = await requestPromise;
  const body = request.postDataJSON();
  return body.amount;
}