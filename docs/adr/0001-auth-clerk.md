# ADR-0001 — Authentication provider: Clerk

- **Status:** Accepted
- **Date:** 2026-05-12
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

StructureView's Phase 2 introduces paid tiers (StructureView Lite, Pro,
Team) per the brief. Each requires:

1. Identity (who is signed in)
2. Session persistence across desktop app launches
3. Entitlement lookups (is this user on a paid tier?)
4. Future browser/SaaS frontend that shares the same identity

The Electron desktop client cannot safely hold license state on its own —
any local-only entitlement check can be tampered with.

## Options considered

| Option             | Pros                                                                                                                   | Cons                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Clerk              | Fast time-to-prod; first-class Node + web SDKs; built-in MFA, social, magic-link; OS keychain integration via `keytar` | Pricing scales with MAU; vendor lock-in for identity    |
| Auth0              | Enterprise-ready; mature                                                                                               | Heavier API; harder Electron flow; pricier at low MAU   |
| Supabase Auth      | Postgres-backed; row-level security pairs well with entitlements                                                       | Couples identity to a specific DB; weaker desktop story |
| Build it ourselves | Zero vendor cost; full control                                                                                         | Months of work; security risk; not the differentiator   |

## Decision

Use **Clerk** as the identity provider for both the Electron desktop
client and any future SaaS frontend.

Implementation notes:

- Identity bridge runs in a `BrowserWindow` pointed at the hosted Clerk
  sign-in URL.
- Session token persisted via OS keychain (`keytar`) — never localStorage.
- Application code depends on an `AuthPort` interface (DIP); `ClerkAdapter`
  is the only concrete implementation. Tests use an `InMemoryAuthAdapter`.

## Consequences

- **Positive:** Phase 2 unblocks immediately. MFA, social, magic-link
  available without additional implementation cost.
- **Positive:** SaaS frontend reuses the same identity layer with no
  rework when Phase 4 ships.
- **Negative:** Recurring per-MAU cost. Mitigation: monitor MAU once over
  the free tier; revisit at scale.
- **Negative:** Identity layer is now a hard external dependency.
  Mitigation: `AuthPort` abstraction makes replacement a one-adapter swap.

## Revisit triggers

- MAU > 10,000 (Clerk pricing inflection)
- Need for self-hosted identity (regulated customer)
- Significant security incident at Clerk
