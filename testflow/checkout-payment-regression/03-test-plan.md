# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | 90% |

---

## Entry Criteria

| ID | Criterion | Target |
|----|-----------|--------|
| ENT-1 | Test basis (approved Brainstorm artifact) reviewed and available | 100% sections reviewed |
| ENT-2 | Sandbox payment gateway credentials and test card set provisioned | Available before test execution start |
| ENT-3 | Server-side vs. client-trusted promo validation confirmed (see Blockers) | Confirmed — currently TBD |

_Note: ENT-2 and ENT-3 are currently unresolved (see Blockers / Dependencies). Execution of tamper and idempotency scenarios cannot start until they are closed._

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Amount sent to payment gateway does not match cart total minus discount (miscalculation or client-side tampering after promo application) | Functional suitability / Security | 4 | 5 | Add scenario asserting server recalculates and validates final amount independent of client payload before gateway call; include a tampered-amount negative test |
| R-02 | Item goes out of stock between authorization and capture, resulting in "paid but unfulfilled" order state | Reliability | 4 | 5 | Add scenario forcing stock depletion between authorization and capture; assert system either blocks capture or triggers automatic reversal, and order status reflects the outcome |
| R-03 | Duplicate debit occurs when payment is retried after a gateway timeout or webhook delay | Reliability | 3 | 5 | Add scenario simulating retry with same idempotency key after timeout; assert only one capture is recorded and duplicate is rejected/deduplicated |
| R-04 | Promo code field accepts injection or malformed input (SQL/script patterns, oversized strings) that bypasses validation | Security | 3 | 4 | Add negative test cases submitting injection patterns and oversized promo strings; assert rejection with generic error and no backend error leakage |
| R-05 | CVV/card data appears in application logs, URLs, or error responses during checkout failure paths | Security | 2 | 5 | Add scenario triggering a payment failure/error path; assert log and response inspection shows no raw CVV/card PAN (only masked first6/last4) |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation — individually and per expected checkout logic | Scenario-based verification against test basis; positive and negative cases per condition | Manual + API test client against sandbox gateway | — | TBD |
| Regression | Known checkout defect patterns: duplicate debit on retry, order confirmed despite failed payment, amount mismatch after discount | Re-run prior regression scenarios plus new cases from R-01–R-05 against current build (pesticide-paradox refresh) | API/UI regression suite (sandbox environment) | — | TBD |
| Integration | Interaction seam between promo engine → stock/inventory service → payment gateway (discount recalculation → amount → capture call) | End-to-end sequencing tests across the three services, including race-condition and timing scenarios | API test client + sandbox gateway/webhook simulator | — | TBD |
| Security | Input validation on promo/payment forms; data exposure in logs/responses; amount-tampering checks | Negative/injection test design per regulated-industry mandate; log/response inspection | Manual + API test client (sandbox data only, no real card data) | — | TBD |

**Rationale for test type selection:**
- **Functional** is required because the test basis explicitly names card payment, promo code, and stock validation as behaviors to verify — this is core functional suitability coverage.
- **Regression** is required because the test basis is named "Checkout payment regression" and prior known defect patterns (duplicate debit, state mismatch) must be re-verified rather than assumed fixed.
- **Integration** is prioritized because the brainstorm identifies the promo→stock→payment seam as the highest-risk interaction (sequencing/timing), not any single component in isolation.
- **Security** is mandatory under the regulated-industry standard — zero security scenarios would fail the quality gate, and the test basis itself flags injection and data-exposure surfaces on promo/payment forms.
- **Performance** is excluded — out of discipline scope; concurrency risk on stock validation is logged as R-02 (reliability), not load-tested.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on critical path (payment amount integrity, stock-payment sequencing, duplicate-debit prevention) | Yes | >= 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Security scenarios executed covering R-04 and R-05 (injection input, CVV/log exposure) | Yes | 100% of planned security scenarios executed |
| EC-4 | Overall scenario coverage against test basis conditions | Yes | >= 90% |
| EC-5 | Open blockers (sandbox credentials, promo validation model, stock-depletion behavior) resolved before sign-off | No — resolution requires stakeholder confirmation, not a run-result check | Resolved (owner/date TBD) |

---

## Blockers / Dependencies

- Confirm whether promo code validation is server-side authoritative or client-trusted (affects tamper-test design) — Owner: TBD, Needed by: TBD
- Confirm test/sandbox payment gateway credentials and sandbox card set availability — Owner: TBD, Needed by: TBD
- Clarify expected system behavior when stock depletes after payment authorization but before capture — Owner: TBD, Needed by: TBD

---

## Not in Scope

- Performance/load/stress testing of checkout under high concurrent traffic (logged as a performance efficiency risk in Brainstorm, not tested this cycle)
- Unit-level testing of promo discount calculation logic (developer-owned, out of software-testing artifact scope)
- BNPL, wallet top-up, and net banking payment methods (test basis names card payment only)
- Refund/chargeback lifecycle (not part of this checkout point-of-purchase basis)
- Multi-currency conversion display (not mentioned in test basis; TBD if in scope)

---

_Generated by TestFlowAssistant — Stage: Test Plan_

*This artifact is a draft for tester review. It requires human approval before it is considered final.*