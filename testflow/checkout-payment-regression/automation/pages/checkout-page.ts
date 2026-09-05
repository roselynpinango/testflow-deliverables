import { Page } from '@playwright/test';
import { CardDetails } from '../fixtures/test-data';

/**
 * Page Object for the checkout payment page.
 * Selectors use data-testid only, per suite convention.
 * NOTE: no Recorded Baseline was provided for this session — these
 * data-testid names are placeholders and must be confirmed/aligned with the
 * actual application markup before first run.
 */
export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/checkout');
  }

  async selectCardPaymentMethod() {
    await this.page.getByTestId('payment-method-card').click();
  }

  async fillCardDetails(card: CardDetails) {
    await this.page.getByTestId('card-number-input').fill(card.number);
    await this.page.getByTestId('card-expiry-input').fill(card.expiry);
    await this.page.getByTestId('card-cvv-input').fill(card.cvv);
  }

  async submitPayment() {
    await this.page.getByTestId('submit-payment-button').click();
  }

  async getOrderStatusText(): Promise<string> {
    const status = this.page.getByTestId('order-status');
    await status.waitFor({ state: 'visible' });
    return (await status.textContent())?.trim() ?? '';
  }

  async getRetryButtonVisible(): Promise<boolean> {
    return this.page.getByTestId('retry-payment-button').isVisible();
  }

  async getValidationMessageText(): Promise<string> {
    const message = this.page.getByTestId('payment-validation-message');
    await message.waitFor({ state: 'visible' });
    return (await message.textContent())?.trim() ?? '';
  }

  async getDisplayedCardNumber(): Promise<string> {
    const el = this.page.getByTestId('saved-card-display');
    return (await el.textContent())?.trim() ?? '';
  }

  async getCaptureCountText(): Promise<string> {
    const el = this.page.getByTestId('capture-count');
    return (await el.textContent())?.trim() ?? '';
  }

  async getDebitedAmountText(): Promise<string> {
    const el = this.page.getByTestId('debited-amount');
    return (await el.textContent())?.trim() ?? '';
  }

  async applyPromoCode(code: string) {
    await this.page.getByTestId('promo-code-input').fill(code);
    await this.page.getByTestId('apply-promo-button').click();
  }

  async getCartTotalText(): Promise<string> {
    const el = this.page.getByTestId('cart-total');
    return (await el.textContent())?.trim() ?? '';
  }

  async getPromoResultMessage(): Promise<string> {
    const el = this.page.getByTestId('promo-result-message');
    await el.waitFor({ state: 'visible' });
    return (await el.textContent())?.trim() ?? '';
  }
}