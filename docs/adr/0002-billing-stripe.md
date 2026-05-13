# ADR-0002 — Billing provider: Stripe

- **Status:** Accepted
- **Date:** 2026-05-12
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

Phase 2 introduces paid subscriptions: StructureView Lite, Pro, Team.
Per the brief, the upgrade path also funnels users into Quality Guardian
Team / Enterprise. The billing provider must handle:

1. Subscription create / upgrade / cancel
2. Trial periods
3. Webhook-driven entitlement updates (single source of truth)
4. Receipts, dunning, payment method updates

## Options considered

| Option       | Pros                                                                                                              | Cons                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Stripe       | Industry standard; mature webhooks; clean Checkout flow; Customer Portal handles self-serve management; rich docs | US-centric tax handling; team must handle VAT for non-US |
| Paddle       | Merchant of Record — handles VAT/sales tax globally                                                               | Higher fees; smaller dev ecosystem                       |
| LemonSqueezy | MoR like Paddle; indie-friendly                                                                                   | Newer; less integration tooling; SDK gaps                |

## Decision

Use **Stripe** for billing.

Implementation notes:

- Stripe Checkout for new subscriptions (no custom payment forms).
- Stripe Customer Portal for self-serve cancellation, plan change,
  invoice access.
- Webhooks land at the backend (ADR-0003) and update the `entitlements`
  table. The Electron client never reads Stripe directly.
- Code depends on a `BillingPort` interface (DIP). `StripeAdapter` is
  the only concrete implementation.

## Consequences

- **Positive:** Fastest path to revenue. Checkout and Portal remove
  months of UI work.
- **Positive:** Entitlement source-of-truth is the backend, not Stripe
  directly — the client cannot be tricked by tampered Stripe responses.
- **Negative:** Stripe is not a Merchant of Record. The team must handle
  sales tax / VAT collection. Mitigation: Stripe Tax add-on (paid)
  or limit initial launch to jurisdictions we can serve.
- **Negative:** Stripe outage = no new subscriptions. Mitigation: webhook
  retry, idempotent handlers, status page subscription.

## Revisit triggers

- Cross-border tax becomes operationally heavy (consider Paddle migration)
- Stripe pricing inflection at scale
