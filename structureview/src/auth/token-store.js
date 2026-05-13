/**
 * token-store — wraps keytar with a stable get/set/clear interface.
 *
 * DIP: receives the keytar dependency rather than requiring it. Production
 * wiring in main/index.js:
 *
 *   const keytar = require('keytar');
 *   const tokens = createTokenStore({ keytar });
 *
 * Tests inject a fake keytar (see __tests__/auth/token-store.test.js).
 */
'use strict';

const DEFAULT_SERVICE = 'com.structureview.app';
const DEFAULT_ACCOUNT = 'default';

function createTokenStore({ keytar, service = DEFAULT_SERVICE, account = DEFAULT_ACCOUNT } = {}) {
  if (!keytar || typeof keytar.getPassword !== 'function') {
    throw new Error('createTokenStore: a keytar-shaped dependency is required');
  }
  return {
    async get() {
      return (await keytar.getPassword(service, account)) || null;
    },
    async set(token) {
      if (!token) {
        await keytar.deletePassword(service, account);
        return;
      }
      await keytar.setPassword(service, account, token);
    },
    async clear() {
      await keytar.deletePassword(service, account);
    },
  };
}

module.exports = { createTokenStore };
