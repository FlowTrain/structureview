# ADR-0003 — Backend service: Node + Fastify on a managed platform

- **Status:** Accepted (persistence section superseded by ADR-0006)
- **Date:** 2026-05-12
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

Phase 2 requires a small backend to:

1. Validate Clerk session tokens (ADR-0001)
2. Receive Stripe webhooks (ADR-0002)
3. Read/write entitlements (the source of truth for paid features)
4. Serve the `/me` and `/entitlements/:userId` endpoints to the
   Electron client

This surface is intentionally tiny. Anything bigger lives behind a feature
flag.

## Options considered

| Option             | Pros                                                                                       | Cons                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Node + Fastify     | Same JS toolchain as renderer; lightweight; fast; first-class async; rich plugin ecosystem | Less batteries-included than Nest                       |
| NestJS             | Strong conventions; DI built in                                                            | Heavier; learning curve; overkill for this surface      |
| Cloudflare Workers | Edge-cheap; global; great DX                                                               | Stripe webhook idempotency requires care; Node API gaps |
| Go (Echo / Fiber)  | Cheap to run; fast                                                                         | Adds a second language to the toolchain                 |

## Decision

**Node 20 + Fastify** on a managed platform (Render, Fly.io, or
Cloudflare equivalent — exact host deferred to ops batch).

Architectural notes:

- Single repo, deployed as `apps/backend/` adjacent to the Electron app.
- Routes thin; behaviour in services. Services depend on ports
  (`AuthPort`, `BillingPort`, `EntitlementPort` — see ADR-0005 pattern).
- Persistence: managed Postgres (host TBD), single `entitlements` table
  to start.
- Test stack: Vitest or Jest + `supertest`. Mocks at the port boundary,
  not at HTTP.

## Consequences

- **Positive:** Same language across client and server reduces context
  cost.
- **Positive:** Fastify's schema-driven JSON validation provides a free
  layer of defence at the API boundary.
- **Negative:** Adds an additional deployable service to operate
  (vs. serverless).
- **Negative:** Stripe webhook delivery guarantees require careful
  idempotency. Handler must dedupe on event id.

## Revisit triggers

- Backend RPS sustainably > 1k (consider edge alternative)
- Need for non-Node service (data pipelines for TIMC Light, ML)
