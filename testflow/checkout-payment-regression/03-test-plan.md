# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | Not specified — no coverage target was provided in the tester context; see DoD EC-4 below, which is flagged as unmeasurable until this is supplied. |

---

## Entry Criteria

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EN-1 | Brainstorm Impact Analysis reviewed and available as test basis | Yes | 1 approved artifact on file |
| EN-2 | Sandbox/test bank credentials for card payment provisioned | Yes | Credentials received (currently an open blocker — see Blockers) |
| EN-3 | Clarification received on promo-vs-stock-check sequencing in checkout flow | Yes | Answer documented before functional test design starts |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Authorized/captured amount does not match final cart total after promo or stock-driven recalculation | Functional suitability | 5 | 5 | Add a test case asserting captured amount equals the final recalculated cart total immediately before payment submission is permitted to proceed |
| R-02 | Duplicate debit occurs on payment retry after timeout or network failure mid-checkout | Reliability | 4 | 5 | Add a test simulating a timed-out submission followed by retry using the same idempotency key, and assert exactly one debit/authorization is recorded |
| R-03 | Item goes out of stock between promo application and payment submission, causing order confirmed without capture, or capture without valid order | Reliability / Functional suitability | 4 | 4 | Add a test forcing a stock-out mid-flow and assert no capture occurs without a valid order, and no order confirms without a successful capture callback |
| R-04 | CVV/card data or promo-code error responses expose sensitive data in UI, URL, or logs; promo-code field accepts injection/oversized input | Security | 3 | 5 | Add tests asserting CVV/PAN are masked (first6/last4 only) in UI, API responses, and logs; add promo-code injection and oversized-input tests asserting rejection with no data exposure |
| R-05 | Promo code stacking, expiry, or malformed-code handling produces an incorrect final charged amount | Functional suitability | 3 | 3 | Add test cases for stacked-code rejection, expired-code rejection, and malformed-code handling, each asserting the charged amount matches the expected discount computation |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation, and their combined sequencing at checkout | Derive test conditions individually per functional area from the test basis (card payment, promo, stock), then design combined scenarios covering promo-then-stock-then-payment ordering; justified because the test basis names these as three distinct converging behaviors requiring both isolated and interaction coverage (functional suitability) | TBD — not specified | — | Not specified |
| Regression | Existing checkout payment paths re-verified whenever promo/stock logic changes; focus on amount-integrity and duplicate-debit paths flagged in the risk register | Re-execute prior checkout regression cases plus new R-01/R-02 interaction scenarios; justified by domain defect-clustering history (duplicate debits, amount mismatches are recurring patterns in this area) | TBD — sandbox/test bank credentials pending (see Blockers) | — | Not specified |
| Integration | Cross-component state consistency between payment gateway, promo engine, and inventory service (order status vs. bank debit vs. stock count) | Design test conditions that simulate a stock change or promo recalculation mid-checkout and verify the resulting order/payment/stock states remain consistent across all three services; justified because these are separate components whose desynchronization is the mechanism behind R-01 and R-03 | TBD — not specified | — | Not specified |

Security is not a separate row in this table because it is woven into Functional and Regression scope per R-04; per the regulated-industry mandate, security scenarios (CVV masking, promo-field injection/oversized input) are mandatory and their absence would fail the quality gate — see R-04.

Performance/load testing is explicitly out of scope per the discipline boundary and is tracked only as a risk in the brainstorm artifact, not as a test type here.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (card payment authorization + capture, including R-01/R-02 scenarios) | Yes | ≥ 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security scenarios (CVV masking, promo-code injection/oversized input) executed | Yes | 100% of planned security test cases executed |
| EC-4 | Overall checkout regression suite coverage against test basis | No — no coverage target has been supplied; cannot be graded until provided | TBD — pending stakeholder input |

---

## Blockers / Dependencies

- Confirm whether promo code validation occurs before or after stock check in the checkout sequence (Owner: TBD, needed by: not specified)
- Confirm 3DS/OTP requirement applies to this checkout flow — not stated in test basis (Owner: TBD, needed by: not specified)
- Test bank/sandbox credentials for card payment scenarios (Owner: TBD, needed by: not specified)

---

## Not in Scope

- Performance/load/stress testing of checkout under concurrent traffic (out of scope per discipline boundary; tracked as a performance efficiency risk, not tested)
- BNPL, wallet top-up, and net banking/UPI payment methods (not mentioned in test basis; card payment only)
- Refund/chargeback lifecycle (not part of this test basis — point-of-purchase only)
- Cross-currency/multi-bank conversion display (not indicated in test basis; TBD whether checkout supports multi-currency)
- Backend reconciliation/settlement cycle verification (outside web/API test scope this cycle)

---

_Generated by TestFlowAssistant — Stage: Test Plan_

This draft reflects the approved Brainstorm artifact and the tester context supplied. It has not been reviewed or approved — a human tester must review and sign off before this plan is considered authoritative, and the open blockers and TBD/Not specified fields above should be resolved first.