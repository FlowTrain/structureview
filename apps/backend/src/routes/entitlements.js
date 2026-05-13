/** GET /entitlements — reads the entitlement for req.user via EntitlementPort. */
"use strict";

async function entitlementsRoute(app) {
  app.get("/entitlements", { preHandler: [app.requireAuth] }, async (req) => {
    return app.ports.entitlements.get(req.user.userId);
  });
}

module.exports = entitlementsRoute;
