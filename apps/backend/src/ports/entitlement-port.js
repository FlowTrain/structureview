/**
 * EntitlementPort — source of truth for "what is this user entitled to?".
 *
 * @typedef {'free'|'pro'|'team'} Tier
 * @typedef {Object} Entitlement
 * @property {Tier} tier
 * @property {string[]} features
 *
 * @typedef {Object} EntitlementPort
 * @property {string} id
 * @property {(userId: string) => Promise<Entitlement>} get
 * @property {(userId: string, entitlement: Entitlement) => Promise<void>} set
 */
"use strict";

function validateEntitlementPort(port) {
  if (!port || typeof port.id !== "string" || !port.id) {
    throw new Error("EntitlementPort: id must be a non-empty string");
  }
  for (const fn of ["get", "set"]) {
    if (typeof port[fn] !== "function") {
      throw new Error(`EntitlementPort[${port.id}]: ${fn} must be a function`);
    }
  }
  return port;
}

module.exports = { validateEntitlementPort };
