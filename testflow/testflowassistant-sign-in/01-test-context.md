Persona: QA Engineer, Industry: SaaS

# TestFlowAssistant — QA Domain Knowledge: Sign-In Suite

## 1. Testing Areas to Prioritise
- **Valid credential login** — correct email/password reaches the authenticated dashboard.
- **Invalid password handling** — correct email, wrong password, correct error shown, no session created.
- **Unknown email handling** — email not in system behaves identically to wrong password (no user enumeration).
- **Empty-form validation** — submitting with blank fields blocks navigation and surfaces inline/field errors.
- **Post-login state verification** — presence of `new-session-btn` (data-testid) confirms authenticated dashboard render, not just URL change.
- **Session/redirect behavior** — failed attempts keep user on `/login`; no partial redirects or flash of dashboard content.
- **Input field behavior** — trimming whitespace, case sensitivity of email, password masking.
- **Credential handling in test code** — env vars only, never hardcoded or logged in plaintext.

## 2. Domain Terminology
- **Sign-in (Auth) Flow** — process of validating user identity via email/password.
- **Session** — authenticated state established after successful login.
- **data-testid** — stable HTML attribute used for reliable test element targeting, independent of visual styling.
- **User Enumeration** — security flaw where differing error messages reveal whether an email exists.
- **Field-level Validation** — client-side checks (e.g., required field) before form submission.
- **Server-side Validation** — backend checks producing errors like "Invalid email or password."
- **Happy Path** — the primary valid, expected flow (successful login).
- **Negative Test Case** — test verifying correct rejection of invalid input.
- **Idempotent Login Attempt** — repeated invalid attempts should consistently fail the same way.
- **Environment Variable (env var)** — external config value (APP_URL, TEST_USER, TEST_PASSWORD) injected at runtime, not hardcoded.
- **Locator** — mechanism (label, role, testid) used by automation to find page elements.
- **Assertion** — automated check confirming expected vs actual state (e.g., button visibility).
- **Redirect Guard** — logic preventing unauthenticated users from reaching protected routes.

## 3. Common Defect Patterns
- Error message inconsistency between wrong-password and unknown-email cases (enumeration leak).
- Dashboard elements (e.g., `new-session-btn`) rendering before auth confirmation (race condition).
- Empty-form submission triggering a server round-trip instead of client-side block.
- Error text persisting or duplicating after a second failed attempt (state not reset).
- Password field failing to mask input or trimming/casing mismatches on email field causing false negatives.

## 4. Compliance/Regulatory Considerations
- No PII or payment data in scope for this suite, but treat `TEST_USER`/`TEST_PASSWORD` as sensitive: never log, print, or commit them.
- Ensure error messages don't leak account existence (ties to general security best practice, not full OWASP audit).
- Confirm password field masks input (basic security hygiene expectation for SaaS auth).

## 5. Per-Stage Testing Focus

**Brainstorm**
- Enumerate all sign-in outcomes: valid, wrong password, unknown email, empty fields, whitespace-only input.
- Consider edge cases: rapid repeated submits, browser back after login, autofill behavior.

**Scenarios**
- One scenario per outcome category above; keep scope strictly to `/login` and immediate post-login state.
- No scenarios for registration/password-reset (out of scope — no public sign-up).

**Cases**
- Define exact input data (valid vs invalid combos) using env-sourced credentials for valid case only.
- Specify expected UI state: error text exact match ("Invalid email or password."), URL stays `/login`, or `new-session-btn` visible.

**Automate**
- Use label-based locators ("Email", "Password") and role-based button ("Sign in") per real selectors.
- Assert dashboard via `data-testid=new-session-btn`, not URL alone.
- Pull credentials via `process.env.TEST_USER` / `process.env.TEST_PASSWORD`; fail fast if unset.
- Isolate each test (fresh browser context) to avoid session leakage between cases.