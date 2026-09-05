# Test Report

---

## Executive Summary

| Pass Rate | Bugs Found | Risk Status |
|-----------|-----------|-------------|
| 60% (3/5) | 1 (0 confirmed critical, severity unclassified — pending triage) | 🔴 Red |

Three of five sign-in scenarios passed (valid credentials, wrong-password, unregistered-email — all authentication and no-enumeration checks green). Two scenarios failed with an identical error signature, both tied to client-side required-field validation on empty and whitespace-only input, treated per defect clustering as a single suspected defect. The stated exit criterion for Test Cycle 2 ("no open failures against `sign-in.spec.ts`") is **not met** with two open failures. No Test Plan artifact was supplied this session, so beyond the one exit criterion evidenced in the Run Artifact, DoD targets (e.g., a pass-rate threshold) are unknown rather than assumed.

---

## Execution by Area

| Area | Executed | Passed | Failed | Skipped | Notes |
|------|----------|--------|--------|---------|-------|
| Authentication (valid credentials, wrong password, unregistered email) | 3 | 3 | 0 | 0 | TC-001–TC-003 all passed; no-enumeration behavior (security) confirmed identical between wrong-password and unregistered-email branches. |
| Input validation (empty form, whitespace-only) | 2 | 0 | 2 | 0 | TC-004 and TC-005 failed with the same `aria-invalid` timeout signature — treated as one incident per defect clustering, per Run Artifact root cause analysis. |

---

## Defect Summary

| ID | Severity | Title | Area | Status | Ticket |
|----|----------|-------|------|--------|--------|
| Not yet assigned | Unclassified — TBD (pending developer triage per Run Artifact) | Email field not marked invalid (`aria-invalid` never set) on empty/whitespace-only submission | Input validation — functional suitability / interaction capability | Open | Not raised yet (Run Artifact recommends a single incident report covering TC-004 and TC-005) |

### Severity Distribution

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Unclassified / TBD | 1 |
| **Total** | **1** |

Severity was not assigned in the Run Artifact's findings; classification requires developer triage as recommended there. Reporting "0 critical" reflects only what was confirmed, not an assumption of low impact.

---

## Quality Gate Verdict

No Test Plan artifact was supplied this session, so the DoD criteria below are limited to what is directly evidenced in the Run Artifact. Additional criteria referenced in the report template (e.g., a numeric pass-rate target) were never specified and are marked **unknown** rather than fabricated or assumed met/not met.

| DoD Criterion | Target | Actual | Verdict |
|---------------|--------|--------|---------|
| Exit criteria: no open failures against `sign-in.spec.ts` (Run Artifact, Test Cycle 2) | 0 open failures | 2 open failures (TC-004, TC-005) | Not met |
| Pass rate threshold | Not specified — no Test Plan artifact supplied this session | 60% (3/5) | Not met — no numeric target exists to compare against; reported as Not met per the rule that an unmeasured/undefined criterion cannot be counted as satisfied |
| Open Critical/P1 defects | 0 | 0 confirmed critical (1 unclassified defect pending triage) | Not met — severity is unresolved, so a Critical count of 0 cannot be confirmed as final |

**Overall: FAIL**

---

## Risks for Next Sprint

| Risk | Untested Area | Reason Skipped |
|------|--------------|----------------|
| Client-side required-field validation may be broken beyond the two observed cases (e.g., partially-filled forms, single-field-empty submissions) | Partial-empty-form input validation | Not in current scope (Cases artifact covers only fully-empty and fully-whitespace input); the TC-004/TC-005 defect suggests broader validation-logic risk not yet probed. |
| Locator uncertainty in automation: `expectFieldMarkedInvalid` uses an `aria-invalid` fallback because no real inline-error selector was confirmed by the tester | Inline validation selector confirmation | Flagged as TBD in the Automate artifact — tester has not yet supplied or confirmed the actual selector, so the TC-004/TC-005 failures may partly reflect a locator mismatch rather than a pure application defect. |
| Password masking is named as a domain expectation (basic security hygiene) but has no corresponding test case or automated assertion | Password field masking | Not included in the Cases/Scenarios artifacts for this cycle; out of the stated scope for this run. |
| Brute-force/lockout, session-expiry, and role/authorization-boundary behavior are unverified | Account lockout, session expiry, role boundaries | Explicitly flagged as **TBD** open scope questions in the Cases artifact — no scenario or case exists for these; requires a tester decision on whether they belong in a future stage. |

---

## AI Usage Summary

| Stage | Input Tokens | Output Tokens | Cache Hits | Cost (USD) |
|-------|-------------|---------------|------------|-----------|
| test-context | 561 | 1,480 | 0 | $0.0239 |
| scenarios | 326 | 3,753 | 0 | $0.0573 |
| cases | 1,268 | 2,816 | 0 | $0.0460 |
| automate | 3,235 | 10,046 | 0 | $0.1604 |
| report | Not measured (figures for this generation not yet available) | — | — | — |
| **Total (measured stages only)** | **5,390** | **18,095** | **0** | **$0.2876** |

---

_Generated by TestFlowAssistant — Stage: Report. This report is a draft for tester review; it is not an approval or release sign-off, which remains a human decision._