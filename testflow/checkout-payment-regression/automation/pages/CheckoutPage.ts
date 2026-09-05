import { Page } from '@playwright/test';

/**
 * Page Object for the checkout page. Selectors use data-testid only.
 * NOTE: no Recorded Baseline was supplied for this stage, so the data-testid names
 * below are the automation's own interface into the checkout UI — they must be
 * reconciled with real selectors the first time this suite runs against the app.
 */
export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async gotoCheckout(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async reloadCart(): Promise<void> {
    await this.page.reload();
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.page.getByTestId('promo-code-input').fill(code);
    await this.page.getByTestId('apply-promo-button').click();
  }

  async getDisplayedTotalCents(): Promise<number> {
    const text = await this.page.getByTestId('cart-total').textContent();
    if (!text) {
      throw new Error('Cart total element (data-testid="cart-total") returned no text content');
    }
    return parseAmountToCents(text);
  }

  async submitPayment(): Promise<void> {
    await this.page.getByTestId('submit-payment-button').click();
  }

  async getOrderId(): Promise<string> {
    const text = await this.page.getByTestId('order-id').textContent();
    if (!text) {
      throw new Error('Order id element (data-testid="order-id") returned no text content after payment submission');
    }
    return text.trim();
  }
}

function parseAmountToCents(displayed: string): number {
  const numeric = displayed.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(numeric) * 100);
}