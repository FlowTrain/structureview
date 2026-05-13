/**
 * upgrade-bridge — Stripe Checkout flow orchestrator.
 *
 * Per ADR-0002: client never speaks to Stripe directly. It asks the
 * backend for a Checkout session URL, opens it in the OS default
 * browser via shell.openExternal, and refreshes the entitlement when
 * the user returns to the app.
 *
 * DIP: shell + backendClient injected so tests stay pure JS.
 */
'use strict';

function createUpgradeBridge({ shell, backendClient } = {}) {
  if (!shell || typeof shell.openExternal !== 'function') {
    throw new Error('createUpgradeBridge: shell (with openExternal) is required');
  }
  if (!backendClient) {
    throw new Error('createUpgradeBridge: backendClient is required');
  }

  async function startUpgrade(plan) {
    if (!plan) throw new Error('startUpgrade: plan is required');
    const { url } = await backendClient.checkout(plan);
    await shell.openExternal(url);
    return { checkoutUrl: url };
  }

  function refreshEntitlement() {
    return backendClient.entitlements();
  }

  return { startUpgrade, refreshEntitlement };
}

module.exports = { createUpgradeBridge };
