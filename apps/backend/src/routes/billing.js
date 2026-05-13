/**
 * Billing routes — checkout session creation + webhook upgrade flow.
 *
 * The webhook route is the source-of-truth path for entitlements:
 * Stripe says "user X paid for plan Y" → we write that to EntitlementPort.
 * The client never tells the backend its own entitlement.
 */
"use strict";

const UPGRADE_EVENT = "checkout.session.completed";

async function checkoutHandler(req, reply) {
  const { plan } = req.body || {};
  if (!plan) return reply.code(400).send({ error: "missing_plan" });
  const { url } = await this.ports.billing.createCheckoutSession({
    userId: req.user.userId,
    plan,
  });
  return { url };
}

async function webhookHandler(req, reply) {
  const signature = req.headers["stripe-signature"] || "";
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (!this.ports.billing.verifyWebhookSignature(rawBody, signature)) {
    return reply.code(401).send({ error: "invalid_signature" });
  }
  const event = this.ports.billing.parseWebhookEvent(rawBody, signature);
  if (event.type === UPGRADE_EVENT && event.userId && event.tier) {
    await this.ports.entitlements.set(event.userId, {
      tier: event.tier,
      features: featuresForTier(event.tier),
    });
  }
  return { received: true };
}

function featuresForTier(tier) {
  if (tier === "team") return ["timc-light", "team-dashboard"];
  if (tier === "pro") return ["timc-light"];
  return [];
}

async function billingRoutes(app) {
  app.post(
    "/billing/checkout",
    { preHandler: [app.requireAuth] },
    checkoutHandler,
  );
  app.post("/webhooks/billing", webhookHandler);
}

module.exports = billingRoutes;
