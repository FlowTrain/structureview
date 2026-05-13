/**
 * Backend runtime entry.
 *
 * Composition root for production: wires real adapters from env via wire(),
 * binds the Fastify app to a port, and registers signal handlers for
 * graceful shutdown.
 *
 * Per ADR-0006: Cosmos Mongo entitlements; ADR-0001: Clerk; ADR-0002: Stripe.
 * Adapters fall back to in-memory when env is not set, so local boot works
 * without secrets.
 */
"use strict";

/* istanbul ignore file -- runtime entry; covered by deploy smoke */

const { MongoClient } = require("mongodb");
const Stripe = require("stripe");
const clerk = require("@clerk/backend");
const { wire } = require("./wire");

async function main() {
  const { app, shutdown } = await wire({
    env: process.env,
    MongoClient: (uri) => new MongoClient(uri),
    clerk,
    StripeCtor: (key) => new Stripe(key),
  });

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "0.0.0.0";

  await app.listen({ port: PORT, host: HOST });

  const onSignal = async (signal) => {
    app.log.info({ signal }, "shutdown signal received");
    try {
      await shutdown();
      process.exit(0);
    } catch (err) {
      app.log.error(err, "shutdown failed");
      process.exit(1);
    }
  };
  process.on("SIGTERM", () => onSignal("SIGTERM"));
  process.on("SIGINT", () => onSignal("SIGINT"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Backend boot failed:", err);
  process.exit(1);
});
