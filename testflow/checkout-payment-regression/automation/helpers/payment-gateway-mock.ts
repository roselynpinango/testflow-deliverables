import { Page, Route } from '@playwright/test';

export type GatewayOutcome = 'approved' | 'declined' | 'timeout';

/**
 * Intercepts the payment gateway authorization call and fulfils it with a
 * sandbox-safe mocked response, so no live gateway or real card data is ever
 * exercised by this suite.
 */
export async function mockGatewayAuthorization(
  page: Page,
  routePattern: string,
  outcome: GatewayOutcome,
  amount: number
) {
  await page.route(routePattern, async (route: Route) => {
    if (outcome === 'timeout') {
      await route.abort('timedout');
      return;
    }
    await route.fulfill({
      status: outcome === 'approved' ? 200 : 402,
      contentType: 'application/json',
      body: JSON.stringify({
        outcome,
        authorizedAmount: outcome === 'approved' ? amount : null,
      }),
    });
  });
}