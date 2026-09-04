# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | 90% (draft — proposed by AI assistant, pending tester confirmation; no coverage target was supplied in tester context) |

---

## Entry Criteria

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EN-1 | Approved Brainstorm artifact available as test basis | Yes | 100% of sections reviewed by tester |
| EN-2 | Sandbox/test payment gateway and test bank credentials provisioned (no real card data) | Yes | Environment accessible and confirmed in sandbox mode |
| EN-3 | Open blockers from Brainstorm (card networks, promo types, 3DS scope, stock-reservation timing) resolved or explicitly waived by tester | Yes | 0 unresolved blockers marked "must resolve before test design" |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Order confirmed despite payment authorization failure or stock unavailability (state mismatch between gateway, order system, and inventory) | Functional suitability / Compatibility | 4 | 5 | Design integration test scenarios asserting order status is only set to "confirmed" after both a successful capture callback AND a stock-reserved response; verify rollback on either failure |
| R-02 | Discounted cart total does not match actual bank-debited amount (promo calculation error) | Functional suitability | 4 | 4 | Add functional test cases comparing displayed cart total, gateway-submitted amount, and captured amount for each promo type (once promo types are confirmed) |
| R-03 | CVV/PAN or other card data exposed in logs, URLs, or error messages at checkout | Security | 3 | 5 | Add negative security test cases inspecting network responses, error pages, and application logs for masked-only card data (first6/last4 max) per PCI-DSS |
| R-04 | Duplicate debit charged on payment retry after network timeout or session drop | Reliability | 3 | 5 | Add test cases forcing timeout/retry mid-transaction and asserting idempotency-key-based deduplication prevents a second capture |
| R-05 | Promo code input field accepts injection or oversized input, affecting pricing logic | Security | 3 | 3 | Add boundary and injection-pattern test cases (SQL/script patterns, oversized strings) on the promo code field, asserting rejection with no pricing-engine side effects |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation — one test condition per state transition and business rule (per Brainstorm Top 3 Focus Areas) | Black-box test design using equivalence partitioning and boundary value analysis on cart totals, promo types, and stock levels; verify UI messaging, order-status field, and gateway callback state at each step | Manual execution + API test client (specific tool not specified — TBD) | — | Not specified |
| Regression | Existing checkout critical path (card authorization → order confirmation) re-verified after promo/stock logic changes, justified by defect-clustering principle (ISTQB) since checkout is a shared component | Maintain a critical-path regression suite covering the top defect patterns (duplicate debit, state mismatch, amount mismatch); re-run each cycle before sign-off | Manual + API test client (tool TBD) | — | Not specified |
| Integration | Payment gateway ↔ order system ↔ inventory service boundaries — webhook/callback handling and cross-service state consistency, justified by top domain defect pattern "order confirmed despite payment/stock failure" | Contract-level checks on webhook/callback payloads; assert state consistency across authorization → order confirmation → inventory decrement | API test client (tool TBD) | — | Not specified |
| Security | Card data exposure (CVV/PAN masking in UI/logs/errors), promo code input validation, session handling at payment step — mandated by regulated-industry gate (zero security scenarios fails the gate) | Negative testing for input validation (injection, oversized input), response/log inspection for sensitive data leakage, session/token expiry checks during payment; scope limited to authentication, input validation, and data exposure classes relevant to this checkout flow | Manual + API test client (tool TBD) | — | Not specified |

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on critical path (card authorization, promo calculation, stock validation) | Yes | ≥ 90% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security test conditions (CVV/PAN non-exposure, promo-field input validation) executed | Yes | 100% |
| EC-4 | Test conditions traced to the three Brainstorm Top Focus Areas covered by at least one test case | Yes | 100% |

---

## Blockers / Dependencies

- Confirm which card networks/issuers are in scope for this cycle (owner: TBD, needed by: TBD)
- Confirm promo code types supported — flat/percentage/stacking rules (owner: TBD, needed by: TBD)
- Confirm whether 3D Secure/OTP is included in this checkout flow or deferred (owner: TBD, needed by: TBD)
- Confirm stock validation timing — reserved at cart-add vs. at payment submission (owner: TBD, needed by: TBD)

---

## Not in Scope

- Net banking, UPI, wallet, and BNPL payment methods (test basis names card payment only)
- Refund/chargeback flow validation (basis is point-of-purchase checkout, not post-transaction reversal)
- Saved card/tokenized instrument management (not referenced in test basis)
- Performance/load/stress testing of checkout under concurrent traffic (out of discipline scope; noted as a performance efficiency risk only)
- Cross-currency conversion display (not mentioned in test basis)
- Unit-level validation of pricing/discount algorithms (out of scope for this test level)

---

_Generated by TestFlowAssistant — Stage: Test Plan. This artifact is a draft for tester review; no criterion or target is approved until confirmed by the tester._