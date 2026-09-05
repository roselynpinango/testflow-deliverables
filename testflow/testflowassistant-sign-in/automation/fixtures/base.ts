import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { getAuthEnv, AuthEnv } from './auth-env';

interface Fixtures {
  authEnv: AuthEnv;
  loginPage: LoginPage;
}

/**
 * Shared setup for every sign-in test: resolve env-sourced config and land
 * on a fresh /login page. Playwright gives each test its own browser
 * context by default, so no session state leaks between tests.
 */
export const test = base.extend<Fixtures>({
  authEnv: async ({}, use) => {
    await use(getAuthEnv());
  },

  loginPage: async ({ page, authEnv }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(authEnv.appUrl);
    await use(loginPage);
  },
});

export { expect };