/**
 * GET /me — returns the authenticated user.
 * Pure read; no side effects. SRP.
 */
"use strict";

async function meRoute(app) {
  app.get("/me", { preHandler: [app.requireAuth] }, async (req) => req.user);
}

module.exports = meRoute;
