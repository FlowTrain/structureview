/**
 * InMemoryBilling — test/dev BillingPort. Signature check uses a shared
 * secret; events are plain JSON. Real Stripe adapter lands in sub-batch 10.x.
 */
"use strict";

function createInMemoryBilling({ webhookSecret = "test-secret" } = {}) {
  return {
    id: "in-memory",
    async createCheckoutSession({ userId, plan }) {
      return {
        url: `about:blank?user=${encodeURIComponent(userId)}&plan=${encodeURIComponent(plan)}`,
      };
    },
    verifyWebhookSignature(_body, signature) {
      return signature === webhookSecret;
    },
    parseWebhookEvent(rawBody) {
      return JSON.parse(rawBody);
    },
  };
}

module.exports = { createInMemoryBilling };
