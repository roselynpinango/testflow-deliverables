/**
 * Central helper for reading required environment/config values.
 * No credentials, tokens, or test data are hardcoded anywhere in this suite —
 * everything sensitive or environment-specific must come from env vars
 * supplied by the sandbox/test environment.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in the test environment using sandbox/test values only — never real card data.`
    );
  }
  return value;
}