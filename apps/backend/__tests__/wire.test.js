/**
 * wire — production composition root.
 *
 * Reads env, constructs real adapters (Cosmos Mongo entitlements,
 * Clerk auth, Stripe billing) when their env is set, falls back to
 * in-memory adapters otherwise. Returns a Fastify app + a shutdown()
 * function that closes the Mongo client.
 *
 * DIP: SDK factories are injected so tests don't pull network deps.
 */
const { wire } = require("../src/wire");

function fakeMongo() {
  const client = {
    connect: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        createIndex: jest.fn(async () => "userId_1"),
        findOne: jest.fn(async () => null),
        updateOne: jest.fn(async () => ({ acknowledged: true })),
      })),
    })),
  };
  return jest.fn(() => client);
}

function fakeClerk() {
  return { verifyToken: jest.fn(async () => ({ sub: "u_1", email: "a@b" })) };
}

function fakeStripeCtor() {
  return jest.fn(() => ({
    checkout: { sessions: { create: jest.fn(async () => ({ url: "x" })) } },
    webhooks: { constructEvent: jest.fn(() => ({ type: "noop" })) },
  }));
}

function deps(overrides = {}) {
  return {
    env: overrides.env ?? {},
    MongoClient: overrides.MongoClient ?? fakeMongo(),
    clerk: overrides.clerk ?? fakeClerk(),
    StripeCtor: overrides.StripeCtor ?? fakeStripeCtor(),
  };
}

describe("wire", () => {
  test("returns an app + shutdown function", async () => {
    const result = await wire(deps());
    expect(typeof result.app.inject).toBe("function");
    expect(typeof result.shutdown).toBe("function");
    await result.shutdown();
  });

  test("without env, all adapters fall back to in-memory", async () => {
    const result = await wire(deps());
    // health still works
    const res = await result.app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    await result.shutdown();
  });

  test("with COSMOS env set, instantiates MongoClient and ensures unique index", async () => {
    const MongoClient = fakeMongo();
    await wire(
      deps({
        env: {
          COSMOS_MONGO_CONNECTION_STRING: "mongodb://test",
          COSMOS_DB_NAME: "sv",
        },
        MongoClient,
      }),
    );
    expect(MongoClient).toHaveBeenCalledWith("mongodb://test");
    // connect() was called; db().collection().createIndex() was called
    const clientInstance = MongoClient.mock.results[0].value;
    expect(clientInstance.connect).toHaveBeenCalled();
    expect(clientInstance.db).toHaveBeenCalledWith("sv");
  });

  test('with CLERK env set, ClerkAdapter is wired (auth port id = "clerk")', async () => {
    const result = await wire(
      deps({
        env: { CLERK_SECRET_KEY: "sk_test" },
      }),
    );
    expect(result.app.ports.auth.id).toBe("clerk");
    await result.shutdown();
  });

  test('without CLERK env, in-memory auth is used (port id = "in-memory")', async () => {
    const result = await wire(deps());
    expect(result.app.ports.auth.id).toBe("in-memory");
    await result.shutdown();
  });

  test("with STRIPE env set, StripeAdapter is wired", async () => {
    const StripeCtor = fakeStripeCtor();
    const result = await wire(
      deps({
        env: {
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec_test",
          STRIPE_PRICE_PRO: "price_pro",
          BILLING_SUCCESS_URL: "https://app.test/success",
          BILLING_CANCEL_URL: "https://app.test/cancel",
        },
        StripeCtor,
      }),
    );
    expect(StripeCtor).toHaveBeenCalledWith("sk_test");
    expect(result.app.ports.billing.id).toBe("stripe");
    await result.shutdown();
  });

  test("without STRIPE env, in-memory billing is used", async () => {
    const result = await wire(deps());
    expect(result.app.ports.billing.id).toBe("in-memory");
    await result.shutdown();
  });

  test("shutdown() closes the Mongo client when one was opened", async () => {
    const MongoClient = fakeMongo();
    const result = await wire(
      deps({
        env: {
          COSMOS_MONGO_CONNECTION_STRING: "mongodb://test",
          COSMOS_DB_NAME: "sv",
        },
        MongoClient,
      }),
    );
    await result.shutdown();
    const clientInstance = MongoClient.mock.results[0].value;
    expect(clientInstance.close).toHaveBeenCalled();
  });
});
