/**
 * Loads and validates the environment variables required for the sign-in
 * suite. Fails fast (throws) if any are unset — per domain constraint:
 * credentials must come from env vars only, never hardcoded.
 *
 * Test basis: Tester Context (APP_URL, TEST_USER, TEST_PASSWORD notes).
 */
export interface AuthEnv {
  appUrl: string;
  testUser: string;
  testPassword: string;
}

export function getAuthEnv(): AuthEnv {
  const appUrl = process.env.APP_URL;
  const testUser = process.env.TEST_USER;
  const testPassword = process.env.TEST_PASSWORD;

  const missing: string[] = [];
  if (!appUrl) missing.push('APP_URL');
  if (!testUser) missing.push('TEST_USER');
  if (!testPassword) missing.push('TEST_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Set APP_URL, TEST_USER and TEST_PASSWORD before running the sign-in suite.'
    );
  }

  return {
    appUrl: appUrl as string,
    testUser: testUser as string,
    testPassword: testPassword as string,
  };
}