import { Page, Locator } from '@playwright/test';
import { CardFixture } from '../fixtures/test-data';

/**
 * Page Object Model for the checkout page. All selectors use data-testid
 * per the project's selector standard — no brittle CSS selectors.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cvvInput: Locator;
  readonly submitPaymentButton: Locator;
  readonly cvvValidationError: Locator;
  readonly promoCodeInput: Locator;
  readonly promoApplyButton: Locator;
  readonly promoError: Locator;
  readonly cartTotal: Locator;
  readonly outOfStockError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cardNumberInput = page.getByTestId('checkout-card-number');
    this.cardExpiryInput = page.getByTestId('checkout-card-expiry');
    this.cvvInput = page.getByTestId('checkout-cvv');
    this.submitPaymentButton = page.getByTestId('checkout-submit-payment');
    this.cvvValidationError = page.getByTestId('checkout-cvv-error');
    this.promoCodeInput = page.getByTestId('checkout-promo-code');
    this.promoApplyButton = page.getByTestId('checkout-promo-apply');
    this.promoError = page.getByTestId('checkout-promo-error');
    this.cartTotal = page.getByTestId('checkout-cart-total');
    this.outOfStockError = page.getByTestId('checkout-out-of-stock-error');
  }

  async goto(): Promise<void> {
    const checkoutUrl = process.env.CHECKOUT_URL;
    if (!checkoutUrl) {
      throw new Error(
        'CHECKOUT_URL env var is not set — checkout base URL is not specified in the test basis (TBD).'
      );
    }
    await this.page.goto(checkoutUrl);
  }

  async fillCard(card: CardFixture): Promise<void> {
    await this.cardNumberInput.fill(card.cardNumber);
    await this.cardExpiryInput.fill(card.expiry);
    await this.cvvInput.fill(card.cvv);
  }

  /** Moves focus away from the CVV field by tabbing to the next field. */
  async blurCvv(): Promise<void> {
    await this.cvvInput.press('Tab');
  }

  async submitPayment(): Promise<void> {
    await this.submitPaymentButton.click();
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.promoApplyButton.click();
  }
}