/**
 * ipc-auth — registers auth + billing IPC handlers on the provided ipcMain.
 */
const { registerAuthIpc } = require('../../src/main/ipc-auth');

function fakeIpcMain() {
  const handlers = {};
  return {
    handlers,
    handle: (channel, fn) => {
      handlers[channel] = fn;
    },
  };
}

const stubAuthBridge = {
  signIn: jest.fn(async () => ({ userId: 'u_1' })),
  signOut: jest.fn(async () => {}),
  getCurrentUser: jest.fn(async () => ({ userId: 'u_1' })),
};

const stubUpgradeBridge = {
  startUpgrade: jest.fn(async (plan) => ({ checkoutUrl: `https://stripe.test/${plan}` })),
  refreshEntitlement: jest.fn(async () => ({ tier: 'pro', features: ['timc-light'] })),
};

describe('registerAuthIpc', () => {
  test('registers exactly the documented set of channels', () => {
    const ipc = fakeIpcMain();
    registerAuthIpc({
      ipcMain: ipc,
      authBridge: stubAuthBridge,
      upgradeBridge: stubUpgradeBridge,
    });
    expect(Object.keys(ipc.handlers).sort()).toEqual(
      [
        'auth:current-user',
        'auth:sign-in',
        'auth:sign-out',
        'billing:refresh-entitlement',
        'billing:start-upgrade',
      ].sort()
    );
  });

  test('auth:sign-in delegates to authBridge.signIn', async () => {
    const ipc = fakeIpcMain();
    registerAuthIpc({
      ipcMain: ipc,
      authBridge: stubAuthBridge,
      upgradeBridge: stubUpgradeBridge,
    });
    const user = await ipc.handlers['auth:sign-in']({});
    expect(user).toEqual({ userId: 'u_1' });
    expect(stubAuthBridge.signIn).toHaveBeenCalled();
  });

  test('billing:start-upgrade forwards the plan arg to upgradeBridge.startUpgrade', async () => {
    const ipc = fakeIpcMain();
    registerAuthIpc({
      ipcMain: ipc,
      authBridge: stubAuthBridge,
      upgradeBridge: stubUpgradeBridge,
    });
    const result = await ipc.handlers['billing:start-upgrade']({}, 'pro');
    expect(result.checkoutUrl).toContain('pro');
    expect(stubUpgradeBridge.startUpgrade).toHaveBeenCalledWith('pro');
  });

  test('throws when required deps are missing', () => {
    expect(() => registerAuthIpc({})).toThrow();
    expect(() => registerAuthIpc({ ipcMain: fakeIpcMain(), authBridge: stubAuthBridge })).toThrow(
      /upgradeBridge/
    );
    expect(() =>
      registerAuthIpc({ ipcMain: fakeIpcMain(), upgradeBridge: stubUpgradeBridge })
    ).toThrow(/authBridge/);
  });
});

describe('registerAuthIpc — each handler delegates to its bridge', () => {
  function setup() {
    const ipc = fakeIpcMain();
    registerAuthIpc({
      ipcMain: ipc,
      authBridge: stubAuthBridge,
      upgradeBridge: stubUpgradeBridge,
    });
    return ipc;
  }

  test('auth:sign-out delegates to authBridge.signOut', async () => {
    const ipc = setup();
    await ipc.handlers['auth:sign-out']({});
    expect(stubAuthBridge.signOut).toHaveBeenCalled();
  });

  test('auth:current-user delegates to authBridge.getCurrentUser', async () => {
    const ipc = setup();
    const user = await ipc.handlers['auth:current-user']({});
    expect(user).toEqual({ userId: 'u_1' });
    expect(stubAuthBridge.getCurrentUser).toHaveBeenCalled();
  });

  test('billing:refresh-entitlement delegates to upgradeBridge.refreshEntitlement', async () => {
    const ipc = setup();
    const ent = await ipc.handlers['billing:refresh-entitlement']({});
    expect(ent).toEqual({ tier: 'pro', features: ['timc-light'] });
    expect(stubUpgradeBridge.refreshEntitlement).toHaveBeenCalled();
  });
});
