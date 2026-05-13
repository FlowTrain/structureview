/**
 * backend-client — thin fetch wrapper. Auto-attaches Authorization header
 * from the injected token store. Defers fetch + tokenStore via DIP.
 */
const { createBackendClient } = require('../../src/auth/backend-client');

function fakeTokenStore(initial = null) {
  let token = initial;
  return {
    get: jest.fn(async () => token),
    set: jest.fn(async (t) => {
      token = t;
    }),
    clear: jest.fn(async () => {
      token = null;
    }),
  };
}

function fakeFetch(responses = []) {
  const calls = [];
  const fn = jest.fn(async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift() || { ok: true, status: 200, body: {} };
    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      json: async () => next.body ?? {},
    };
  });
  fn.calls = calls;
  return fn;
}

function makeClient(opts = {}) {
  return createBackendClient({
    baseUrl: 'https://api.test',
    tokens: opts.tokens ?? fakeTokenStore('tok-stored'),
    fetch: opts.fetch ?? fakeFetch(),
  });
}

describe('createBackendClient', () => {
  test('throws when baseUrl is missing', () => {
    expect(() => createBackendClient({ tokens: fakeTokenStore(), fetch: fakeFetch() })).toThrow(
      /baseUrl/
    );
  });

  test('me() GETs /me with Bearer header from the token store', async () => {
    const fetchFn = fakeFetch([{ body: { userId: 'u_1' } }]);
    const client = makeClient({ fetch: fetchFn });
    const user = await client.me();
    expect(user).toEqual({ userId: 'u_1' });
    expect(fetchFn.calls[0].url).toBe('https://api.test/me');
    expect(fetchFn.calls[0].init.headers.authorization).toBe('Bearer tok-stored');
  });

  test('me() returns null when no token is stored (does not fetch)', async () => {
    const fetchFn = fakeFetch();
    const client = makeClient({ tokens: fakeTokenStore(null), fetch: fetchFn });
    expect(await client.me()).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test('me() returns null on 401 (token expired) and clears the bad token', async () => {
    const tokens = fakeTokenStore('tok-bad');
    const fetchFn = fakeFetch([{ ok: false, status: 401, body: {} }]);
    const client = makeClient({ tokens, fetch: fetchFn });
    expect(await client.me()).toBeNull();
    expect(tokens.clear).toHaveBeenCalled();
  });

  test('entitlements() returns the response body', async () => {
    const fetchFn = fakeFetch([{ body: { tier: 'pro', features: ['timc-light'] } }]);
    const client = makeClient({ fetch: fetchFn });
    expect(await client.entitlements()).toEqual({ tier: 'pro', features: ['timc-light'] });
  });

  test('entitlements() returns free tier when not signed in', async () => {
    const client = makeClient({ tokens: fakeTokenStore(null) });
    expect(await client.entitlements()).toEqual({ tier: 'free', features: [] });
  });

  test('checkout(plan) POSTs to /billing/checkout with JSON body', async () => {
    const fetchFn = fakeFetch([{ body: { url: 'https://checkout.stripe.test/abc' } }]);
    const client = makeClient({ fetch: fetchFn });
    const result = await client.checkout('pro');
    expect(result).toEqual({ url: 'https://checkout.stripe.test/abc' });
    expect(fetchFn.calls[0].url).toBe('https://api.test/billing/checkout');
    expect(fetchFn.calls[0].init.method).toBe('POST');
    expect(JSON.parse(fetchFn.calls[0].init.body)).toEqual({ plan: 'pro' });
    expect(fetchFn.calls[0].init.headers['content-type']).toBe('application/json');
  });

  test('checkout() throws when not signed in', async () => {
    const client = makeClient({ tokens: fakeTokenStore(null) });
    await expect(client.checkout('pro')).rejects.toThrow(/sign in/i);
  });
});
