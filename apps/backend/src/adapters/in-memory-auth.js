/**
 * InMemoryAuthAdapter — test-only AuthPort.
 *
 * Used by:
 *   - Unit tests that exercise routes/middleware without booting Clerk
 *   - Local dev environment when CLERK_SECRET_KEY isn't set
 *
 * Production wiring (ClerkAdapter) lands in sub-batch 9.1.
 */
"use strict";

function createInMemoryAuth({ seed = {} } = {}) {
  const tokens = new Map(Object.entries(seed));

  return {
    id: "in-memory",
    seed(token, user) {
      tokens.set(token, user);
    },
    async validateSessionToken(token) {
      if (!token) return null;
      return tokens.get(token) || null;
    },
  };
}

module.exports = { createInMemoryAuth };
