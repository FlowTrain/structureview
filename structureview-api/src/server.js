import express from 'express';
import { verifyToken } from '@clerk/backend';
import Stripe from 'stripe';

// ─── Config ───────────────────────────────────────────────────────────────────

const {
  PORT = 3000,
  CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID_PRO,   // Stripe Price ID for the StructureView Pro plan
} = process.env;

if (!CLERK_SECRET_KEY)    throw new Error('CLERK_SECRET_KEY is required');
if (!STRIPE_SECRET_KEY)   throw new Error('STRIPE_SECRET_KEY is required');

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

// Raw body needed for Stripe webhook signature verification
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function requireClerkSession(req, res, next) {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    req.clerkUserId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

// ─── GET /licence ─────────────────────────────────────────────────────────────
// Called by the VS Code extension and desktop app on startup.
// Returns { tier: 'free' | 'pro', valid: boolean }

app.get('/licence', requireClerkSession, async (req, res) => {
  try {
    const customers = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${req.clerkUserId}'`,
      limit: 1,
    });

    if (!customers.data.length) {
      return res.json({ tier: 'free', valid: true });
    }

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const active = subs.data.some(
      (s) => !STRIPE_PRICE_ID_PRO || s.items.data.some((i) => i.price.id === STRIPE_PRICE_ID_PRO)
    );

    res.json({ tier: active ? 'pro' : 'free', valid: true });
  } catch (err) {
    console.error('licence check error', err);
    res.status(500).json({ error: 'licence_check_failed' });
  }
});

// ─── POST /checkout ───────────────────────────────────────────────────────────
// Creates a Stripe Checkout session for upgrading to Pro.
// Body: { successUrl, cancelUrl }

app.post('/checkout', requireClerkSession, async (req, res) => {
  const { successUrl, cancelUrl } = req.body ?? {};
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'successUrl and cancelUrl are required' });
  }
  if (!STRIPE_PRICE_ID_PRO) {
    return res.status(503).json({ error: 'STRIPE_PRICE_ID_PRO not configured' });
  }

  try {
    // Upsert Stripe customer keyed to Clerk user ID
    let customers = await stripe.customers.search({
      query: `metadata['clerk_user_id']:'${req.clerkUserId}'`,
      limit: 1,
    });

    let customer;
    if (customers.data.length) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        metadata: { clerk_user_id: req.clerkUserId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('checkout error', err);
    res.status(500).json({ error: 'checkout_failed' });
  }
});

// ─── POST /webhooks/stripe ────────────────────────────────────────────────────
// Receives Stripe events. Currently logs; extend for provisioning.

app.post('/webhooks/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping verification');
    return res.json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `webhook_signature_invalid: ${err.message}` });
  }

  console.log('stripe event', event.type, event.id);

  // Extend: handle customer.subscription.created / deleted for provisioning
  res.json({ received: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`structureview-api listening on :${PORT}`));
