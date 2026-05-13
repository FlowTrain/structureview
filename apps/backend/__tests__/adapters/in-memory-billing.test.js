const {
  createInMemoryBilling,
} = require("../../src/adapters/in-memory-billing");
const { validateBillingPort } = require("../../src/ports/billing-port");

describe("InMemoryBilling", () => {
  test("satisfies BillingPort contract", () => {
    expect(() => validateBillingPort(createInMemoryBilling())).not.toThrow();
  });

  test("createCheckoutSession returns a deterministic test URL containing userId+plan", async () => {
    const b = createInMemoryBilling();
    const { url } = await b.createCheckoutSession({
      userId: "u_1",
      plan: "pro",
    });
    expect(url).toContain("u_1");
    expect(url).toContain("pro");
  });

  test("verifyWebhookSignature accepts the canned test secret", () => {
    const b = createInMemoryBilling({ webhookSecret: "test-secret" });
    expect(b.verifyWebhookSignature("body", "test-secret")).toBe(true);
    expect(b.verifyWebhookSignature("body", "wrong")).toBe(false);
  });

  test("parseWebhookEvent passes through pre-shaped events", () => {
    const b = createInMemoryBilling();
    const evt = b.parseWebhookEvent(
      JSON.stringify({
        type: "checkout.session.completed",
        userId: "u_1",
        tier: "pro",
      }),
    );
    expect(evt).toEqual({
      type: "checkout.session.completed",
      userId: "u_1",
      tier: "pro",
    });
  });

  test("parseWebhookEvent throws on malformed body", () => {
    const b = createInMemoryBilling();
    expect(() => b.parseWebhookEvent("{nope")).toThrow();
  });
});
