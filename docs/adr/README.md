# Architecture Decision Records

Per Practice 4 (Collaborate). Each ADR captures one significant
architectural decision, the options considered, and the consequences.

ADRs are append-only. To change a past decision, write a new ADR that
supersedes the old one.

## Index

| # | Status | Title |
|---|---|---|
| [0001](./0001-auth-clerk.md) | Accepted | Authentication provider: Clerk |
| [0002](./0002-billing-stripe.md) | Accepted | Billing provider: Stripe |
| [0003](./0003-backend-fastify.md) | Accepted (persistence § superseded by 0006) | Backend service: Node + Fastify |
| [0004](./0004-design-system-tokens-first.md) | Accepted | Design system structure: tokens-first |
| [0005](./0005-multi-format-parsers-port-adapter.md) | Accepted | Multi-format parser architecture: port + adapter |
| [0006](./0006-polyglot-persistence-azure.md) | Accepted | Polyglot persistence on Azure (Cosmos Mongo vCore + Postgres) |

## Format

Michael Nygard's classic template: Status / Date / Authors / Context /
Options considered / Decision / Consequences / Revisit triggers.
