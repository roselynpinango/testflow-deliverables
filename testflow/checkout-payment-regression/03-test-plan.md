# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | TBD (not specified — no numeric coverage target provided in tester context) |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|-----------|
| R-01 | Charged amount sent to payment gateway does not correctly reflect combined promo discount and stock-adjusted price, causing silent over/undercharge | Functional Suitability | 4 | 5 | Add scenarios asserting gateway request payload amount equals cart total minus promo discount, adjusted for stock-limited pricing, across at least 3 promo/stock combinations |
| R-02 | Order is confirmed while payment authorization fails or reverses (stock depletes between authorization and capture) | Reliability | 3 | 5 | Add integration scenario forcing stock-out between authorization and capture; assert order status and payment status remain consistent (no confirmed order without a captured/settled payment) |
| R-03 | Raw CVV or unmasked card data appears in UI, error messages, or application logs during promo/stock failure paths | Security | 2 | 5 | Add negative scenarios that trigger promo-invalid and stock-out errors mid-payment; inspect UI responses and log output to confirm CVV is never displayed/stored and card number is masked to first6/last4 |
| R-04 | Promo code or payment field accepts malformed/injection-style input (oversized strings, script/SQL patterns) without safe rejection | Security | 3 | 3 | Add boundary and injection-pattern input tests on promo code and card fields; assert safe rejection with generic error message and no stack trace exposure |
| R-05 | Promo stacking or expiry logic produces an incorrect discount value at checkout | Functional Suitability | 2 | 3 | Add scenarios covering expired code, stacked codes, and invalid code entry, asserting displayed and charged discount matches expected calculation |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture, promo code application (stacking, expiry, invalid codes), stock validation at checkout, amount-integrity checks (test basis conditions) | Positive and negative scenario testing per test condition, verifying computed charged amount matches cart + promo + stock adjustments before submission to gateway | API testing tool (name TBD) + manual UI verification | — | TBD (not specified) |
| Regression | Previously verified checkout flows (card payment success/fail, promo application, stock check) affected by this sprint's promo/stock logic changes | Risk-based regression subset targeting defect-clustering areas per domain history (duplicate debits, order/payment state mismatch) rather than full suite re-run | Existing regression suite (tool TBD) | — | TBD (not specified) |
| Integration | Payment gateway ↔ promo engine ↔ inventory service interaction; stock-out mid-transaction impact on payment/order state | End-to-end scenario testing across service boundaries using sandbox/test bank credentials, asserting gateway request payload, order status, and inventory state stay consistent | API testing tool + sandbox environment (name TBD) | — | TBD (not specified) |
| Security | Card/CVV masking in UI, logs, and error messages; input validation on promo code and payment fields against injection/oversized/special-character input | Negative and boundary testing with malformed/malicious inputs; inspection of UI responses and logs for PCI data exposure | API testing tool + manual log/response inspection | — | TBD (not specified) |

**Rationale for selection:** Functional, Regression, Integration, and Security are all included because the brainstorm's Impact Radar and Test Approach Decision identify all three converging test conditions (payment, promo, stock) as high or medium risk with cross-service interaction defects (R-01, R-02) and mandatory regulated-industry security coverage (R-03, R-04). Performance/load testing is excluded — out of discipline scope — and instead retained only as a flagged risk, not a test type, consistent with the brainstorm's decision.

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical path (payment amount integrity + order/payment state consistency scenarios) | Yes | >= 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Planned security scenarios (CVV masking, promo/payment field input validation) executed | Yes | 100% of planned security scenarios executed |
| EC-4 | Regression suite pass rate on existing checkout flows | Yes | >= 90% |

---

## Blockers / Dependencies

- Confirm whether promo codes can stack with stock-limited "last item" pricing rules — owner TBD (not specified), needed-by TBD (not specified)
- Confirm sandbox/test bank credentials and test promo codes are available for this cycle — owner TBD (not specified), needed-by TBD (not specified)
- Clarify expected system behavior when stock depletes after authorization but before capture — owner TBD (not specified), needed-by TBD (not specified)

---

## Not in Scope

- Performance/load/stress testing of checkout under concurrent traffic (out of discipline scope; flagged as a risk only, not tested)
- Unit-level testing of the promo discount calculation engine (developer-level scope)
- BNPL, wallet top-up, and net banking payment methods (not part of this test basis)
- Refund/chargeback flow testing (test basis limited to point-of-purchase checkout)
- Multi-currency/cross-border conversion display (not mentioned in test basis; TBD for future scope)

---

_Generated by TestFlowAssistant — Stage: Test Plan_

*This draft is for tester review; it is not an approved or authoritative artifact until a human signs off.*