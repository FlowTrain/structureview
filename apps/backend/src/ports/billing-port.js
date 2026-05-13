/**
 * BillingPort — contract every billing provider implements (ADR-0002).
 *
 * @typedef {Object} BillingPort
 * @property {string} id
 * @property {(opts: {userId: string, plan: string}) => Promise<{url: string}>} createCheckoutSession
 * @property {(rawBody: string, signature: string) => boolean} verifyWebhookSignature
 * @property {(rawBody: string) => {type: string, userId?: string, tier?: string}} parseWebhookEvent
 */
"use strict";

const REQUIRED_FNS = [
  "createCheckoutSession",
  "verifyWebhookSignature",
  "parseWebhookEvent",
];

function validateBillingPort(port) {
  if (!port || typeof port.id !== "string" || !port.id) {
    throw new Error("BillingPort: id must be a non-empty string");
  }
  for (const fn of REQUIRED_FNS) {
    if (typeof port[fn] !== "function") {
      throw new Error(`BillingPort[${port.id}]: ${fn} must be a function`);
    }
  }
  return port;
}

module.exports = { validateBillingPort };
