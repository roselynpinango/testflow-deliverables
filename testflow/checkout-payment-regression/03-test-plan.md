# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | Not specified in tester context — TBD (no numeric target was supplied; see Definition of Done EC-1) |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Cart total charged to card does not match final total after promo/stock recalculation (known domain defect pattern: currency/amount mismatch) | Functional Suitability | 4 | 5 | Add scenarios asserting authorized amount equals recalculated cart total at every promo/stock combination before capture |
| R-02 | Order confirmed despite payment failure, or payment captured despite stock-out, causing order/inventory/gateway state mismatch | Reliability | 4 | 5 | Add scenarios asserting order status transitions only after both stock reservation and payment capture succeed; verify rollback on partial failure |
| R-03 | Item goes out of stock between cart display and payment capture (race condition), leading to inconsistent stock state | Functional Suitability | 3 | 5 | Add scenario re-validating stock at capture time, not only at cart display, and assert order is blocked/reversed if stock is unavailable at capture |
| R-04 | Checkout flow change breaks payment gateway integration contract (request/response schema, callback/webhook handling) | Compatibility | 3 | 5 | Add integration scenarios verifying callback/webhook payload schema and status-code handling against sandbox gateway before regression sign-off |
| R-05 | CVV/card data or promo code injection payload exposed in logs, URLs, or error responses (PCI-DSS violation) | Security | 2 | 5 | Add scenarios asserting masked card display (first6/last4), no raw CVV in logs/errors, and injection payloads on promo/payment fields are rejected without data leakage |

_Not measured: prior regression cycle defect density or historical likelihood data for this build — likelihood values above are risk-based estimates from the approved brainstorm, not from measured incident logs._

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation — each flow independently and in the three-way combination named in the test basis | Derive test conditions per equivalence partitioning and boundary value analysis (payment success/decline/timeout, promo valid/invalid/expired, stock in/out); prioritize combinations that exercise R-01 and R-02 | TBD (not specified) | — | TBD (not estimated) |
| Regression | Previously passing checkout paths, re-verified per pesticide paradox, plus new promo/stock/payment interaction paths introduced this cycle | Re-run existing checkout regression suite; add targeted cases for the new three-way interaction paths flagged as defect-clustering risk | TBD (not specified) | — | TBD (not estimated) |
| Integration | Payment gateway integration boundary (callback/webhook, request/response schema) and inventory system integration boundary | Verify contract compliance and cross-system state consistency (gateway ↔ order ↔ inventory) in the sandbox environment, targeting the known defect-clustering zone (R-04) | Sandbox/test bank credentials (availability TBD — see Blockers) | — | TBD (not estimated) |
| Security | CVV/card data masking, input validation on promo code and payment fields, injection/tampering resistance, PCI-DSS non-exposure in logs/UI/errors | Mandatory per regulated-industry elevation policy: verify masked display, absence of raw CVV/card data in logs/errors, and rejection of SQL/script injection and oversized input on promo and payment fields (R-05); zero security scenarios would fail the quality gate | TBD (not specified) | — | TBD (not estimated) |

Rationale for type selection: Functional and Integration are required because the test basis names three functional flows plus explicit gateway/inventory integration boundaries as defect-clustering zones. Regression is required because this is a checkout *regression* cycle and prior paths must be re-verified. Security is mandatory under the regulated-industry policy regardless of basis silence, since payment/CVV data exposure is a named domain defect pattern. Performance is excluded per discipline boundary and is tracked only as a flagged risk, not a designed test type.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (card payment authorization + promo recalculation + stock validation combined scenarios) | Yes | TBD — coverage target not provided in tester context; cannot be signed off until a numeric target is supplied |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Security scenarios (CVV masking, injection resistance, data-exposure checks per R-05) executed | Yes | 100% |
| EC-4 | Each risk register item (R-01–R-05) has at least one executed test case tracing to it | Yes | 100% |

---

## Blockers / Dependencies

- Confirm whether promo code discount is applied before or after stock validation in the checkout sequence — Owner: TBD (not specified in test basis)
- Confirm test/sandbox payment gateway credentials and environment availability for this cycle — Owner: TBD (not specified)
- Clarify whether the concurrent-buyer stock race condition (R-03) is in scope for this regression cycle or deferred — Owner: TBD (not specified)

---

## Not in Scope

- Performance/load/stress testing of checkout under concurrent traffic (flagged as a Performance Efficiency risk, not designed here — out of discipline boundary)
- Unit-level validation of promo code discount calculation logic (developer-owned)
- BNPL, wallet top-up, and net banking payment methods (not part of this test basis; card payment only)
- Refund/chargeback flow testing (test basis limited to point-of-purchase checkout)
- Multi-currency conversion display (not mentioned in test basis; TBD whether this checkout supports multiple currencies)

---

_Generated by TestFlowAssistant — Stage: Test Plan. This is a draft artifact; it requires tester review and approval before use as an authoritative plan._