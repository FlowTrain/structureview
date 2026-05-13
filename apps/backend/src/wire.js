/**
 * wire — production composition root.
 *
 * Reads env, builds real adapters when env is configured, falls back
 * to in-memory adapters otherwise. Returns the Fastify app + a
 * shutdown function that releases external resources (Mongo client).
 *
 * DIP: every external SDK (MongoClient, clerk, Stripe ctor) is injected
 * so tests don't pull network or native dependencies.
 *
 * Per ADR-0006: entitlements live in Cosmos Mongo (vCore).
 * Per ADR-0001: auth via Clerk (backend SDK verifyToken).
 * Per ADR-0002: billing via Stripe (Checkout + webhooks).
 */
"use strict";

const { createApp } = require("./app");
const { createClerkAuth } = require("./adapters/clerk-auth");
const { createStripeBilling } = require("./adapters/stripe-billing");
const {
  createCosmosMongoEntitlements,
} = require("./adapters/cosmos-mongo-entitlements");

async function buildEntitlements({ env, MongoClient }) {
  if (!env.COSMOS_MONGO_CONNECTION_STRING || !env.COSMOS_DB_NAME) {
    return { entitlements: null, mongoClient: null };
  }
  const client = MongoClient(env.COSMOS_MONGO_CONNECTION_STRING);
  await client.connect();
  const collection = client
    .db(env.COSMOS_DB_NAME)
    .collection(env.COSMOS_ENTITLEMENTS_COLLECTION || "entitlements");
  await collection.createIndex({ userId: 1 }, { unique: true });
  return {
    entitlements: createCosmosMongoEntitlements({ collection }),
    mongoClient: client,
  };
}

function buildAuth({ env, clerk }) {
  if (!env.CLERK_SECRET_KEY) return null;
  return createClerkAuth({
    verifyToken: (token) =>
      clerk.verifyToken(token, { secretKey: env.CLERK_SECRET_KEY }),
  });
}

function buildBilling({ env, StripeCtor }) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return null;
  const stripe = StripeCtor(env.STRIPE_SECRET_KEY);
  return createStripeBilling({
    stripe,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    priceMap: {
      pro: env.STRIPE_PRICE_PRO,
      team: env.STRIPE_PRICE_TEAM,
    },
    successUrl: env.BILLING_SUCCESS_URL,
    cancelUrl: env.BILLING_CANCEL_URL,
  });
}

async function wire({ env, MongoClient, clerk, StripeCtor }) {
  const { entitlements, mongoClient } = await buildEntitlements({
    env,
    MongoClient,
  });
  const auth = buildAuth({ env, clerk });
  const billing = buildBilling({ env, StripeCtor });
  const app = createApp({
    logger: true,
    ...(auth ? { auth } : {}),
    ...(entitlements ? { entitlements } : {}),
    ...(billing ? { billing } : {}),
  });

  async function shutdown() {
    if (mongoClient) await mongoClient.close();
    await app.close();
  }

  return { app, shutdown };
}

module.exports = { wire };
