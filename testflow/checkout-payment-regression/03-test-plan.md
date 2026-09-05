# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | TBD — not specified (no coverage target figure supplied in tester context; draft DoD targets below are proposed planning goals pending tester confirmation) |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Order confirmed despite payment authorization failure/timeout (order status–gateway state mismatch) | Functional suitability | 4 | 5 | Add a test case asserting order status is set to "Confirmed" only when gateway authorization response = approved; assert no order is created on authorization failure/timeout |
| R-02 | Stock changes between cart display and payment capture (race condition), causing charge for unavailable item | Functional suitability | 4 | 4 | Add a test case re-validating stock at the capture step (not only at cart-add); assert reversal or partial-fulfillment flow triggers when stock changes between authorization and capture |
| R-03 | Card is charged a stale/incorrect amount because promo discount is not recalculated against the final validated cart before capture | Functional suitability | 3 | 5 | Add a test case verifying the captured amount equals the cart total recalculated after final promo and stock validation, immediately before the capture call |
| R-04 | Duplicate charge on retry after network timeout due to missing/unverified idempotency key mechanism | Reliability | 3 | 5 | Add a test case simulating timeout-then-retry with the same idempotency key; assert exactly one charge and one order are created, not duplicates |
| R-05 | CVV or full card number exposed in logs, URLs, or error/API responses | Security | 2 | 5 | Add a test case inspecting API responses, UI error states, and log output for card data; assert only masked first6/last4 is displayed and CVV is never persisted or logged |
| R-06 | Promo code field accepts oversized or injection-pattern input, exposing backend behavior or error detail | Security | 3 | 3 | Add a test case submitting oversized and injection-pattern strings into the promo code field; assert rejection with a generic error message and no backend stack trace or internal detail leak |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code calculation, stock validation — the three flows named in the test basis | Condition-level test design per flow (equivalence partitioning on cart/stock states, boundary values on promo amounts); each test traces to a named test basis flow | Manual/exploratory execution + API test client against checkout API | — | TBD — not specified |
| Regression | Checkout regression pack focused on payment × promo × stock intersection points identified in the risk register | Risk-based regression, prioritized by R-01–R-04 scores; re-run each build touching checkout, payment, or inventory code | Automated API regression suite (tool TBD — not specified) | — | TBD — not specified |
| Integration | Payment gateway webhook/callback reconciliation with stock decrement and promo ledger | Cross-component state-consistency checks against a sandbox gateway; verify callback timing does not cause duplicate charge or double stock decrement | Sandbox/test gateway credentials, API test client | — | TBD — not specified |
| Security | CVV/card data exposure surfaces, promo code input field, PCI-DSS-aligned masking | Negative/security test design: masked-data verification in UI/API/logs, injection-pattern and oversized-input submission, error-response inspection for detail leakage | Manual + API test client with crafted malicious/oversized payloads (sandbox data only, no real card numbers) | — | TBD — not specified |

**Rationale (per ISTQB test type justification):**
- **Functional** is included because the test basis explicitly names three functional flows requiring condition-level correctness verification.
- **Regression** is included because checkout is a high-change, high-traffic path where defect clustering is expected at the payment/discount/inventory intersection (known pattern: order confirmed despite payment failure).
- **Integration** is included because payment gateway and inventory service state consistency cannot be verified by testing either component in isolation.
- **Security** is included per regulated-industry requirement: card payment is a PCI-DSS-relevant entry point and the promo code field is an untrusted input surface.
- **Performance/load** is intentionally excluded — out of discipline scope; the underlying concurrency risk is tracked as R-02 with a functional (not load) mitigation.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (card payment + promo + stock intersection scenarios) | Yes | >= 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security test conditions (CVV/card masking, promo field injection/oversized input) executed | Yes | 100% |
| EC-4 | Test conditions traced to the three core test basis flows (card payment, promo code, stock validation) | Yes | 100% |

_Note: these are draft planning targets proposed for tester review, not measured results — no execution has occurred yet._

---

## Blockers / Dependencies

- Confirm whether 3D Secure/OTP step is in scope for this checkout flow — Owner: TBD — not specified
- Confirm promo code stacking rules (single vs. multiple codes) — not specified in test basis — Owner: TBD — not specified
- Confirm idempotency key mechanism exists for retry-on-timeout card payment — Owner: TBD — not specified

---

## Not in Scope

- Bank-side settlement/reconciliation processing (T+1/T+2 cycle) — outside checkout system boundary
- BNPL, wallet top-up, and net banking/UPI payment methods — not part of this test basis (card payment only)
- Refund/chargeback lifecycle — not mentioned in test basis
- Performance/load behavior under concurrent stock contention — documented as reliability risk (R-02); load/stress testing is out of discipline scope
- Cross-currency/multi-bank processing delays — no multi-currency requirement stated in test basis

---

_Generated by TestFlowAssistant — Stage: Test Plan_

This draft is for tester review — it is not an approved or authoritative artifact until you sign off on it.