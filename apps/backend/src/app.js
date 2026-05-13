"use strict";

const Fastify = require("fastify");
const { version } = require("../package.json");
const { createInMemoryAuth } = require("./adapters/in-memory-auth");
const {
  createInMemoryEntitlements,
} = require("./adapters/in-memory-entitlements");
const { createInMemoryBilling } = require("./adapters/in-memory-billing");
const requireAuth = require("./middleware/require-auth");
const meRoute = require("./routes/me");
const entitlementsRoute = require("./routes/entitlements");
const billingRoutes = require("./routes/billing");

function createApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? false });
  const auth = opts.auth ?? createInMemoryAuth();
  const entitlements = opts.entitlements ?? createInMemoryEntitlements();
  const billing = opts.billing ?? createInMemoryBilling();

  app.decorate("ports", { auth, entitlements, billing });
  app.decorate("requireAuth", requireAuth(auth));

  app.get("/health", async () => ({ status: "ok", version }));
  app.register(meRoute);
  app.register(entitlementsRoute);
  app.register(billingRoutes);

  return app;
}

module.exports = { createApp };
