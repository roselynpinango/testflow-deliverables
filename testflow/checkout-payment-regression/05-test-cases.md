# Test Cases

---

| ID | Area | Title | Preconditions | Steps | Expected Result | Risk | Type | Status |
|----|------|-------|---------------|-------|------------------|------|------|--------|
| TC-001 | Payment Authorization | Order confirmed when gateway returns approved authorization | Cart is validated for current stock and price; customer is on checkout page using sandbox test payment credentials; cart total is a valid positive amount | 1. Submit payment for the cart total 2. Payment gateway returns an approved authorization response 3. Observe order status and charge records | Order status is set to "Confirmed"; exactly one charge record exists for the authorized amount equal to the cart total | Critical | Functional | Pending |
| TC-002 | Payment Authorization | No order created when gateway returns a declined response | Same as TC-001 | 1. Submit payment for the cart total 2. Payment gateway returns a declined response 3. Observe order creation and displayed message | No order record is created; customer sees a generic payment declined message (no gateway-specific error detail) | Critical | Negative | Pending |
| TC-003 | Payment Authorization | No order created when gateway authorization times out | Same as TC-001 | 1. Submit payment for the cart total 2. Payment gateway returns a timeout (no response within gateway timeout window) 3. Observe order creation and displayed message | No order record is created; customer sees a generic payment timeout message | Critical | Negative | Pending |
| TC-004 | Stock Validation | Payment authorization reversed when stock depletes before capture | Payment has been authorized for a cart item currently in stock (quantity ≥ 1); capture step has not yet executed | 1. Reduce the authorized item's stock to zero (test data) prior to capture 2. Allow the capture step to execute 3. Observe authorization state and customer-facing message | Payment authorization is reversed (authorization status = "Reversed"; no capture executed); customer sees a message stating the item is no longer available | High | Negative | Pending |
| TC-005 | Promo / Capture Amount | Capture amount floors at zero when promo discount equals cart subtotal | Cart subtotal is a known positive value; a promo code exists whose discount value equals the cart subtotal exactly | 1. Apply the promo code to the cart 2. Proceed to the checkout capture step 3. Inspect the amount submitted to the payment gateway for capture | Amount submitted for capture equals 0 (recalculated cart total); no negative amount is ever submitted to the payment gateway | High | Boundary | Pending |
| TC-006 | Idempotency / Retry | Retrying a timed-out payment with the same idempotency key does not duplicate charge | Customer submits payment using a unique idempotency key; initial payment request results in a timeout with no confirmed authorization | 1. Submit payment for the cart total with idempotency key X 2. Simulate a timeout on the first request 3. Retry payment submission using the same idempotency key X 4. Inspect charge and order records created | Exactly one charge record exists for the cart total; exactly one order record exists; no duplicate charge or order is created | High | Regression | Pending |
| TC-007 | Data Masking (Security) | Card number and CVV are never exposed after a completed payment | Customer has completed a card payment using sandbox test credentials | 1. Complete a card payment successfully 2. Inspect the API response payload returned to the client 3. Inspect the UI, including any error/confirmation state 4. Inspect application logs generated during the transaction | Card number appears only as masked first6/last4 in API response, UI, and logs; CVV value is absent from API response, UI, and log output | Medium | Negative | Pending |
| TC-008 | Promo Input Validation (Security) | Promo code field rejects oversized input | Customer is on checkout page with promo code field visible; field's maximum accepted length is TBD — not specified in the test basis | 1. Enter a string exceeding the promo code field's maximum length into the field 2. Submit the promo code 3. Inspect the system's response and any error output | System returns a generic invalid-code error; no backend stack trace or internal error detail is exposed | Medium | Negative | Pending |
| TC-009 | Promo Input Validation (Security) | Promo code field rejects SQL injection pattern input | Same as TC-008 | 1. Enter the pattern `' OR '1'='1` into the promo code field 2. Submit the promo code 3. Inspect the system's response and any error output | System returns a generic invalid-code error; no backend stack trace or SQL error detail is exposed | Medium | Negative | Pending |
| TC-010 | Promo Input Validation (Security) | Promo code field rejects script injection pattern input | Same as TC-008 | 1. Enter the pattern `<script>alert(1)</script>` into the promo code field 2. Submit the promo code 3. Inspect the rendered page and any error output | System returns a generic invalid-code error; the script is not executed/rendered in the UI; no backend stack trace or internal error detail is exposed | Medium | Negative | Pending |

> **Risk key:** Critical / High / Medium / Low — inherited from the scenario's `@risk-…` tag / risk register row it covers.

---

**Coverage notes (for tester review):**
- TC-001 → R-01 (positive path); TC-002/TC-003 → R-01 (negative pair, declined/timeout).
- TC-004 → R-02 (stock depleted before capture).
- TC-005 → R-03 (boundary: discount = subtotal, capture floor at zero).
- TC-006 → R-04 (idempotency retry, reliability).
- TC-007 → R-05 (data masking, security).
- TC-008/TC-009/TC-010 → R-06 (promo input validation: oversized, SQL injection, script injection).
- Quality gate check: ≥1 negative case per functional area — satisfied for Payment Authorization, Stock Validation, Data Masking, and Promo Input Validation. **Open gap:** the Promo/Capture Amount area (TC-005) and Idempotency/Retry area (TC-006) currently have no dedicated negative-type case in the approved scenario basis; flagging this as an open item rather than fabricating a scenario not present in the test basis.

**Open items carried forward (unresolved, not fabricated):**
- Promo code field's exact maximum length — TBD, not specified in the test basis (affects TC-008 step 1 data value).
- 3D Secure/OTP step inclusion — TBD; no test case added pending scope confirmation.
- Promo code stacking rules — not specified; TC-005 assumes a single promo code only.

This draft is for tester review — it is not an approved or authoritative artifact until you sign off on it.