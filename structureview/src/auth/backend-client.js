/**
 * backend-client — thin fetch wrapper for the StructureView backend.
 *
 * Auto-attaches Authorization: Bearer <token> from the injected token store.
 * DIP: fetch + tokens are dependencies, so tests don't hit the network.
 *
 * Returns null/free-defaults instead of throwing for unauthenticated reads —
 * the UI treats "unknown" and "free" identically and prompts sign-in.
 */
'use strict';

const FREE_ENTITLEMENT = Object.freeze({ tier: 'free', features: [] });

function createBackendClient({ baseUrl, tokens, fetch } = {}) {
  if (!baseUrl) throw new Error('createBackendClient: baseUrl is required');

  async function authHeaders() {
    const token = await tokens.get();
    return token ? { authorization: `Bearer ${token}` } : null;
  }

  async function me() {
    const headers = await authHeaders();
    if (!headers) return null;
    const res = await fetch(`${baseUrl}/me`, { method: 'GET', headers });
    if (res.status === 401) {
      await tokens.clear();
      return null;
    }
    if (!res.ok) return null;
    return res.json();
  }

  async function entitlements() {
    const headers = await authHeaders();
    if (!headers) return FREE_ENTITLEMENT;
    const res = await fetch(`${baseUrl}/entitlements`, { method: 'GET', headers });
    if (!res.ok) return FREE_ENTITLEMENT;
    return res.json();
  }

  async function checkout(plan) {
    const headers = await authHeaders();
    if (!headers) throw new Error('Must sign in before checkout');
    const res = await fetch(`${baseUrl}/billing/checkout`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    return res.json();
  }

  return { me, entitlements, checkout };
}

module.exports = { createBackendClient };
