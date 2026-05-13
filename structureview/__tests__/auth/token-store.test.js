/**
 * token-store — wraps keytar with a stable get/set/clear interface.
 *
 * DIP: takes a keytar-shaped dependency, so tests don't need the
 * actual native module installed.
 */
const { createTokenStore } = require('../../src/auth/token-store');

function fakeKeytar() {
  const store = new Map();
  return {
    store,
    getPassword: jest.fn(async (service, account) => store.get(`${service}/${account}`) || null),
    setPassword: jest.fn(async (service, account, value) => {
      store.set(`${service}/${account}`, value);
    }),
    deletePassword: jest.fn(async (service, account) => store.delete(`${service}/${account}`)),
  };
}

describe('createTokenStore', () => {
  test('get() returns null when no token has been saved', async () => {
    const ts = createTokenStore({ keytar: fakeKeytar() });
    expect(await ts.get()).toBeNull();
  });

  test('set() persists and get() returns the saved value', async () => {
    const ts = createTokenStore({ keytar: fakeKeytar() });
    await ts.set('tok-abc');
    expect(await ts.get()).toBe('tok-abc');
  });

  test('clear() removes the saved token', async () => {
    const ts = createTokenStore({ keytar: fakeKeytar() });
    await ts.set('tok-abc');
    await ts.clear();
    expect(await ts.get()).toBeNull();
  });

  test('uses configured service + account names with keytar', async () => {
    const keytar = fakeKeytar();
    const ts = createTokenStore({
      keytar,
      service: 'structureview-test',
      account: 'session',
    });
    await ts.set('tok-xyz');
    expect(keytar.setPassword).toHaveBeenCalledWith('structureview-test', 'session', 'tok-xyz');
  });

  test('falls back to default service+account when none provided', async () => {
    const keytar = fakeKeytar();
    const ts = createTokenStore({ keytar });
    await ts.set('tok-1');
    expect(keytar.setPassword.mock.calls[0][0]).toBe('com.structureview.app');
    expect(keytar.setPassword.mock.calls[0][1]).toBe('default');
  });

  test('throws at construction when keytar dependency is missing', () => {
    expect(() => createTokenStore()).toThrow(/keytar/);
  });

  test('treats empty-string token as no token (clear before set)', async () => {
    const keytar = fakeKeytar();
    const ts = createTokenStore({ keytar });
    await ts.set('');
    expect(keytar.setPassword).not.toHaveBeenCalled();
    expect(keytar.deletePassword).toHaveBeenCalled();
  });
});
