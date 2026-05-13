# Deploying the StructureView backend to Azure Container Apps

Per ADR-0003 (host) and ADR-0006 (persistence).

## Prerequisites

- Azure CLI installed and logged in: `az login`
- Subscription set: `az account set --subscription <id>`
- Resource group exists (use the existing `ccqg-metrics-dev` for dev, or
  create a dedicated one for prod):
  ```bash
  az group create -n structureview-prod -l eastus
  ```
- Azure Container Registry exists:
  ```bash
  az acr create -g structureview-prod -n svacr --sku Basic --admin-enabled true
  ```
- Cosmos DB for MongoDB (vCore) cluster exists. The connection string lives
  under the cluster's "Connection strings" blade.

## Database setup

The backend ensures a `{ userId: 1 }` unique index on first connection,
so no migration step is required. Database + collection are created
implicitly on first write.

For dev, point at the existing `ccqg-dev-cosmos-mongo` cluster with
`COSMOS_DB_NAME=structureview-dev` (separate logical DB inside the
shared cluster).

## Build + push the image

```bash
cd apps/backend
az acr login -n svacr
docker build -t svacr.azurecr.io/structureview-backend:$(git rev-parse --short HEAD) .
docker push svacr.azurecr.io/structureview-backend:$(git rev-parse --short HEAD)
```

## Container Apps environment (one-time)

```bash
az containerapp env create \
  -g structureview-prod \
  -n structureview-env \
  -l eastus
```

## Deploy the app

```bash
# Image tag from the build step above
TAG=$(git rev-parse --short HEAD)

az containerapp create \
  -g structureview-prod \
  -n structureview-backend \
  --environment structureview-env \
  --image svacr.azurecr.io/structureview-backend:$TAG \
  --registry-server svacr.azurecr.io \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 --memory 1Gi \
  --secrets \
    cosmos-conn=$COSMOS_MONGO_CONNECTION_STRING \
    clerk-secret=$CLERK_SECRET_KEY \
    stripe-secret=$STRIPE_SECRET_KEY \
    stripe-webhook-secret=$STRIPE_WEBHOOK_SECRET \
  --env-vars \
    NODE_ENV=production \
    COSMOS_MONGO_CONNECTION_STRING=secretref:cosmos-conn \
    COSMOS_DB_NAME=structureview \
    CLERK_SECRET_KEY=secretref:clerk-secret \
    STRIPE_SECRET_KEY=secretref:stripe-secret \
    STRIPE_WEBHOOK_SECRET=secretref:stripe-webhook-secret \
    STRIPE_PRICE_PRO=$STRIPE_PRICE_PRO \
    STRIPE_PRICE_TEAM=$STRIPE_PRICE_TEAM \
    BILLING_SUCCESS_URL=$BILLING_SUCCESS_URL \
    BILLING_CANCEL_URL=$BILLING_CANCEL_URL
```

## Subsequent updates

```bash
TAG=$(git rev-parse --short HEAD)
az containerapp update \
  -g structureview-prod \
  -n structureview-backend \
  --image svacr.azurecr.io/structureview-backend:$TAG
```

## Stripe webhook configuration

After the Container App is live, grab its external FQDN:

```bash
az containerapp show -g structureview-prod -n structureview-backend \
  --query "properties.configuration.ingress.fqdn" -o tsv
```

Then in the Stripe dashboard, add a webhook endpoint pointing at
`https://<fqdn>/webhooks/billing` and store the signing secret in the
Container App secret `stripe-webhook-secret` (used by `verifyWebhookSignature`).

## Smoke after deploy

```bash
FQDN=$(az containerapp show -g structureview-prod -n structureview-backend \
  --query "properties.configuration.ingress.fqdn" -o tsv)
curl "https://$FQDN/health"
# {"status":"ok","version":"..."}
```

## Key Vault (later hardening)

For Phase 4 release engineering: replace inline secrets with Key Vault
references (`secretref` pointing at `keyvaultref://...`). Not required
for closed beta but worth doing before any external customers land.
