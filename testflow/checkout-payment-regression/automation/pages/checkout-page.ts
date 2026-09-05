import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly cartTotal: Locator;
  readonly submitPaymentButton: Locator;
  readonly promoCodeInput: Locator;
  readonly promoSubmitButton: Locator;
  readonly orderStatus: Locator;
  readonly errorMessage: Locator;
  readonly cardNumberDisplay: Locator;
  readonly promoError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartTotal = page.getByTestId('cart-total');
    this.submitPaymentButton = page.getByTestId('submit-payment-button');
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.promoSubmitButton = page.getByTestId('promo-submit-button');
    this.orderStatus = page.getByTestId('order-status');
    this.errorMessage = page.getByTestId('payment-error-message');
    this.cardNumberDisplay = page.getByTestId('card-number-display');
    this.promoError = page.getByTestId('promo-error-message');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async submitPayment() {
    await this.submitPaymentButton.click();
  }

  async applyPromoCode(code: string) {
    await this.promoCodeInput.fill(code);
    await this.promoSubmitButton.click();
  }
}