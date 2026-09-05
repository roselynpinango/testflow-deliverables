import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the checkout payment step.
 *
 * NOTE: No recorded baseline was supplied for this pass. The data-testid values
 * below are assumed per project convention and must be confirmed/corrected against
 * the real application markup before this suite is trusted in CI.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly cartTotal: Locator;
  readonly cartTotalAfterDiscount: Locator;
  readonly cartTotalAfterDiscountAndStockAdjustment: Locator;
  readonly promoCodeInput: Locator;
  readonly applyPromoButton: Locator;
  readonly promoMessage: Locator;
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvvInput: Locator;
  readonly submitPaymentButton: Locator;
  readonly orderConfirmationAmount: Locator;
  readonly orderStatus: Locator;
  readonly paymentErrorMessage: Locator;
  readonly cardNumberDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartTotal = page.getByTestId('cart-total');
    this.cartTotalAfterDiscount = page.getByTestId('cart-total-after-discount');
    this.cartTotalAfterDiscountAndStockAdjustment = page.getByTestId(
      'cart-total-after-discount-and-stock-adjustment'
    );
    this.promoCodeInput = page.getByTestId('promo-code-input');
    this.applyPromoButton = page.getByTestId('apply-promo-button');
    this.promoMessage = page.getByTestId('promo-message');
    this.cardNumberInput = page.getByTestId('card-number-input');
    this.cardExpiryInput = page.getByTestId('card-expiry-input');
    this.cardCvvInput = page.getByTestId('card-cvv-input');
    this.submitPaymentButton = page.getByTestId('submit-payment-button');
    this.orderConfirmationAmount = page.getByTestId('order-confirmation-amount');
    this.orderStatus = page.getByTestId('order-status');
    this.paymentErrorMessage = page.getByTestId('payment-error-message');
    this.cardNumberDisplay = page.getByTestId('card-number-display');
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.applyPromoButton.click();
  }

  async enterCardDetails(number: string, expiry: string, cvv: string): Promise<void> {
    await this.cardNumberInput.fill(number);
    await this.cardExpiryInput.fill(expiry);
    await this.cardCvvInput.fill(cvv);
  }

  async submitPayment(): Promise<void> {
    await this.submitPaymentButton.click();
  }

  async readAmount(locator: Locator): Promise<number> {
    const text = await locator.textContent();
    return parseFloat((text ?? '').replace(/[^0-9.]/g, ''));
  }
}