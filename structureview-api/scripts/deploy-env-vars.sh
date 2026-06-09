#!/usr/bin/env bash
# Wire Clerk and Stripe env vars into the Azure Container App.
#
# Prerequisites:
#   az login (or az login --use-device-code)
#   All variables below exported in your shell (never commit real values)
#
# Usage:
#   export CONTAINER_APP_NAME=structureview-api
#   export RESOURCE_GROUP=structureview-rg
#   export CLERK_SECRET_KEY=sk_live_...
#   export CLERK_PUBLISHABLE_KEY=pk_live_...
#   export STRIPE_SECRET_KEY=sk_live_...
#   export STRIPE_WEBHOOK_SECRET=whsec_...
#   export STRIPE_PRICE_ID_PRO=price_...
#   bash scripts/deploy-env-vars.sh

set -euo pipefail

: "${CONTAINER_APP_NAME:?CONTAINER_APP_NAME is required}"
: "${RESOURCE_GROUP:?RESOURCE_GROUP is required}"
: "${CLERK_SECRET_KEY:?CLERK_SECRET_KEY is required}"
: "${STRIPE_SECRET_KEY:?STRIPE_SECRET_KEY is required}"
: "${STRIPE_WEBHOOK_SECRET:?STRIPE_WEBHOOK_SECRET is required}"
: "${STRIPE_PRICE_ID_PRO:?STRIPE_PRICE_ID_PRO is required}"

echo "Updating env vars on $CONTAINER_APP_NAME ($RESOURCE_GROUP)..."

az containerapp update \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars \
    "CLERK_SECRET_KEY=secretref:clerk-secret-key" \
    "CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY:-}" \
    "STRIPE_SECRET_KEY=secretref:stripe-secret-key" \
    "STRIPE_WEBHOOK_SECRET=secretref:stripe-webhook-secret" \
    "STRIPE_PRICE_ID_PRO=${STRIPE_PRICE_ID_PRO}" \
    "PORT=3000"

# Store secrets (Azure Container Apps secrets store)
az containerapp secret set \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --secrets \
    "clerk-secret-key=${CLERK_SECRET_KEY}" \
    "stripe-secret-key=${STRIPE_SECRET_KEY}" \
    "stripe-webhook-secret=${STRIPE_WEBHOOK_SECRET}"

echo "Done. Restart the revision for changes to take effect:"
echo "  az containerapp revision restart --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --revision \$(az containerapp revision list --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query '[0].name' -o tsv)"
