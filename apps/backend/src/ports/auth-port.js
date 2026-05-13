/**
 * AuthPort — contract every auth provider implements (ADR-0001).
 *
 * @typedef {Object} AuthUser
 * @property {string} userId
 * @property {string} [email]
 *
 * @typedef {Object} AuthPort
 * @property {string} id
 * @property {(token: string) => Promise<AuthUser|null>} validateSessionToken
 */
"use strict";

function validateAuthPort(port) {
  if (!port || typeof port.id !== "string" || !port.id) {
    throw new Error("AuthPort: id must be a non-empty string");
  }
  if (typeof port.validateSessionToken !== "function") {
    throw new Error(
      `AuthPort[${port.id}]: validateSessionToken must be a function`,
    );
  }
  return port;
}

module.exports = { validateAuthPort };
