# Almas Amjad — Fragrances & Fabrics

Responsive, buildless ecommerce storefront. All requested pages are available through hash routes. Source is in `dist/`; there are no build dependencies. Serve `dist/` on any static web host with HTTPS. For local preview use `python3 -m http.server 8080 --directory dist` and visit http://localhost:8080.

## Current state
The site is a polished preview, not an operational shop. Catalogue, AED prices, product illustrations, sizing, shipping rates and policies are samples. Shopping bag persists locally; checkout customer details are not persisted by preview mode. Preview confirmation neither charges a customer nor submits an order. Contact and order inquiries prepare mailto drafts to waqasamjadrana@outlook.com; the visitor sends them in their email app. No automatic email delivery is claimed.

## Configure the brand
- Edit `dist/app.js` catalogue with actual prices, stock, dimensions, fabric composition, fragrance notes and licensed product photos. Replace `art()` illustrations with photos and accurate alt text.
- Set a business WhatsApp number in international digits in `dist/config.js` (e.g. country code plus number, without plus or spaces). The UI avoids inventing a contact number.
- Review shipping plans, refund rules, tax configuration, business identity/address and legal policies before enabling sales. Confirm gateway eligibility with your business entity.

## Stripe Checkout
Official references: https://docs.stripe.com/checkout/quickstart and https://docs.stripe.com/webhooks

1. Deploy a secure server endpoint using `integration/stripe-checkout.mjs`, install the official `stripe` server library and mount `createCheckout` at POST `/api/checkout`. This template is not deployed by the static Sites manifest. Host it separately or migrate to a server-enabled Sites project.
2. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and PUBLIC_ORIGIN in server-side hosting secrets. Never commit keys. Set STRIPE_WELCOME_COUPON_ID to a server-created 10% coupon or remove the sample promo from both sides. Replace sample catalogue with authoritative inventory and server-side prices; reserve/check stock, rate-limit requests, validate addresses, cap request size, and enforce origin/CORS rules.
3. Set public `checkoutEndpoint` in `dist/config.js` to the endpoint URL. Cross-origin endpoints need narrowly scoped CORS for your storefront origin. Customer-entered fields are transmitted to the endpoint; Stripe Checkout recollects and verifies the shipping address. Do not store card numbers.
4. Mount `stripeWebhook` at `/api/stripe-webhook`. Configure signed Stripe events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Provide a real `handlePaidOrder` implementation with durable order storage, a unique session ID, stock reconciliation and a transactional email queue. Send owner notifications to waqasamjadrana@outlook.com and receipts to the buyer through your configured email provider. Return failures for retry; never fulfill from a browser redirect.
5. Implement an authenticated order status endpoint that verifies the Stripe session belongs to the visitor before exposing order details. Replace preview confirmation handling with that endpoint. Clear the bag only after verified payment. Handle expired, cancelled, delayed and failed payments.
6. Test success, decline, 3DS, shipping, promo, duplicate webhook, delayed payment and refresh scenarios in test mode. Confirm taxes and shipping against your final operating rules before switching to live secrets.

## Payment Links / Telr / Tap / PayTabs
For a small fixed offering, an owner-created Stripe Payment Link can be added to an individual product page; a fixed link is not a substitute for the dynamic shopping bag. For alternative providers retain the same browser contract: POST item IDs, sizes, quantities and shipping to your server, return `{ "url": "https://provider-hosted-checkout…" }`. Create sessions and validate signed callbacks with the provider's current official SDK/API. Persist orders and notify by email only after verified payment. Keep all credentials and callback secrets on the server. These alternatives are architecture points, not connected gateways.

## Deployment
The private Sites preview uses `.openai/hosting.json` and `dist/` assets. For another static host, upload only `dist/`, attach your domain and enable HTTPS. Deploy server integration separately. Publish a public storefront only after replacing sample data, completing operational integrations and approving policy text. Private preview access is for the owner and cannot serve public customers.

## Validation
JavaScript syntax checks; responsive layout and browser flow should be checked at mobile and desktop widths. Before live launch also test real gateway sandbox and email delivery; those cannot be verified without your provider configuration.
