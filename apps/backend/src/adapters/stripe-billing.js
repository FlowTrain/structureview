/**
 * StripeAdapter — production BillingPort (ADR-0002).
 *
 * Takes a stripe SDK client as dependency (DIP). Production wiring:
 *
 *   const Stripe = require('stripe');
 *   const adapter = createStripeBilling({
 *     stripe: new Stripe(process.env.STRIPE_SECRET_KEY),
 *     webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
 *     priceMap: { pro: 'price_xxx', team: 'price_yyy' },
 *     successUrl, cancelUrl,
 *   });
 */
"use strict";

const UPGRADE_EVENT = "checkout.session.completed";

function createStripeBilling({
  stripe,
  webhookSecret,
  priceMap,
  successUrl,
  cancelUrl,
}) {
  return {
    id: "stripe",

    async createCheckoutSession({ userId, plan }) {
      const price = priceMap[plan];
      if (!price) throw new Error(`Unknown plan "${plan}"`);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        client_reference_id: userId,
        line_items: [{ price, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { plan },
      });
      return { url: session.url };
    },

    verifyWebhookSignature(rawBody, signature) {
      try {
        stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        return true;
      } catch {
        return false;
      }
    },

    parseWebhookEvent(rawBody, signature) {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
      if (event.type !== UPGRADE_EVENT) {
        return { type: event.type };
      }
      const obj = event.data.object;
      return {
        type: UPGRADE_EVENT,
        userId: obj.client_reference_id,
        tier: obj.metadata?.plan,
      };
    },
  };
}

module.exports = { createStripeBilling };
