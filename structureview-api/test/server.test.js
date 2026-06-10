import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/server.js';

function createStripeMock({
  customerSearchResult = { data: [{ id: 'cus_123' }] },
  subscriptionsResult = {
    data: [{ items: { data: [{ price: { id: 'price_pro' } }] } }],
  },
  checkoutSessionResult = { url: 'https://checkout.stripe.test/session' },
} = {}) {
  return {
    customers: {
      search: async () => customerSearchResult,
      create: async () => ({ id: 'cus_created' }),
    },
    subscriptions: {
      list: async () => subscriptionsResult,
    },
    checkout: {
      sessions: {
        create: async () => checkoutSessionResult,
      },
    },
    webhooks: {
      constructEvent: (body, signature) => {
        if (signature !== 'sig_valid') {
          throw new Error('invalid signature');
        }
        return { type: 'checkout.session.completed', id: 'evt_123', body };
      },
    },
  };
}

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test('GET /licence returns 401 without bearer token', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/licence`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'missing_token' });
  });
});

test('GET /licence returns 401 when token payload has no sub', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({}),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/licence`, {
      headers: { authorization: ['Bearer', 'tok_test'].join(' ') },
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'invalid_token' });
  });
});

test('GET /licence returns pro when any active subscription contains STRIPE_PRICE_ID_PRO', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock({
      subscriptionsResult: {
        data: [
          { items: { data: [{ price: { id: 'price_other' } }] } },
          { items: { data: [{ price: { id: 'price_pro' } }] } },
        ],
      },
    }),
    clerkSecretKey: 'sk_test',
    stripePriceIdPro: 'price_pro',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/licence`, {
      headers: { authorization: ['Bearer', 'tok_test'].join(' ') },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { tier: 'pro', valid: true });
  });
});

test('GET /licence returns 500 when Stripe call fails', async () => {
  const stripeClient = createStripeMock();
  stripeClient.customers.search = async () => {
    throw new Error('stripe down');
  };
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient,
    clerkSecretKey: 'sk_test',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/licence`, {
      headers: { authorization: ['Bearer', 'tok_test'].join(' ') },
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'licence_check_failed' });
  });
});

test('POST /checkout rejects non-http(s) success/cancel urls', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
    stripePriceIdPro: 'price_pro',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        authorization: ['Bearer', 'tok_test'].join(' '),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: 'javascript:alert(1)',
        cancelUrl: 'https://example.com/cancel',
      }),
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'successUrl and cancelUrl must be valid http(s) URLs',
    });
  });
});

test('POST /checkout returns url on happy path', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
    stripePriceIdPro: 'price_pro',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        authorization: ['Bearer', 'tok_test'].join(' '),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      url: 'https://checkout.stripe.test/session',
    });
  });
});

test('POST /checkout returns 500 when Stripe checkout throws', async () => {
  const stripeClient = createStripeMock();
  stripeClient.checkout.sessions.create = async () => {
    throw new Error('stripe unavailable');
  };
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient,
    clerkSecretKey: 'sk_test',
    stripePriceIdPro: 'price_pro',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        authorization: ['Bearer', 'tok_test'].join(' '),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'checkout_failed' });
  });
});

test('POST /webhooks/stripe returns 500 when webhook secret is missing', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
    stripeWebhookSecret: '',
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify({ type: 'test.event' }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: 'webhook_secret_not_configured',
    });
  });
});

test('POST /webhooks/stripe returns 400 for missing or invalid signature', async () => {
  const app = createApp({
    verifyTokenFn: async () => ({ sub: 'user_123' }),
    stripeClient: createStripeMock(),
    clerkSecretKey: 'sk_test',
    stripeWebhookSecret: 'whsec_test',
  });

  await withServer(app, async (baseUrl) => {
    const missingSigResponse = await fetch(`${baseUrl}/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ type: 'test.event' }),
    });
    assert.equal(missingSigResponse.status, 400);
    assert.deepEqual(await missingSigResponse.json(), {
      error: 'webhook_signature_missing',
    });

    const invalidSigResponse = await fetch(`${baseUrl}/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'sig_invalid',
      },
      body: JSON.stringify({ type: 'test.event' }),
    });
    assert.equal(invalidSigResponse.status, 400);
    const payload = await invalidSigResponse.json();
    assert.equal(payload.error, 'webhook_signature_invalid: invalid signature');
  });
});
