import { Page } from '@playwright/test';

/**
 * Simulates stock depleting to zero between authorization and capture by
 * intercepting the capture-stage request and returning a conflict response.
 *
 * TBD: exact capture/stock-check endpoint paths were not specified in the
 * Test Basis. Replace CAPTURE_ENDPOINT_PATTERN / STOCK_CHECK_PATTERN with the
 * real routes once confirmed.
 */
const CAPTURE_ENDPOINT_PATTERN = /\/api\/payment\/capture/;
const STOCK_CHECK_PATTERN = /\/api\/checkout\/stock-check/;

export async function simulateStockDepletionBeforeCapture(page: Page): Promise<void> {
  await page.route(CAPTURE_ENDPOINT_PATTERN, async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'stock_depleted', captured: false }),
    });
  });
}

export async function simulateStockOutMidPayment(page: Page): Promise<void> {
  await page.route(STOCK_CHECK_PATTERN, async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'out_of_stock' }),
    });
  });
}