import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the checkout payment step.
 * All selectors use data-testid per project convention. These are draft
 * selectors pending confirmation against the live application markup —
 * no baseline recording was supplied for this artifact.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly promoCodeInput: Locator;
  readonly promoCodeSubmitButton: Locator;
  readonly promoErrorMessage: Locator;
  readonly cardNumberInput: Locator;
  readonly cardCvvInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly payButton: Locator;
  readonly retryPaymentButton: Locator;
  readonly checkoutErrorMessage: Locator;
  readonly orderStatus: Locator;
  readonly orderId: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.promoCodeSubmitButton = page.getByTestId('promo-code-submit');
    this.promoErrorMessage = page.getByTestId('promo-error-message');
    this.cardNumberInput = page.getByTestId('card-number-input');
    this.cardCvvInput = page.getByTestId('card-cvv-input');
    this.cardExpiryInput = page.getByTestId('card-expiry-input');
    this.payButton = page.getByTestId('pay-button');
    this.retryPaymentButton = page.getByTestId('retry-payment-button');
    this.checkoutErrorMessage = page.getByTestId('checkout-error-message');
    this.orderStatus = page.getByTestId('order-status');
    this.orderId = page.getByTestId('order-id');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.promoCodeSubmitButton.click();
  }

  async fillCard(card: { number: string; cvv: string; expiry: string }): Promise<void> {
    await this.cardNumberInput.fill(card.number);
    await this.cardCvvInput.fill(card.cvv);
    await this.cardExpiryInput.fill(card.expiry);
  }

  async submitPayment(): Promise<void> {
    await this.payButton.click();
  }

  async retryPayment(): Promise<void> {
    await this.retryPaymentButton.click();
  }

  async getOrderId(): Promise<string> {
    await expect(this.orderId, 'Order ID element did not render after checkout submission').toBeVisible();
    return (await this.orderId.textContent())?.trim() ?? '';
  }
}