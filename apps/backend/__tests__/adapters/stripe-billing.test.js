const { createStripeBilling } = require("../../src/adapters/stripe-billing");
const { validateBillingPort } = require("../../src/ports/billing-port");

function stubStripe(overrides = {}) {
  return {
    checkout: {
      sessions: {
        create: jest.fn(async () => ({
          url: "https://checkout.stripe.test/123",
        })),
      },
    },
    webhooks: {
      constructEvent: jest.fn(() => ({ type: "noop" })),
    },
    ...overrides,
  };
}

describe("StripeAdapter", () => {
  test("satisfies BillingPort contract", () => {
    const adapter = createStripeBilling({
      stripe: stubStripe(),
      webhookSecret: "whsec_test",
      priceMap: { pro: "price_pro" },
      successUrl: "s",
      cancelUrl: "c",
    });
    expect(() => validateBillingPort(adapter)).not.toThrow();
  });

  test("createCheckoutSession asks Stripe for a session and returns its url", async () => {
    const stripe = stubStripe();
    const adapter = createStripeBilling({
      stripe,
      webhookSecret: "whsec_test",
      priceMap: { pro: "price_pro" },
      successUrl: "https://app.test/success",
      cancelUrl: "https://app.test/cancel",
    });
    const { url } = await adapter.createCheckoutSession({
      userId: "u_1",
      plan: "pro",
    });
    expect(url).toBe("https://checkout.stripe.test/123");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        client_reference_id: "u_1",
        line_items: [{ price: "price_pro", quantity: 1 }],
        success_url: "https://app.test/success",
        cancel_url: "https://app.test/cancel",
      }),
    );
  });

  test("createCheckoutSession rejects unknown plans", async () => {
    const adapter = createStripeBilling({
      stripe: stubStripe(),
      webhookSecret: "whsec_test",
      priceMap: { pro: "price_pro" },
      successUrl: "s",
      cancelUrl: "c",
    });
    await expect(
      adapter.createCheckoutSession({ userId: "u_1", plan: "enterprise" }),
    ).rejects.toThrow(/plan/);
  });

  test("verifyWebhookSignature returns true on success and false on failure", () => {
    const stripe = stubStripe({
      webhooks: {
        constructEvent: jest.fn(() => ({ type: "ok" })),
      },
    });
    const adapter = createStripeBilling({
      stripe,
      webhookSecret: "whsec_test",
      priceMap: {},
      successUrl: "s",
      cancelUrl: "c",
    });
    expect(adapter.verifyWebhookSignature("body", "good-sig")).toBe(true);

    stripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("bad signature");
    });
    expect(adapter.verifyWebhookSignature("body", "bad-sig")).toBe(false);
  });

  test("parseWebhookEvent maps checkout.session.completed → upgrade event", () => {
    const stripe = stubStripe({
      webhooks: {
        constructEvent: jest.fn(() => ({
          type: "checkout.session.completed",
          data: {
            object: {
              client_reference_id: "u_1",
              metadata: { plan: "pro" },
            },
          },
        })),
      },
    });
    const adapter = createStripeBilling({
      stripe,
      webhookSecret: "whsec_test",
      priceMap: {},
      successUrl: "s",
      cancelUrl: "c",
    });
    const evt = adapter.parseWebhookEvent("body", "sig");
    expect(evt).toEqual({
      type: "checkout.session.completed",
      userId: "u_1",
      tier: "pro",
    });
  });

  test("parseWebhookEvent returns null type for unrecognised events", () => {
    const stripe = stubStripe({
      webhooks: {
        constructEvent: jest.fn(() => ({
          type: "invoice.paid",
          data: { object: {} },
        })),
      },
    });
    const adapter = createStripeBilling({
      stripe,
      webhookSecret: "whsec_test",
      priceMap: {},
      successUrl: "s",
      cancelUrl: "c",
    });
    expect(adapter.parseWebhookEvent("body", "sig")).toEqual({
      type: "invoice.paid",
    });
  });
});
