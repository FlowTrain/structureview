const {
  createInMemoryEntitlements,
} = require("../../src/adapters/in-memory-entitlements");
const { validateEntitlementPort } = require("../../src/ports/entitlement-port");

describe("InMemoryEntitlements", () => {
  test("satisfies EntitlementPort contract", () => {
    expect(() =>
      validateEntitlementPort(createInMemoryEntitlements()),
    ).not.toThrow();
  });

  test("get() returns the free tier for an unknown user", async () => {
    const repo = createInMemoryEntitlements();
    expect(await repo.get("u_unknown")).toEqual({ tier: "free", features: [] });
  });

  test("set() persists; subsequent get() returns the stored value", async () => {
    const repo = createInMemoryEntitlements();
    await repo.set("u_1", { tier: "pro", features: ["timc-light"] });
    expect(await repo.get("u_1")).toEqual({
      tier: "pro",
      features: ["timc-light"],
    });
  });

  test("set() overwrites a previous entitlement", async () => {
    const repo = createInMemoryEntitlements();
    await repo.set("u_1", { tier: "pro", features: [] });
    await repo.set("u_1", {
      tier: "team",
      features: ["timc-light", "team-dashboard"],
    });
    expect((await repo.get("u_1")).tier).toBe("team");
  });

  test("seed via constructor pre-populates the store", async () => {
    const repo = createInMemoryEntitlements({
      seed: { u_alice: { tier: "pro", features: ["timc-light"] } },
    });
    expect((await repo.get("u_alice")).tier).toBe("pro");
  });

  test("rejects set() with an invalid tier", async () => {
    const repo = createInMemoryEntitlements();
    await expect(
      repo.set("u_1", { tier: "platinum", features: [] }),
    ).rejects.toThrow(/tier/);
  });
});
