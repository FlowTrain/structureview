/**
 * CosmosMongoEntitlements — production EntitlementPort backed by
 * Azure Cosmos DB for MongoDB (vCore SKU). Per ADR-0006.
 *
 * Receives a Mongo `collection` object (DIP). Production wiring lives
 * in apps/backend/src/index.js:
 *
 *   const client = new MongoClient(process.env.COSMOS_MONGO_CONNECTION_STRING);
 *   await client.connect();
 *   const collection = client.db(process.env.COSMOS_DB_NAME)
 *                            .collection('entitlements');
 *   const entitlements = createCosmosMongoEntitlements({ collection });
 *
 * Document shape:
 *   {
 *     userId:    string  (indexed unique, also the natural Mongo _id key)
 *     tier:      'free' | 'pro' | 'team'
 *     features:  string[]
 *     updatedAt: ISO-8601 string
 *   }
 *
 * Schema migration: ensure a unique index on { userId: 1 } at startup.
 * Done in production index.js, not here (SRP — adapter only does CRUD).
 */
"use strict";

const VALID_TIERS = new Set(["free", "pro", "team"]);
const FREE_ENTITLEMENT = Object.freeze({ tier: "free", features: [] });

function createCosmosMongoEntitlements({ collection } = {}) {
  if (!collection) {
    throw new Error("createCosmosMongoEntitlements: collection is required");
  }

  async function get(userId) {
    let doc;
    try {
      doc = await collection.findOne({ userId });
    } catch {
      return FREE_ENTITLEMENT;
    }
    if (!doc) return FREE_ENTITLEMENT;
    return {
      tier: doc.tier,
      features: Array.isArray(doc.features) ? doc.features : [],
    };
  }

  async function set(userId, entitlement) {
    if (!VALID_TIERS.has(entitlement.tier)) {
      throw new Error(`Invalid tier: ${entitlement.tier}`);
    }
    await collection.updateOne(
      { userId },
      {
        $set: {
          tier: entitlement.tier,
          features: entitlement.features || [],
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true },
    );
  }

  return { id: "cosmos-mongo", get, set };
}

module.exports = { createCosmosMongoEntitlements };
