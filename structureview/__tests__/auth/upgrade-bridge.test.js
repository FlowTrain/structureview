/**
 * upgrade-bridge — Stripe Checkout flow orchestrator.
 *
 * DIP: takes shell (with openExternal) + backendClient as dependencies.
 */
const { createUpgradeBridge } = require('../../src/auth/upgrade-bridge');

function fakeShell() {
  return { openExternal: jest.fn(async () => true) };
}

function fakeBackend({ checkoutUrl = 'https://checkout.stripe.test/abc', tier = 'pro' } = {}) {
  return {
    checkout: jest.fn(async () => ({ url: checkoutUrl })),
    entitlements: jest.fn(async () => ({ tier, features: tier === 'pro' ? ['timc-light'] : [] })),
  };
}

function makeBridge(overrides = {}) {
  return createUpgradeBridge({
    shell: overrides.shell ?? fakeShell(),
    backendClient: overrides.backendClient ?? fakeBackend(),
  });
}

describe('createUpgradeBridge', () => {
  test('throws when shell is missing', () => {
    expect(() => createUpgradeBridge({ backendClient: fakeBackend() })).toThrow(/shell/);
  });

  test('throws when backendClient is missing', () => {
    expect(() => createUpgradeBridge({ shell: fakeShell() })).toThrow(/backendClient/);
  });

  test('startUpgrade(plan) requests checkout URL and opens it externally', async () => {
    const shell = fakeShell();
    const backend = fakeBackend({ checkoutUrl: 'https://checkout.stripe.test/xyz' });
    const bridge = makeBridge({ shell, backendClient: backend });
    const result = await bridge.startUpgrade('pro');
    expect(backend.checkout).toHaveBeenCalledWith('pro');
    expect(shell.openExternal).toHaveBeenCalledWith('https://checkout.stripe.test/xyz');
    expect(result).toEqual({ checkoutUrl: 'https://checkout.stripe.test/xyz' });
  });

  test('startUpgrade rejects when plan is missing', async () => {
    const bridge = makeBridge();
    await expect(bridge.startUpgrade()).rejects.toThrow(/plan/);
    await expect(bridge.startUpgrade('')).rejects.toThrow(/plan/);
  });

  test('refreshEntitlement() returns the latest entitlement from backend', async () => {
    const bridge = makeBridge({ backendClient: fakeBackend({ tier: 'pro' }) });
    expect(await bridge.refreshEntitlement()).toEqual({
      tier: 'pro',
      features: ['timc-light'],
    });
  });

  test('exposes only startUpgrade and refreshEntitlement', () => {
    expect(Object.keys(makeBridge()).sort()).toEqual(['refreshEntitlement', 'startUpgrade']);
  });
});
