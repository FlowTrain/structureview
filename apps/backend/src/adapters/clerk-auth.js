/**
 * ClerkAdapter — production AuthPort backed by Clerk session verification.
 *
 * Receives a `verifyToken(token) → Promise<claims|null>` function (DIP).
 * Production wiring (in apps/backend/src/index.js, sub-batch 9.x):
 *
 *   const { verifyToken } = require('@clerk/clerk-sdk-node');
 *   const auth = createClerkAuth({
 *     verifyToken: (t) => verifyToken(t, { secretKey: process.env.CLERK_SECRET_KEY }),
 *   });
 *
 * Failures (expired token, wrong issuer, signature mismatch) are folded
 * into a null return so callers treat them uniformly.
 */
"use strict";

function createClerkAuth({ verifyToken } = {}) {
  if (typeof verifyToken !== "function") {
    throw new Error("createClerkAuth: verifyToken function is required");
  }

  return {
    id: "clerk",
    async validateSessionToken(token) {
      if (!token) return null;
      let claims;
      try {
        claims = await verifyToken(token);
      } catch {
        return null;
      }
      if (!claims || !claims.sub) return null;
      const user = { userId: claims.sub };
      if (claims.email) user.email = claims.email;
      return user;
    },
  };
}

module.exports = { createClerkAuth };
