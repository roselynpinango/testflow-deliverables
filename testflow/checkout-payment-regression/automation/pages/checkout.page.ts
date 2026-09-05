import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the checkout page (card payment method).
 * Selectors use data-testid only, per suite selector policy.
 * Selector names are assumed (no Recorded Baseline was supplied for this session) —
 * verify against the real DOM before first execution and update here only.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly promoCodeInput: Locator;
  readonly promoCodeSubmitButton: Locator;
  readonly promoCodeError: Locator;
  readonly cartTotal: Locator;
  readonly cardNumberInput: Locator;
  readonly cvvInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly paymentSubmitButton: Locator;
  readonly orderConfirmationTotal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.promoCodeSubmitButton = page.getByTestId('promo-code-submit');
    this.promoCodeError = page.getByTestId('promo-code-error');
    this.cartTotal = page.getByTestId('cart-total');
    this.cardNumberInput = page.getByTestId('card-number-input');
    this.cvvInput = page.getByTestId('cvv-input');
    this.cardExpiryInput = page.getByTestId('card-expiry-input');
    this.paymentSubmitButton = page.getByTestId('payment-submit-button');
    this.orderConfirmationTotal = page.getByTestId('order-confirmation-total');
  }

  /** Navigates to checkout for a given order id. Path is assumed — confirm real routing. */
  async goto(orderId: string) {
    await this.page.goto(`/checkout?orderId=${orderId}`);
  }

  async applyPromoCode(code: string) {
    await this.promoCodeInput.fill(code);
    await this.promoCodeSubmitButton.click();
  }

  async fillCardDetails(cardNumber: string, cvv: string, expiry: string) {
    await this.cardNumberInput.fill(cardNumber);
    await this.cvvInput.fill(cvv);
    await this.cardExpiryInput.fill(expiry);
  }

  async submitPayment() {
    await this.paymentSubmitButton.click();
  }
}