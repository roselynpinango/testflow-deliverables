Persona: E-commerce Customer, Industry: Banking & Financial Services

# Domain Expertise: E-commerce Customer Persona — Banking & Financial Services Payment Integration

## Context
Testing scope: e-commerce customer journeys involving banking/financial services touchpoints — checkout payments, saved cards, bank transfers, BNPL, refunds, wallet top-ups, and account linking.

---

## 1. Testing Areas to Prioritise
- **Payment gateway integration** — card payments, net banking, UPI, wallets, BNPL flows at checkout
- **Transaction lifecycle accuracy** — authorization → capture → settlement → refund state consistency
- **Session & timeout handling** — payment page timeouts, OTP expiry, abandoned cart-to-payment recovery
- **Failure & retry handling** — declined transactions, insufficient funds, gateway timeouts, duplicate charge prevention
- **Refund & chargeback flows** — refund timelines, partial refunds, cancellation-triggered reversals
- **Saved payment instrument management** — tokenized card storage, CVV re-verification, card expiry handling
- **Cross-currency/multi-bank scenarios** — currency conversion display, bank-specific processing delays
- **Security & fraud checks** — 3D Secure/OTP flows, velocity checks, CVV masking, PCI data non-exposure in logs/UI

---

## 2. Domain Terminology
1. **Authorization** – Bank confirms funds are available/reserved, not yet debited.
2. **Capture** – Merchant finalizes the transaction to actually collect funds.
3. **Settlement** – Funds transfer from issuing bank to merchant's bank account.
4. **Chargeback** – Reversal initiated by cardholder's bank disputing a transaction.
5. **Tokenization** – Replacing card data with a non-sensitive token for storage/reuse.
6. **3D Secure (3DS)** – Additional authentication layer (OTP/password) for card payments.
7. **BNPL** – Buy Now Pay Later; deferred/installment payment option at checkout.
8. **Payment Gateway** – Intermediary service routing payment data between merchant and bank.
9. **Reconciliation** – Matching merchant transaction records with bank statements.
10. **CVV/CVC** – Card verification value; security code not stored post-transaction (PCI rule).
11. **Idempotency Key** – Unique identifier preventing duplicate transaction processing on retry.
12. **Payment Reversal** – Cancelling an authorized-but-not-settled transaction.
13. **Wallet Top-up** – Adding funds to a digital wallet linked to bank account/card.
14. **NPCI/UPI Handle** – Unified Payments Interface identifier for bank-linked instant transfers.
15. **Settlement Cycle (T+1/T+2)** – Time delay between transaction and fund availability to merchant.

---

## 3. Common Defect Patterns
- Duplicate debits on payment retry after timeout/network failure
- Refund initiated but not reflected in customer's bank statement within stated SLA
- Order confirmed despite payment failure (state mismatch between gateway and order system)
- CVV/card data exposed in logs, URLs, or error messages
- Currency/amount mismatch between cart total and actual bank debit

---

## 4. Compliance/Regulatory Requirements
- **PCI-DSS** — no raw card/CVV storage; masked display (first6/last4); secure transmission (TLS)
- **RBI guidelines (India)** or regional equivalent — mandatory 2FA/OTP for card transactions, tokenization mandate for saved cards
- **GDPR/data privacy** — consent for storing payment/financial data, right to erasure
- **AML/KYC checks** — flag unusual transaction patterns (large repeated purchases, mismatched billing/shipping)
- **Refund/cancellation SLA disclosures** — must match actual system behavior (legal/consumer protection compliance)

---

## 5. Per-Stage Testing Focus Hints

**Brainstorm:** Map all payment methods × failure points × currencies × device types; consider network drops mid-transaction, expired sessions, multi-tab checkout.

**Scenarios:** Cover full lifecycle per payment method (success/fail/timeout/retry/refund); include edge cases like partial refunds, split payments, expired saved cards.

**Cases:** Detail exact expected states at each step (UI message, backend order status, bank statement entry); include negative cases for security (CVV reuse, expired token, tampered amount).

**Automate:** Prioritize regression on payment status callbacks/webhooks, idempotency on retries, and masked-data validation in UI/logs; use sandbox/test bank credentials — never real card data in automation suites.