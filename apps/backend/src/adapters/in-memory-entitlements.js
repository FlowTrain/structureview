/**
 * InMemoryEntitlements — test/dev EntitlementPort backed by a Map.
 * Production adapter (Postgres) lands in a later batch when DB is provisioned.
 */
"use strict";

const VALID_TIERS = new Set(["free", "pro", "team"]);
const FREE_ENTITLEMENT = Object.freeze({ tier: "free", features: [] });

function createInMemoryEntitlements({ seed = {} } = {}) {
  const store = new Map(Object.entries(seed));
  return {
    id: "in-memory",
    async get(userId) {
      return store.get(userId) || FREE_ENTITLEMENT;
    },
    async set(userId, entitlement) {
      if (!VALID_TIERS.has(entitlement.tier)) {
        throw new Error(`Invalid tier: ${entitlement.tier}`);
      }
      store.set(userId, { ...entitlement });
    },
  };
}

module.exports = { createInMemoryEntitlements };
