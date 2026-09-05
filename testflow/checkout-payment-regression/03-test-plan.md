# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | 90% *(draft — not specified by tester context; proposed target pending confirmation)* |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Discounted/adjusted cart total sent to payment gateway does not match the price displayed to the customer after promo + stock recalculation | Functional Suitability | 5 | 5 | Add a test case asserting gateway authorization amount equals the displayed cart total (to the cent) across promo-applied and stock-adjusted checkout paths |
| R-02 | Race condition between stock validation and payment capture confirms an order for unavailable stock, or captures payment without fulfillment | Reliability | 4 | 5 | Add a scenario simulating stock depletion during the payment authorization window and assert the resulting order/payment state (authorized-not-captured, stock hold released) is consistent |
| R-03 | CVV/card data or session token is exposed in logs, URLs, or error responses | Security | 3 | 5 | Add a negative test asserting error responses and application logs show only masked card data (first6/last4), never CVV/full PAN, and that an expired session token is rejected on reuse |
| R-04 | Payment gateway callback contract/version drift causes transaction lifecycle state mismatch between checkout and gateway | Compatibility | 3 | 4 | Add an integration test validating the gateway callback schema/version against the current contract and asserting order state updates correctly on each callback status |
| R-05 | Promo code stacking/expiry recalculation on cart change (e.g., item goes out of stock) displays an incorrect final price vs. amount actually charged | Functional Suitability | 3 | 3 | Add a test case that triggers a cart change after promo application and asserts the recalculated price matches both the UI display and the captured amount |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Payment amount integrity across promo + stock adjustments; promo code application logic; stock validation at point of purchase (test conditions traced to Brainstorm Top 3 Focus Areas) | Design test cases per ISTQB test condition derived from the approved brainstorm; verify UI-displayed total, gateway authorization amount, and backend order state agree after recalculation | Sandbox test gateway + API test client (tool TBD) | — | TBD |
| Regression | Full checkout regression suite covering payment, promo, and stock conditions previously identified as defect-prone (duplicate debit, order confirmed despite payment failure) | Re-execute regression suite each build; prioritize scenarios matching known defect clustering areas per ISTQB defect clustering principle; refresh assertions to counter pesticide paradox | Existing regression suite (tool TBD) | — | TBD |
| Integration | Payment gateway callback contract; promo engine ↔ cart service interaction; stock/inventory service ↔ payment capture sequencing | Verify component interaction contracts (request/response schema, state transitions on webhook callback) rather than isolated unit behavior — this is the primary risk this cycle per brainstorm rationale | API test client / contract verification tooling (TBD) | — | TBD |
| Security | CVV/PII non-exposure in logs, UI, and error responses; session/token expiry after checkout abandonment; input validation on promo code and payment fields (injection, oversized input, special characters); authorization boundary on saved payment instrument access | Execute negative/security scenarios mandated by regulated-industry status; verify masked card data (first6/last4) only, verify token invalidation timing, verify errors carry no stack trace or PCI data | Manual security test cases + log inspection (automation TBD) | — | TBD |

**Rationale for test type selection:** Functional and Integration are required because the three converging test conditions (payment, promo, stock) derive directly from the test basis and their *interaction* — not isolated behavior — is this cycle's primary risk (R-01, R-02, R-04). Regression is required because checkout is a high-traffic, frequently modified path with documented defect clustering. Security is mandatory per the regulated-industry mandate (R-03); zero security coverage is not acceptable. Performance/load testing is intentionally excluded — performance efficiency risk (stock-check latency under promo recalculation) is flagged in the Brainstorm but is out of this discipline's scope.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (payment amount integrity, stock-payment race, gateway callback) | Yes | ≥ 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security scenarios (CVV/PII non-exposure, session/token expiry, input validation) executed | Yes | 100% executed |
| EC-4 | Open Blockers (below) resolved before test execution start | Yes | 3 of 3 closed |

---

## Blockers / Dependencies

- Confirm whether promo code validation occurs client-side, server-side, or both (affects tamperability/security test design) — Owner: TBD, Needed by: TBD
- Confirm sandbox/test gateway credentials and test bank cards available for card payment scenarios — Owner: TBD, Needed by: TBD
- Confirm stock validation timing model (pre-authorization hold vs. post-capture check) — Owner: TBD, Needed by: TBD

---

## Not in Scope

- Load/stress/performance testing of checkout under high concurrent traffic (performance efficiency flagged as a risk in Brainstorm, not tested this cycle — out of discipline scope)
- Non-card payment methods (net banking, UPI, wallet, BNPL)
- Settlement/reconciliation with issuing bank beyond checkout-side authorization
- Refund/chargeback flows (separate test basis)
- Native mobile app checkout (scope limited to web/API)

---

_Generated by TestFlowAssistant — Stage: Test Plan. Draft for tester review; no field in this artifact constitutes approval or sign-off._