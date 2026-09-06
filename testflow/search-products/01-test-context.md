Persona: E-commerce Customer, Industry: E-commerce & Retail

# Domain Expertise: Mobile E-commerce Shopper (iOS Safari)

## 1. Testing Areas to Prioritise
- **Apple Pay checkout flow** — end-to-end payment sheet, biometric auth (Face ID/Touch ID), fallback to card entry
- **Mobile Safari rendering quirks** — viewport sizing, sticky headers/footers, address bar collapse/expand behavior affecting layout
- **Checkout speed/friction** — guest checkout, autofill (Safari AutoFill for address/card), minimal form fields, one-tap reorder
- **Real-time order tracking** — push notifications, live status updates, carrier tracking integration, webhook/polling reliability
- **Touch interaction & gestures** — swipe navigation, tap target sizing (min 44x44pt per Apple HIG), pinch-zoom on product images
- **Session persistence** — cart retention across app/browser switches, Safari Private Browsing mode, low-power mode impacts
- **Network resilience** — behavior on 4G/5G handoff, offline cart caching, spinner/timeout handling on slow connections
- **Add-to-Home-Screen (PWA) behavior** — if applicable, manifest icons, standalone mode navigation

## 2. Domain Terminology
1. **Apple Pay Sheet** — native iOS payment UI overlay for authorizing transactions
2. **Guest Checkout** — purchase flow without account creation
3. **SKU** — Stock Keeping Unit, unique product/variant identifier
4. **Cart Abandonment** — user adds items but exits before purchase
5. **PDP** — Product Detail Page
6. **PLP** — Product Listing Page
7. **Webhook** — server callback used for real-time order status updates
8. **Idempotency Key** — prevents duplicate order/payment submission on retry
9. **Tokenized Payment** — card data replaced with secure token (used in Apple Pay)
10. **Safe Area Insets** — iOS layout constraints avoiding notch/home indicator overlap
11. **AutoFill** — Safari's automatic form population from stored contact/payment data
12. **Order Status Webhook/Polling** — mechanism for live tracking updates
13. **Deep Link** — URL that opens a specific app/page state directly
14. **3D Secure (3DS)** — additional card authentication layer, may conflict with Apple Pay flow
15. **Buy Now Pay Later (BNPL)** — deferred payment option often shown alongside Apple Pay

## 3. Common Defect Patterns
- Apple Pay button fails to render or is unresponsive on certain iOS/Safari versions
- Checkout form fields misaligned or obscured by iOS keyboard/autofill overlay
- Order tracking shows stale status due to webhook delivery failure or polling delay
- Cart/session lost after backgrounding Safari or switching apps mid-checkout
- Double-charge or failed order due to missing idempotency handling on network retry/tap-double-submit

## 4. Compliance/Regulatory Requirements
- **PCI-DSS** — no raw card data touches app servers; validate tokenization via Apple Pay/PSP
- **Apple Pay Merchant Guidelines** — required domain verification, correct payment button styling per Apple HIG
- **GDPR/CCPA** — cart/session data, guest checkout PII handling, cookie consent banners
- **ADA/WCAG 2.1 AA** — tap target size, contrast, VoiceOver compatibility for checkout flow
- **SCA/PSD2** (if EU) — strong customer authentication compatibility with Apple Pay flow

## 5. Per-Stage Testing Focus Hints

- **Brainstorm**: List all iOS Safari–specific failure points (viewport, gestures, Apple Pay availability by region/device); consider network degradation and interruption scenarios.
- **Scenarios**: Cover guest vs. logged-in checkout, Apple Pay success/decline/cancel, order tracking from placement to delivery, app-switch mid-purchase.
- **Cases**: Detail exact iOS versions/devices, Safari settings (Private Mode, AutoFill on/off), expected payment sheet fields, real-time status update latency thresholds.
- **Automate**: Prioritize checkout regression (cart→payment→confirmation), API-level tests for order status webhooks, and visual regression for iOS Safari layout breakpoints; use device farms (BrowserStack/Sauce Labs) for real iOS Safari coverage—avoid relying solely on simulators for Apple Pay.