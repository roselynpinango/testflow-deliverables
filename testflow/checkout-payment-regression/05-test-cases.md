# Test Cases

**Feature:** Checkout Payment Regression — Authorization Accuracy, Stock Consistency, and Duplicate-Charge Prevention
**Source:** Approved Scenarios Artifact + Approved Risk Register
**Status:** Draft — requires tester review before execution

---

| ID | Area | Title | Preconditions | Steps | Expected Result | Risk | Type | Status |
|----|------|-------|---------------|-------|------------------|------|------|--------|
| TC-001 | Payment Authorization (Functional Suitability) | Authorized amount matches subtotal after valid promo discount | Cart contains items with a known subtotal; a valid, unexpired promo code exists; payment gateway sandbox is available | 1. Apply the valid promo code to the cart. 2. Submit payment for authorization using a sandbox test card. 3. Retrieve the authorization response and order status. | Authorized amount equals cart subtotal minus promo discount, exactly as returned in the gateway authorization response; order status = "authorized". | Critical | Functional |Pending |
| TC-002 | Stock/Capture Consistency (Reliability) | Capture is blocked when an item goes out of stock before capture | An item in the cart has an existing authorization (order status = "authorized"); inventory system is accessible to simulate stock depletion | 1. Confirm the order's authorization record exists for item X. 2. Deplete stock of item X before the capture step runs. 3. Trigger the capture process for the order. | Capture request is rejected/blocked; no funds are captured; order status = "unavailable" (not "confirmed"). | Critical | Negative | Pending |
| TC-003 | Idempotency / Retry Handling (Reliability) | Retry after a payment timeout does not create a duplicate authorization | A payment authorization request is configured in sandbox to time out mid-transaction; the original idempotency key from the first attempt is available | 1. Submit a payment authorization that times out mid-transaction. 2. Retry the same payment submission using the original idempotency key. 3. Query the gateway/order system for authorization records tied to the order. | Exactly one authorization record exists for the order; no duplicate debit appears in the sandbox transaction ledger. | High | Negative | Pending |
| TC-004 | Promo Code Authorization (Functional Suitability) | Promo code type "valid-active" produces subtotal minus discount | Cart subtotal is known; a promo code of type "valid-active" is available and unapplied | 1. Apply the promo code (type: valid-active). 2. Submit payment for authorization. | Authorized amount equals cart subtotal minus the applicable discount amount; order status reflects "authorized". | Critical | Functional | Pending |
| TC-005 | Promo Code Authorization (Functional Suitability) | Promo code type "expired" is rejected and subtotal remains unchanged | Cart subtotal is known; a promo code known to be expired is available | 1. Apply the expired promo code. 2. Submit payment for authorization. | Promo code is rejected with an observable rejection message to the customer; authorized amount equals the original, unmodified cart subtotal. | Critical | Negative | Pending |
| TC-006 | Promo Code Authorization (Functional Suitability) | Promo code type "stacked-duplicate" applies at most one discount — exact stacking rule TBD | Cart subtotal is known; two promo codes of the same/duplicate type are available for a stacking attempt | 1. Apply the first promo code. 2. Attempt to apply a second, duplicate-type promo code. 3. Submit payment for authorization. | Authorized amount reflects at most a single discount applied (i.e., does not equal subtotal minus the sum of both discounts). **Exact stacking business rule is TBD (per plan Blockers) — tester must confirm the specific expected authorized value against the product decision before this case can be marked Pass/Fail.** | Critical | Functional | Pending — TBD rule |
| TC-007 | Payment Authorization Boundary (Functional Suitability) | Authorized amount at full-discount boundary complies with gateway minimum-payable rule | Cart subtotal is known; a promo discount equal to the full cart subtotal is configured; gateway sandbox is available | 1. Apply the full-subtotal-equivalent discount. 2. Submit payment for authorization. | Authorized amount does not fall below the payment gateway's minimum payable amount; order status is either "authorized" or "rejected" consistent with that minimum-amount rule. **Exact numeric minimum payable value is not specified in the test basis — tester to confirm against actual gateway configuration before assigning Pass/Fail.** | Critical | Boundary | Pending — value not specified |
| TC-008 | Card Data Exposure (Security) | CVV and full PAN are not exposed after a declined transaction | A sandbox test card configured to trigger a decline is available; application logs are accessible for review | 1. Submit payment using the sandbox decline test card. 2. Capture the exact error message shown to the customer. 3. Review application logs generated during the transaction attempt. | Error message contains no CVV value and no full PAN; application logs contain no CVV value and no full PAN; any displayed card reference shows only first six and last four digits (masked per PCI-DSS). | High | Negative | Pending |
| TC-009 | Promo Code Input Validation (Security) | Promo code field rejects an injection pattern; authorized amount unchanged | Cart subtotal is known before promo code entry; promo code field is accessible on the checkout page | 1. Enter a SQL or script injection pattern into the promo code field (e.g., a quote-based SQL pattern or a script tag payload). 2. Submit payment for authorization. | Promo code is rejected; authorized amount remains equal to the original cart subtotal; the error message displayed contains no internal system detail (no stack trace, no query/schema fragment). | High | Negative | Pending |

> **Risk key:** Critical / High / Medium / Low — inherited from the scenario's `@risk-…` tag and the Approved Risk Register band it traces to (see Traceability below).

---

## Traceability

| Test Case | Risk ID | Scenario source |
|---|---|---|
| TC-001 | R-01 | Authorized amount matches cart subtotal after valid promo |
| TC-002 | R-02 | Capture blocked on stock depletion |
| TC-003 | R-03 | Retry after timeout / idempotency |
| TC-004 | R-01 | Promo code outline — valid-active |
| TC-005 | R-01 | Promo code outline — expired |
| TC-006 | R-01 | Promo code outline — stacked-duplicate |
| TC-007 | R-01 | Full-discount boundary |
| TC-008 | R-04 | CVV/PAN not exposed on decline |
| TC-009 | R-05 | Injection pattern in promo field |

## Open items carried forward (not resolved, not fabricated)
- **TC-006**: Stacked/duplicate promo code business rule is **TBD** — the expected result asserts only the known invariant (single discount applied); exact numeric expectation needs a product decision before execution can yield a definitive Pass/Fail.
- **TC-007**: The payment gateway's exact minimum payable amount is **not specified** in the test basis; the case asserts the relationship only, not a numeric threshold.
- All sandbox test cards, promo codes, and stock states referenced are placeholders for tester-supplied sandbox data — no real card data or PII is to be used in execution or automation.

This draft requires tester review and approval before execution; no test case in this artifact is authorized for release on its own.