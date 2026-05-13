const { createApp } = require("../src/app");
const { createInMemoryAuth } = require("../src/adapters/in-memory-auth");
const {
  createInMemoryEntitlements,
} = require("../src/adapters/in-memory-entitlements");

function appWith({ entitlement = null } = {}) {
  const auth = createInMemoryAuth({
    seed: { "tok-alice": { userId: "u_1", email: "alice@example.com" } },
  });
  const entitlements = createInMemoryEntitlements({
    seed: entitlement ? { u_1: entitlement } : {},
  });
  return createApp({ auth, entitlements });
}

describe("GET /entitlements", () => {
  test("401 without bearer", async () => {
    const app = appWith();
    const res = await app.inject({ method: "GET", url: "/entitlements" });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  test("returns free tier by default for new users", async () => {
    const app = appWith();
    const res = await app.inject({
      method: "GET",
      url: "/entitlements",
      headers: { authorization: "Bearer tok-alice" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ tier: "free", features: [] });
    await app.close();
  });

  test("returns the seeded entitlement when present", async () => {
    const app = appWith({
      entitlement: { tier: "pro", features: ["timc-light"] },
    });
    const res = await app.inject({
      method: "GET",
      url: "/entitlements",
      headers: { authorization: "Bearer tok-alice" },
    });
    expect(res.json()).toEqual({ tier: "pro", features: ["timc-light"] });
    await app.close();
  });
});
