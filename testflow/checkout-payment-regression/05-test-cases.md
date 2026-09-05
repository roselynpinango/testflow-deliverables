# Test Cases

**Test Basis:** Approved Scenarios Artifact — Feature: Checkout Payment Amount Integrity and Lifecycle Consistency
**Risk Register:** R-01–R-05 (as supplied)

---

| ID | Area | Title | Preconditions | Steps | Expected Result | Risk | Type | Status |
|----|------|-------|---------------|-------|----------------|------|------|--------|
| TC-001 | Payment Amount Integrity | Gateway authorization amount matches displayed cart total after promo + stock recalculation | Customer has an active authenticated checkout session; cart contains promo-eligible, stock-tracked items | 1. Apply a valid promo code to the cart. 2. Trigger a stock adjustment that causes cart subtotal recalculation. 3. Proceed to payment authorization. | Gateway authorization amount equals the recalculated cart total displayed to the customer, exact to the cent; no discrepancy between displayed total and authorized amount is recorded in the transaction record | Critical | Functional | Pending |
| TC-002 | Order Lifecycle / Payment State Consistency | Payment stays authorized-not-captured and order enters pending-fulfillment-review when stock depletes mid-authorization | Customer has initiated payment authorization for an item with limited stock; stock is available at initiation | 1. Initiate payment authorization for the limited-stock item. 2. Have a concurrent transaction deplete the item's stock before authorization completes. 3. Observe payment status, stock hold, and order status after authorization completes. | Payment status = "authorized" (not "captured"); stock hold for the item is released; order status reflects a pending-fulfillment-review state, not "confirmed" (exact state label TBD — pending confirmation of stock validation timing model per Test Plan open item) | Critical | Negative | Pending |
| TC-003 | Order Lifecycle | Gateway callback "success" transitions order to "confirmed" | An order exists with an authorized payment awaiting a gateway callback | 1. Trigger a gateway callback with status "success" for the order. 2. Observe order lifecycle state. | Order lifecycle state updates to "confirmed" | High | Functional | Pending |
| TC-004 | Order Lifecycle | Gateway callback "failure" transitions order to "payment_failed" | An order exists with an authorized payment awaiting a gateway callback | 1. Trigger a gateway callback with status "failure" for the order. 2. Observe order lifecycle state. | Order lifecycle state updates to "payment_failed" | High | Negative | Pending |
| TC-005 | Order Lifecycle | Gateway callback "timeout" transitions order to "pending_retry" | An order exists with an authorized payment awaiting a gateway callback | 1. Trigger a gateway callback with status "timeout" for the order. 2. Observe order lifecycle state. | Order lifecycle state updates to "pending_retry" | High | Negative | Pending |
| TC-006 | Security | Decline error response masks card data to first6/last4 with no CVV in body or logs | Customer submits a card payment configured to result in a gateway decline; application logging is enabled for the transaction | 1. Submit a card payment using a test card that triggers a gateway decline. 2. Capture the error response returned to the customer. 3. Inspect the application log entry for the same transaction. | Response body shows only the first six and last four digits of the card number; no CVV value appears in the response body; the application log for this transaction contains no full card number and no CVV | High | Negative | Pending |
| TC-007 | Security | Expired session token is rejected on payment submission | Customer's checkout session token has expired due to inactivity | 1. Allow the checkout session token to expire (inactivity timeout reached). 2. Submit a payment request using the expired token. | Checkout service rejects the request with an authentication error (exact status code/message not specified in basis — TBD); no payment authorization record is created for this request | High | Negative | Pending |
| TC-008 | Payment Amount Integrity | Recalculated price after cart change matches UI display and captured payment amount | Customer has applied a promo code to the cart; cart contains an item that can become unavailable | 1. Apply promo code to cart. 2. Mark an item in the cart unavailable, triggering cart total recalculation. 3. Proceed to payment capture. | UI displays the recalculated total; amount captured by the payment gateway equals the recalculated total displayed, exact match | Medium | Functional | Pending |
| TC-009 | Payment Amount Integrity | Minimum chargeable amount after maximum promo discount is accepted by the gateway | A promo code reduces the cart total to the smallest chargeable currency unit | 1. Apply the promo code reducing cart total to the minimum chargeable unit. 2. Submit payment for this amount. | Gateway authorization succeeds for the minimum chargeable amount; order total displayed matches the amount authorized, exact match | Critical | Boundary | Pending |

> **Risk key:** Critical / High / Medium / Low — inherited from the corresponding scenario's `@risk-…` tag / risk register row (R-01…R-05).

---

**Traceability:**
- TC-001 → Scenario 1 → R-01
- TC-002 → Scenario 2 → R-02
- TC-003/004/005 → Scenario 3 (outline) → R-04
- TC-006 → Scenario 4 → R-03
- TC-007 → Scenario 5 → R-03
- TC-008 → Scenario 6 → R-05
- TC-009 → Scenario 7 → R-01

**Coverage gap (flagged, not fabricated):**
Per the "≥1 negative test case per functional area" requirement — the **Payment Amount Integrity** area (TC-001, TC-008, TC-009) currently has no negative test case in the approved scenario basis (e.g., a tampered/mismatched-amount submission). The scenarios artifact notes this as an open item: *"Promo validation location (client/server) — affects whether a tamper-input security scenario should be added later; marked TBD."* No case has been invented here to close this gap; it should be resolved at the Scenarios stage once that TBD is settled.

**Other open items inherited from the scenario basis (unresolved here):**
- Sandbox gateway credentials/test card availability — required before any of these cases can be executed.
- Stock validation timing model (pre-auth hold vs. post-capture) — affects the exact state label asserted in TC-002.

This is a draft artifact for tester review; no test case here is approved or authorized for execution until a human reviewer signs off.