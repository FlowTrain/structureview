const { validateBillingPort } = require("../../src/ports/billing-port");

const valid = {
  id: "in-memory",
  createCheckoutSession: async () => ({ url: "about:blank" }),
  verifyWebhookSignature: () => true,
  parseWebhookEvent: () => ({ type: "noop" }),
};

describe("validateBillingPort", () => {
  test("accepts a valid port", () => {
    expect(() => validateBillingPort(valid)).not.toThrow();
  });
  test("rejects when id is empty", () => {
    expect(() => validateBillingPort({ ...valid, id: "" })).toThrow(/id/);
  });
  test.each([
    ["createCheckoutSession", null],
    ["verifyWebhookSignature", "no"],
    ["parseWebhookEvent", 7],
  ])("rejects when %s is not a function", (key, value) => {
    expect(() => validateBillingPort({ ...valid, [key]: value })).toThrow(
      new RegExp(key),
    );
  });
});
