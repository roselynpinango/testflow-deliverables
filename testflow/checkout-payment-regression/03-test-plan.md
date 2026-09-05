# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | TBD — not specified in Tester Context; pending confirmation before sign-off |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Order confirmed despite payment authorization/capture failure (gateway vs. order-system state mismatch) | Reliability | 4 | 5 | Add integration test scenario asserting order status remains "payment failed" when gateway returns a decline response, verified against the order-service API response and DB state within the same test cycle |
| R-02 | CVV/card data exposed in logs, URLs, or error responses | Security | 3 | 5 | Add negative test cases verifying CVV is masked in UI, absent from network logs, and absent from error-message payloads, executed across 3 failure scenarios (invalid CVV, timeout, decline) |
| R-03 | Duplicate debit on payment retry after gateway timeout (idempotency key not honored) | Reliability | 3 | 4 | Add regression scenario resending an identical payment request with the same idempotency key after a simulated timeout; assert a single capture is recorded and no duplicate debit occurs |
| R-04 | Stock oversold due to race condition between cart hold and payment confirmation | Functional Suitability | 3 | 3 | Add scenario depleting stock to zero via a concurrent sandbox transaction while an authorization is in-flight; assert checkout blocks or rolls back the order before capture |
| R-05 | Amount mismatch between promo-adjusted cart total, gateway authorization amount, and settlement amount | Functional Suitability | 2 | 3 | Add scenario comparing cart total, auth amount, and settlement amount for exact match across 3 promo types (percentage, flat, expired) |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation at checkout | Condition-based test case design covering valid/invalid card entry, promo apply/expire/stack, stock available/unavailable states; prioritized per risk register (R-01, R-05, R-04). Justification: test basis explicitly names these three flows, and each requires distinct test conditions per ISTQB condition-coverage principle | API test client + manual UI checks against sandbox/test bank credentials (never real card data) | — | TBD — not specified |
| Regression | Existing card-payment and promo-code regression suites, re-run against this sprint's stock-validation changes | Re-execute existing regression suite and add new assertions on stock-validation state; refresh test data with current sandbox test cards. Justification: pesticide paradox — checkout is shared/high-traffic, so existing suites must catch regressions introduced by stock-validation changes | Existing API automation suite + manual smoke on UI | — | TBD — not specified |
| Integration | Gateway callback → order-status update → inventory decrement sequencing across payment gateway, pricing service, and inventory service | Verify component-boundary sequencing and data consistency (compatibility characteristic) for R-01 and R-03 scenarios; confirm callback ordering under retry conditions. Justification: three independently owned services must interoperate correctly — a functional or regression test alone cannot verify cross-service sequencing | API test client (framework TBD — not specified) | — | TBD — not specified |

Note: Performance testing is excluded per discipline boundary; stock-check latency under promo-driven traffic remains a flagged risk only (see brainstorm), not a test type in this plan.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (card payment authorization/capture, R-01, R-03) | Yes | ≥ 95% |
| EC-2 | Identified security test scenarios executed (CVV masking, PCI non-exposure, R-02) | Yes | 100% executed |
| EC-3 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-4 | Overall coverage target (% of identified test conditions covered) | Yes | TBD — pending tester-confirmed target; blocks sign-off until set |

---

## Blockers / Dependencies

- Confirm whether promo codes can stack with other discounts (business rule not specified in test basis) — Owner: TBD, Needed by: TBD
- Confirm sandbox/test bank credentials and test card set availability for card-payment test conditions — Owner: TBD, Needed by: TBD
- Confirm expected system behavior when stock depletes after payment authorization but before capture — Owner: TBD, Needed by: TBD

---

## Not in Scope

- Load/stress/performance testing of checkout under concurrent high-volume traffic (performance efficiency flagged as a risk only; out of scope per discipline boundary)
- Unit-level validation of pricing/discount calculation logic (unit testing excluded)
- BNPL, wallet top-up, and net banking payment methods (not referenced in this test basis — TBD for future cycle)
- Refund/chargeback lifecycle testing (separate flow, not part of this checkout test basis)
- Cross-currency conversion display (not specified in test basis — TBD)

---

_Generated by TestFlowAssistant — Stage: Test Plan_
_This is a draft artifact for tester review; it is not approved or authoritative until a human tester signs off._