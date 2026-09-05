import { randomUUID } from 'crypto';

/**
 * TC-003: an email guaranteed not to correspond to any registered account.
 * Generated per-run rather than hardcoded, so no fabricated fixed value is
 * ever committed (per "no hardcoded ... test data" requirement).
 */
export function generateUnregisteredEmail(): string {
  return `no-such-user-${randomUUID()}@example.invalid`;
}

/**
 * TC-002 / TC-003: a password value guaranteed to differ from the real
 * TEST_PASSWORD, generated at run time rather than hardcoded or logged.
 */
export function generateMismatchedPassword(realPassword: string): string {
  const candidate = `wrong-${randomUUID()}`;
  return candidate === realPassword ? `${candidate}-x` : candidate;
}

/** TC-005 boundary value: whitespace-only input, treated as empty. */
export const WHITESPACE_ONLY = '   ';