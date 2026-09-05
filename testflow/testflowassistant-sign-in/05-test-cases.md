# Test Cases

**Test basis:** Approved Scenarios Artifact (Sign-in feature) — TestFlowAssistant sign-in suite
**Scope:** `/login` only — valid sign-in, invalid password, unknown email, empty-form validation, whitespace-only input
**Risk tags:** All source scenarios carry `@risk-medium` (fallback rule — no risk register supplied this session). Risk column below reflects that tag, not the `@critical`/`@smoke` labels also present on TC-001's source scenario, per the stated inheritance rule.

---

| ID | Area | Title | Preconditions | Steps | Expected Result | Risk | Type | Status |
|----|------|-------|---------------|-------|----------------|------|------|--------|
| TC-001 | Authentication — functional suitability | Successful sign-in with valid credentials | User is on `/login`; not currently signed in; `TEST_USER` and `TEST_PASSWORD` env vars are set to a valid, registered account's credentials | 1. Enter the value of `process.env.TEST_USER` into the "Email" field 2. Enter the value of `process.env.TEST_PASSWORD` into the "Password" field 3. Click the "Sign in" button | Dashboard renders; an element with `data-testid="new-session-btn"` is visible within the page; URL is no longer `/login` | Medium | Functional / E2E | Pending |
| TC-002 | Authentication — security (no enumeration) | Sign-in rejected for registered email with incorrect password | User is on `/login`; not currently signed in; `TEST_USER` env var holds a valid registered email; a password value known to differ from `TEST_PASSWORD` is available | 1. Enter the value of `process.env.TEST_USER` into the "Email" field 2. Enter an incorrect password (not equal to `process.env.TEST_PASSWORD`) into the "Password" field 3. Click the "Sign in" button | Page displays the exact text "Invalid email or password."; URL remains `/login`; no `data-testid="new-session-btn"` element is present in the DOM | Medium | Negative | Pending |
| TC-003 | Authentication — security (no enumeration) | Sign-in rejected for email not registered in the system | User is on `/login`; not currently signed in; an email address known not to correspond to any account is available (value not fixed — select/generate at execution time; not a hardcoded fabricated address) | 1. Enter the unregistered email into the "Email" field 2. Enter any password value into the "Password" field 3. Click the "Sign in" button | Page displays the exact text "Invalid email or password." — identical wording and presentation to TC-002 (no user-enumeration difference); URL remains `/login`; no `data-testid="new-session-btn"` element is present | Medium | Negative | Pending |
| TC-004 | Input validation — functional suitability | Empty-form submission is blocked client-side | User is on `/login`; not currently signed in; both "Email" and "Password" fields are empty | 1. Leave the "Email" field empty 2. Leave the "Password" field empty 3. Click the "Sign in" button | Inline validation errors are displayed against the "Email" and "Password" fields; URL remains `/login`; no network round-trip to the sign-in endpoint occurs (no server-side "Invalid email or password." text appears) | Medium | Negative / Boundary | Pending |
| TC-005 | Input validation — functional suitability | Whitespace-only input is treated as empty | User is on `/login`; not currently signed in | 1. Enter a whitespace-only string (e.g., one or more space characters) into the "Email" field 2. Enter a whitespace-only string into the "Password" field 3. Click the "Sign in" button | Inline validation errors are displayed against the "Email" and "Password" fields, identical in behavior to TC-004; URL remains `/login`; no `data-testid="new-session-btn"` element is present | Medium | Boundary | Pending |

> **Risk key:** Critical / High / Medium / Low — inherited from each scenario's `@risk-…` tag. All five cases above inherit **Medium** per the current fallback; re-tag once a risk register (Test Plan artifact with R-xx rows) is supplied.

---

**Coverage notes for review:**
- Negative coverage present for every functional area in scope (authentication: TC-002, TC-003; input validation: TC-004, TC-005) — satisfies the "≥1 negative case per functional area" requirement.
- TC-002 and TC-003 together are the security check for user enumeration (ISO/IEC 25010 security characteristic) — expected results explicitly require identical error text/behavior across both.
- No PII/token exposure, session-expiry, concurrent-session, or authorization/role-boundary cases are included — these are out of the stated scope (sign-in page only, single-session happy/negative paths, no roles or tokens described in the test basis). Flagging as an open scope question rather than fabricating coverage: **TBD** whether brute-force/lockout, session-expiry, or role-boundary testing belongs in a later stage/artifact.
- Credential values for TC-001/TC-002 are sourced only from `process.env.TEST_USER` / `process.env.TEST_PASSWORD` at execution time — never hardcoded or logged, per the domain constraint.
- TC-003's unregistered-email value and TC-002's incorrect-password value are intentionally left unspecified (not fabricated) — execution-time selection is required; mark as **TBD** in test data setup if no convention exists yet.

This is a draft for your review; no case here is approved or executed until you confirm it.