import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the TestFlowAssistant sign-in page.
 * Locators use label text / ARIA role / data-testid only, per Tester
 * Context "Real selectors" and the no-brittle-CSS-selector requirement.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly dashboardMarker: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.getByLabel('Email');
    this.passwordField = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByText('Invalid email or password.', { exact: true });
    this.dashboardMarker = page.getByTestId('new-session-btn');
  }

  async goto(appUrl: string): Promise<void> {
    await this.page.goto(`${appUrl}/login`);
  }

  async submit(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.signInButton.click();
  }

  async expectDashboardVisible(): Promise<void> {
    await expect(
      this.dashboardMarker,
      'Expected the authenticated dashboard control (data-testid="new-session-btn") to be visible after a valid sign-in'
    ).toBeVisible();
  }

  async expectStillOnLogin(): Promise<void> {
    await expect(
      this.page,
      'Expected to remain on /login after a failed or blocked sign-in attempt'
    ).toHaveURL(/\/login/);
  }

  async expectInvalidCredentialsError(): Promise<void> {
    await expect(
      this.errorMessage,
      'Expected the exact server-side error text "Invalid email or password." to be displayed'
    ).toBeVisible();
  }

  async expectNoDashboardMarker(): Promise<void> {
    await expect(
      this.dashboardMarker,
      'Did not expect the dashboard control (data-testid="new-session-btn") to be present after a failed sign-in'
    ).toHaveCount(0);
  }

  async expectNoServerError(): Promise<void> {
    await expect(
      this.errorMessage,
      'Expected NO server-side "Invalid email or password." text for an empty/whitespace submission — validation must be blocked client-side, not round-tripped to the server'
    ).toHaveCount(0);
  }

  /**
   * TBD: no data-testid or dedicated role was supplied in the Tester Context
   * or a Recorded Baseline for inline field-validation errors. This checks
   * the ARIA `aria-invalid` attribute on the field itself as a standards
   * -compliant fallback (ARIA role/attribute, not a brittle CSS selector).
   * Confirm the real inline-error selector with the tester and update this
   * method once known — do not treat this as authoritative.
   */
  async expectFieldMarkedInvalid(field: Locator, fieldName: string): Promise<void> {
    await expect(
      field,
      `Expected the "${fieldName}" field to be marked aria-invalid="true" after submitting with it empty/whitespace-only`
    ).toHaveAttribute('aria-invalid', 'true');
  }
}