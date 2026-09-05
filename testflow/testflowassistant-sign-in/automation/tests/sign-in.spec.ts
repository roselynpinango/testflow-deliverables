import { test, expect } from '../fixtures/base';
import {
  generateUnregisteredEmail,
  generateMismatchedPassword,
  WHITESPACE_ONLY,
} from '../fixtures/test-data';

test.describe('Sign-in', () => {
  // TC-001 — critical / smoke — functional suitability (happy path)
  test('TC-001 @smoke @critical valid credentials reach the authenticated dashboard', async ({
    loginPage,
    authEnv,
  }) => {
    await loginPage.submit(authEnv.testUser, authEnv.testPassword);
    await loginPage.expectDashboardVisible();
    await expect(
      loginPage.page,
      'Expected the URL to move away from /login after a successful sign-in'
    ).not.toHaveURL(/\/login$/);
  });

  // TC-002 — security — no user enumeration (wrong password branch)
  test('TC-002 @security registered email with an incorrect password is rejected without enumeration', async ({
    loginPage,
    authEnv,
  }) => {
    const wrongPassword = generateMismatchedPassword(authEnv.testPassword);
    await loginPage.submit(authEnv.testUser, wrongPassword);
    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectStillOnLogin();
    await loginPage.expectNoDashboardMarker();
  });

  // TC-003 — security — no user enumeration (unknown email branch)
  test('TC-003 @security unregistered email is rejected identically to a wrong password', async ({
    loginPage,
    authEnv,
  }) => {
    const unregisteredEmail = generateUnregisteredEmail();
    const anyPassword = generateMismatchedPassword(authEnv.testPassword);
    await loginPage.submit(unregisteredEmail, anyPassword);
    await loginPage.expectInvalidCredentialsError();
    await loginPage.expectStillOnLogin();
    await loginPage.expectNoDashboardMarker();
  });

  // TC-004 — negative / boundary — client-side required-field validation
  test('TC-004 empty-form submission is blocked client-side', async ({ loginPage }) => {
    await loginPage.signInButton.click();
    await loginPage.expectStillOnLogin();
    await loginPage.expectNoServerError();
    await loginPage.expectFieldMarkedInvalid(loginPage.emailField, 'Email');
    await loginPage.expectFieldMarkedInvalid(loginPage.passwordField, 'Password');
  });

  // TC-005 — boundary — whitespace-only treated as empty
  test('TC-005 whitespace-only input is treated as empty', async ({ loginPage }) => {
    await loginPage.submit(WHITESPACE_ONLY, WHITESPACE_ONLY);
    await loginPage.expectStillOnLogin();
    await loginPage.expectNoDashboardMarker();
    await loginPage.expectFieldMarkedInvalid(loginPage.emailField, 'Email');
    await loginPage.expectFieldMarkedInvalid(loginPage.passwordField, 'Password');
  });
});