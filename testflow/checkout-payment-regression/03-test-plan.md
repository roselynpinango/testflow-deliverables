# Test Plan

---

## Sprint Context

| Field | Value |
|-------|-------|
| Coverage target | TBD (not specified in tester context — to be confirmed before sign-off) |

---

## Risk Register

| ID | Risk | Impact Area | Likelihood | Impact | Mitigation |
|----|------|-------------|-----------|--------|------------|
| R-01 | Authorized/captured card amount does not reflect promo-discounted cart total | Functional Suitability | 4 | 5 | Add scenario asserting authorized amount equals cart total minus applied promo discount, cross-checked against sandbox bank statement entry |
| R-02 | Stock depleted between promo code application and payment submission; order confirms against unavailable stock | Reliability | 4 | 5 | Add concurrency scenario: apply promo in session A, deplete stock via session B, then submit payment in session A — assert order is rejected, not confirmed |
| R-03 | Duplicate debit when payment is retried after a network timeout mid-transaction | Reliability | 3 | 5 | Add scenario simulating connection drop mid-authorization, then retry with the same idempotency key — assert exactly one charge is recorded |
| R-04 | Order confirmed in order system despite a gateway decline/failure response | Functional Suitability | 3 | 5 | Add scenario forcing a gateway decline response — assert order status remains "payment failed", not "confirmed" |
| R-05 | Card/CVV data exposed in logs, error messages, or API responses during checkout | Security | 2 | 5 | Add scenario inspecting all checkout API responses, application logs, and UI error states — assert PAN/CVV are masked or absent (PCI-DSS) |
| R-06 | Promo code field accepts unvalidated input (injection, oversized, special characters) | Security | 3 | 3 | Add negative scenarios submitting SQL/script injection strings and oversized input into the promo code field — assert rejection with no stack trace or server error exposure |

---

## Test Strategy

| Test Type | Scope | Approach | Tooling | Owner | Story Points |
|-----------|-------|----------|---------|-------|-------------|
| Functional | Card payment authorization/capture against cart total (with/without promo), promo code application logic, stock validation at final submission (R-01, R-02, R-04) | Scenario-based testing at UI and API layer covering happy path and negative/edge cases for each of the three interacting test conditions | Manual/exploratory + API test client against sandbox gateway and test card credentials | — | TBD (not specified) |
| Regression | Existing checkout success/failure paths (card payment without promo, stock available) | Refresh existing checkout regression suite to include new promo/stock interaction cases; retire stale/duplicate cases per pesticide paradox | Existing regression suite — tool not specified (TBD); sandbox environment | — | TBD (not specified) |
| Integration | Handoffs between payment gateway, promo code service, and stock/inventory service (R-01, R-02, R-04) | API-level tests verifying order state, gateway response, and inventory count remain consistent across service boundaries at final submission | API test client against sandbox/test instances of gateway, promo, and inventory services | — | TBD (not specified) |
| Security | Card/CVV masking in UI, logs, API responses; promo code input validation; checkout session handling (R-05, R-06) | Negative/security-focused scenarios: injection strings, oversized input, log/response inspection for PCI data exposure | API test client + log inspection — tool not specified (TBD); sandbox test cards only, never real PAN data | — | TBD (not specified) |

**Test type rationale:**
- Functional and Integration are mandatory — the test basis names combined-state consistency across payment, promo, and stock services as the primary risk this cycle (R-01, R-02, R-04).
- Regression is mandatory — checkout is a previously-stable, high-traffic flow; new promo/stock logic risks regressing existing payment success paths.
- Security is mandatory — this is a regulated-industry, PCI-DSS-relevant surface (R-05, R-06); zero security coverage fails the mandatory security gate.
- Performance is excluded — race-condition risk (R-02) is addressed via functional concurrency scenarios, not load/stress testing, which is out of this discipline's scope.

---

## Entry Criteria

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EN-1 | Test basis (approved Brainstorm artifact covering card payment, promo code, stock validation) available | Yes | 100% of 3 test conditions documented |
| EN-2 | Sandbox/test environment reachable for payment gateway, promo code service, and stock/inventory service | Yes | 3 of 3 services reachable |
| EN-3 | Test data available: valid sandbox test card, valid and expired promo codes, one SKU with controllable stock level | Yes | 3 of 3 data sets provisioned |

---

## Definition of Done

| ID | Criterion | Measurable | Target |
|----|-----------|-----------|--------|
| EC-1 | Scenario pass rate on the critical checkout path (payment + promo + stock combined scenarios) | Yes | >= 95% |
| EC-2 | Open Critical or High severity defects at sign-off | Yes | 0 |
| EC-3 | Security scenarios (R-05, R-06) executed | Yes | 100% executed |
| EC-4 | Duplicate-charge/idempotency scenario (R-03) executed and passed | Yes | 1/1 pass |

---

## Blockers / Dependencies

- Confirm whether 3D Secure/OTP is in scope for this checkout flow — Owner TBD (not specified)
- Confirm order of operations: does stock validation occur before or after payment authorization? — Owner TBD (not specified)
- Confirm whether promo code validation is server-side only or has a client-side pre-check that could be bypassed — Owner TBD (not specified)

---

## Not in Scope

- Refund and chargeback flows (not part of the stated test basis — checkout only)
- Saved payment instrument / tokenized card management (not mentioned in test basis)
- BNPL, net banking, UPI, wallet payment methods (test basis specifies card payment only)
- Cross-currency conversion display and multi-bank settlement delays (not mentioned in test basis)
- Performance/load behavior under concurrent checkout volume (out of discipline scope; flagged as a risk, not tested here)

---

_Generated by TestFlowAssistant — Stage: Test Plan. This draft requires tester review and approval before execution._