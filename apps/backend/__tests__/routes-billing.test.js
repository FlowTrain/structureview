const { createApp } = require("../src/app");
const { createInMemoryAuth } = require("../src/adapters/in-memory-auth");
const {
  createInMemoryEntitlements,
} = require("../src/adapters/in-memory-entitlements");
const { createInMemoryBilling } = require("../src/adapters/in-memory-billing");

const JSON_CT = { "content-type": "application/json" };

function appBundle() {
  const auth = createInMemoryAuth({
    seed: { "tok-alice": { userId: "u_1", email: "alice@example.com" } },
  });
  const entitlements = createInMemoryEntitlements();
  const billing = createInMemoryBilling({ webhookSecret: "test-secret" });
  return { app: createApp({ auth, entitlements, billing }), entitlements };
}

describe("POST /billing/checkout", () => {
  test("401 without bearer", async () => {
    const { app } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/billing/checkout",
      headers: JSON_CT,
      payload: { plan: "pro" },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("returns a checkout URL for the requested plan", async () => {
    const { app } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/billing/checkout",
      headers: { authorization: "Bearer tok-alice", ...JSON_CT },
      payload: { plan: "pro" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ url: expect.stringContaining("plan=pro") });
    await app.close();
  });

  test("400 when plan is missing", async () => {
    const { app } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/billing/checkout",
      headers: { authorization: "Bearer tok-alice", ...JSON_CT },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

describe("POST /webhooks/billing", () => {
  test("401 when signature is invalid", async () => {
    const { app } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/billing",
      headers: { "stripe-signature": "wrong", ...JSON_CT },
      payload: JSON.stringify({ type: "noop" }),
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("upgrades the user entitlement on checkout.session.completed", async () => {
    const { app, entitlements } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/billing",
      headers: { "stripe-signature": "test-secret", ...JSON_CT },
      payload: JSON.stringify({
        type: "checkout.session.completed",
        userId: "u_1",
        tier: "pro",
      }),
    });
    expect(res.statusCode).toBe(200);
    expect((await entitlements.get("u_1")).tier).toBe("pro");
    await app.close();
  });

  test("returns 200 for unrelated event types but does not touch entitlements", async () => {
    const { app, entitlements } = appBundle();
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/billing",
      headers: { "stripe-signature": "test-secret", ...JSON_CT },
      payload: JSON.stringify({ type: "invoice.paid" }),
    });
    expect(res.statusCode).toBe(200);
    expect((await entitlements.get("u_1")).tier).toBe("free");
    await app.close();
  });
});
