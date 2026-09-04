# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | TBD — not specified in tester context; required before exit criteria can be finalized |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Charged/authorized amount does not match cart total after promo code discount is applied | Functional suitability | 4 | 5 | Add scenarios asserting authorization amount equals (cart subtotal − promo discount) for valid, expired, and stacked promo inputs before capture |
| R-02 | Order is confirmed / payment captured despite item going out of stock between cart and capture (state mismatch) | Reliability | 4 | 5 | Add scenario forcing stock depletion between authorization and capture; assert capture is blocked and order status reflects "unavailable," not "confirmed" |
| R-03 | Duplicate debit occurs when customer retries payment after a timeout or network failure | Reliability | 3 | 5 | Add scenario simulating timeout mid-authorization then retry; assert idempotency key prevents a second charge and only one authorization record exists |
| R-04 | CVV/card data or full PAN appears in logs, URLs, or error/exception messages during checkout | Security | 3 | 5 | Add negative scenarios triggering payment errors (declined, invalid CVV, network drop) and inspect logs/UI/network responses for masked-only data (first6/last4), zero raw CVV |
| R-05 | Promo code field accepts injection patterns or stacking of expired/invalid codes, altering the authorized amount | Security | 3 | 4 | Add scenarios submitting SQL/script injection patterns and expired/duplicate promo codes; assert rejection and no change to authorized amount |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application, stock validation at point of purchase, and their combined interaction | Risk-based scenario design per condition (success/fail/edge) plus combined-condition scenarios (promo + payment, stock + payment) per Top 3 Focus Areas from brainstorm | Manual execution + API client for checkout endpoints; sandbox bank/card credentials (blocker — see below) | — | TBD |
| Regression | Known defect patterns: duplicate debit on retry, order-confirmed-despite-unavailable-stock, cart-vs-charged amount mismatch | Re-execute targeted regression subset each cycle to guard against pesticide paradox; refresh assertions when checkout logic changes | TBD — automation framework not specified in tester context | — | TBD |
| Integration | State consistency across payment gateway, promo engine, and inventory service (amount, stock count, order status) | Verify state handoff at each integration point: promo recalculation occurs before authorization; stock is re-checked before capture; order status reflects gateway response | API testing tool (e.g., Postman/REST client) against sandbox environment | — | TBD |

**Rationale for test type selection:**
- **Functional** — required because the test basis explicitly names three interacting conditions; each and their combination need functional-suitability verification (ISTQB: trace every test to a basis item).
- **Regression** — checkout is a documented defect-clustering area (duplicate debits, state mismatch); omitting regression risks re-introducing previously fixed defects.
- **Integration** — the primary risk is not any single component but inconsistent state exchange between payment, promo, and inventory services; integration-level tests target that risk directly.
- **Performance** — out of discipline scope; the race-condition risk under concurrent buyers is recorded in the Risk Register, not tested this cycle.
- **Security** — regulated-industry mandate; zero security scenarios would fail the quality gate, and PCI/injection risks (R-04, R-05) are plausible attack surfaces at checkout.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (card payment authorization → capture → order status) | Yes | ≥ 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Security scenarios executed covering R-04 (PCI data exposure) and R-05 (promo injection) | Yes | 100% of identified security scenarios executed |
| EC-4 | Overall checkout coverage target | Yes | TBD — pending coverage target confirmation |

---

## Blockers / Dependencies

- Confirm whether stock validation occurs at add-to-cart, at payment initiation, or at capture (sequence not specified in test basis) — owner TBD
- Confirm promo code business rules (stacking allowed? expiry enforcement point?) — not specified — owner TBD
- Confirm test environment provides sandbox card/bank credentials (no real card data permitted in test artifacts) — owner TBD

---

## Not in Scope

- Performance/load/stress testing of checkout under concurrent traffic (efficiency risk noted in Risk Register, not tested this cycle)
- BNPL, wallet top-up, and net banking payment methods (not part of supplied test basis)
- Refund/chargeback lifecycle (checkout only, per test basis)
- Cross-currency/multi-bank settlement cycle behavior (not mentioned in test basis)
- Native mobile app checkout (web/API scope confirmed; mobile-specific behavior TBD)

---

_Generated by TestFlowAssistant — Stage: Test Plan_

*This draft requires tester review and sign-off before use; coverage target and story points remain TBD pending confirmation.*