# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | Not specified — TBD (no coverage target provided in tester context; to be confirmed before sign-off) |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|------------|
| R-01 | Order is confirmed despite payment failure when stock is depleted concurrently with an in-progress card payment | Functional suitability / Reliability | 4 | 5 | Add scenario asserting order status remains "pending/failed" (not "confirmed") when stock depletion and payment authorization race; verify order-service and gateway status agree before confirmation is rendered |
| R-02 | Amount authorized/captured by the bank does not match cart total after promo code recalculation | Reliability | 4 | 4 | Add scenario comparing cart total (post-promo) to gateway authorization amount and bank-side captured amount for exact match, including boundary/rounding cases |
| R-03 | CVV or card data is exposed in logs, URLs, API responses, or error messages during checkout | Security | 3 | 5 | Add negative-path scenario inspecting API responses, error payloads, and log output for masked-only card data (first6/last4) and absence of raw CVV, per PCI-DSS |
| R-04 | Payment gateway webhook/callback for payment status is missed or duplicated, causing order-status desync | Compatibility | 3 | 4 | Add scenario replaying a delayed/duplicate webhook callback and asserting idempotent, correct final order status |
| R-05 | Expired or invalid promo code is accepted and discount applied incorrectly at checkout | Functional suitability | 3 | 3 | Add scenario submitting expired/invalid/malformed promo codes and asserting rejection with correct cart total unchanged |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture flow, promo code discount calculation, stock validation logic at point of purchase | Test-condition-based design from the test basis (card payment, promo code, stock validation), covering success, boundary (e.g., last-unit stock, code expiry edge), and negative paths | Manual/exploratory + API test client (specific tool TBD) | — | TBD |
| Regression | Known checkout defect patterns: order-confirmed-despite-payment-failure, cart-vs-bank amount mismatch | Re-execute prior regression scenarios each cycle per the pesticide paradox, refreshing assertions against current known defect patterns | Manual/exploratory + API test client (specific tool TBD) | — | TBD |
| Integration | Payment gateway ↔ order service webhook/callback handling; stock/inventory service ↔ checkout; promo/discount engine ↔ cart | Cross-component scenario design verifying state consistency across gateway, inventory, and discount services at each checkout stage | API test client / sandbox gateway credentials (TBD confirmation pending — see Blockers) | — | TBD |
| Security | CVV/card data masking and non-exposure (logs, URLs, API responses, error messages); input validation on promo code and card entry fields against injection/oversized input patterns | Negative-path and data-exposure verification per PCI-DSS mandate; elevated priority per regulated-industry status — justified because card data and payment fields are directly in this cycle's test basis | Manual inspection of responses/logs + API test client (specific tool TBD) | — | TBD |

**Rationale for test type selection:** Functional and Regression are required because the test basis explicitly names card payment, promo code, and stock validation as checkout conditions, and this stage is a stated regression cycle over recurring defect patterns. Integration is required because payment, inventory, and discount services interact directly in the checkout flow. Security is elevated to required per regulated-industry status and PCI-DSS applicability to card/CVV data present in this test basis. Performance efficiency risk (stock-validation race under concurrent checkout) is noted in the Risk Register but is out of discipline scope for this plan — no load/stress test is designed.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical checkout path (payment, promo, stock) | Yes | ≥ 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security scenarios (CVV/card data exposure, input validation) executed | Yes | 100% of planned security scenarios executed |
| EC-4 | Coverage target for identified test conditions | No | TBD — coverage target not specified in tester context; must be confirmed before sign-off |

---

## Blockers / Dependencies

- Confirm whether promo codes and stock checks are validated synchronously or asynchronously relative to payment authorization (Owner: TBD, Needed by: TBD)
- Confirm sandbox/test bank credentials and a test promo code set are available for this cycle (Owner: TBD, Needed by: TBD)
- Clarify expected system behavior when stock becomes unavailable after payment authorization but before capture (Owner: TBD, Needed by: TBD)

---

## Not in Scope

- BNPL, UPI, net banking, and wallet top-up payment methods (card payment only, per test basis)
- Refund and chargeback flow verification (separate lifecycle stage)
- Saved payment instrument / tokenized card management (not referenced in test basis)
- Performance efficiency under load/concurrent checkout volume (out of discipline scope; tracked as risk only, not tested)
- Settlement/reconciliation between merchant and bank (post-transaction backend process)

---

_Generated by TestFlowAssistant — Stage: Test Plan_