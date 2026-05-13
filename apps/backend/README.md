# StructureView Backend

Fastify service for auth, entitlements, and billing. Per ADRs:

- [ADR-0001](../../docs/adr/0001-auth-clerk.md) — Auth via Clerk
- [ADR-0002](../../docs/adr/0002-billing-stripe.md) — Billing via Stripe
- [ADR-0003](../../docs/adr/0003-backend-fastify.md) — Backend service shape
- [ADR-0006](../../docs/adr/0006-polyglot-persistence-azure.md) — Polyglot persistence

## Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET  | `/health` | none | Health probe (status, version) |
| GET  | `/me` | bearer | Current authenticated user |
| GET  | `/entitlements` | bearer | Tier + features for current user |
| POST | `/billing/checkout` | bearer | Create Stripe Checkout session for `{plan}` |
| POST | `/webhooks/billing` | Stripe sig | Receive Stripe webhooks; write entitlements |

## Environment

Adapters fall back to in-memory when env is missing, so the app boots
locally without secrets. For production all of these must be set:

| Variable | Notes |
|---|---|
| `PORT` | Default 3000 |
| `HOST` | Default `0.0.0.0` |
| `COSMOS_MONGO_CONNECTION_STRING` | Cosmos DB for MongoDB (vCore) connection string |
| `COSMOS_DB_NAME` | Database name, e.g. `structureview` |
| `COSMOS_ENTITLEMENTS_COLLECTION` | Default `entitlements` |
| `CLERK_SECRET_KEY` | `sk_test_*` or `sk_live_*` |
| `STRIPE_SECRET_KEY` | `sk_test_*` or `sk_live_*` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_*` |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro plan |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for the Team plan |
| `BILLING_SUCCESS_URL` | Where Stripe sends the user after checkout success |
| `BILLING_CANCEL_URL` | Where Stripe sends the user after cancel |

In Azure Container Apps, set these as **secrets** + environment variables.
Never commit them.

## Local development

```bash
npm install
npm run dev            # auto-restart on file changes
npm run quality-gate   # lint + tests + coverage (CCQG soft-block policy)
```

Health check:

```bash
curl http://localhost:3000/health
# {"status":"ok","version":"0.1.0"}
```

## Deploy to Azure Container Apps

See [`infra/deploy.md`](../../infra/deploy.md) for the `az` CLI flow.

## Docker

```bash
docker build -t structureview-backend .
docker run -p 3000:3000 --env-file .env structureview-backend
```
