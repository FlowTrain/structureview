/**
 * CosmosMongoEntitlements — production EntitlementPort backed by
 * Azure Cosmos DB (MongoDB API, vCore SKU).
 *
 * Receives a Mongo `collection` object (DIP). Tests inject a fake;
 * production passes a real `MongoClient.db(...).collection(...)`.
 */
const {
  createCosmosMongoEntitlements,
} = require("../../src/adapters/cosmos-mongo-entitlements");
const { validateEntitlementPort } = require("../../src/ports/entitlement-port");

function fakeCollection(initialDocs = []) {
  const docs = new Map(initialDocs.map((d) => [d.userId, { ...d }]));
  return {
    docs,
    findOne: jest.fn(async (filter) => docs.get(filter.userId) || null),
    updateOne: jest.fn(async (filter, update, opts) => {
      const existing = docs.get(filter.userId);
      const next = {
        ...(existing || {}),
        ...filter,
        ...update.$set,
      };
      docs.set(filter.userId, next);
      return {
        acknowledged: true,
        modifiedCount: existing ? 1 : 0,
        upsertedCount: existing ? 0 : 1,
      };
    }),
  };
}

describe("CosmosMongoEntitlements", () => {
  test("satisfies EntitlementPort contract", () => {
    expect(() =>
      validateEntitlementPort(
        createCosmosMongoEntitlements({ collection: fakeCollection() }),
      ),
    ).not.toThrow();
  });

  test('id is "cosmos-mongo"', () => {
    expect(
      createCosmosMongoEntitlements({ collection: fakeCollection() }).id,
    ).toBe("cosmos-mongo");
  });

  test("throws at construction when collection is missing", () => {
    expect(() => createCosmosMongoEntitlements({})).toThrow(/collection/);
  });

  test("get() returns free entitlement for unknown user", async () => {
    const col = fakeCollection();
    const repo = createCosmosMongoEntitlements({ collection: col });
    expect(await repo.get("u_unknown")).toEqual({ tier: "free", features: [] });
    expect(col.findOne).toHaveBeenCalledWith({ userId: "u_unknown" });
  });

  test("get() returns the stored entitlement when present", async () => {
    const col = fakeCollection([
      { userId: "u_1", tier: "pro", features: ["timc-light"] },
    ]);
    const repo = createCosmosMongoEntitlements({ collection: col });
    expect(await repo.get("u_1")).toEqual({
      tier: "pro",
      features: ["timc-light"],
    });
  });

  test("get() normalises features to [] when missing on the doc", async () => {
    const col = fakeCollection([{ userId: "u_1", tier: "pro" }]);
    const repo = createCosmosMongoEntitlements({ collection: col });
    expect((await repo.get("u_1")).features).toEqual([]);
  });

  test("set() upserts (insert when new)", async () => {
    const col = fakeCollection();
    const repo = createCosmosMongoEntitlements({ collection: col });
    await repo.set("u_1", { tier: "pro", features: ["timc-light"] });
    expect(col.updateOne).toHaveBeenCalledWith(
      { userId: "u_1" },
      expect.objectContaining({
        $set: expect.objectContaining({
          tier: "pro",
          features: ["timc-light"],
        }),
      }),
      expect.objectContaining({ upsert: true }),
    );
  });

  test("set() includes an updatedAt ISO timestamp on the $set payload", async () => {
    const col = fakeCollection();
    const repo = createCosmosMongoEntitlements({ collection: col });
    const before = new Date().toISOString();
    await repo.set("u_1", { tier: "pro", features: [] });
    const call = col.updateOne.mock.calls[0];
    expect(call[1].$set.updatedAt).toBeDefined();
    expect(typeof call[1].$set.updatedAt).toBe("string");
    expect(call[1].$set.updatedAt >= before).toBe(true);
  });

  test("set() rejects an invalid tier", async () => {
    const repo = createCosmosMongoEntitlements({
      collection: fakeCollection(),
    });
    await expect(
      repo.set("u_1", { tier: "platinum", features: [] }),
    ).rejects.toThrow(/tier/);
  });

  test("get() returns free entitlement (graceful) when the collection throws", async () => {
    const col = {
      findOne: jest.fn(async () => {
        throw new Error("connection refused");
      }),
    };
    const repo = createCosmosMongoEntitlements({ collection: col });
    expect(await repo.get("u_1")).toEqual({ tier: "free", features: [] });
  });

  test("set() rethrows on collection error (caller must know writes failed)", async () => {
    const col = {
      updateOne: jest.fn(async () => {
        throw new Error("rate limit");
      }),
    };
    const repo = createCosmosMongoEntitlements({ collection: col });
    await expect(
      repo.set("u_1", { tier: "pro", features: [] }),
    ).rejects.toThrow(/rate limit/);
  });
});
