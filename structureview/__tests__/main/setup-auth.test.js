const { setupDesktopAuth } = require('../../src/main/setup-auth');

function fakeIpcMain() {
  const handlers = {};
  return {
    handlers,
    handle: (channel, fn) => {
      handlers[channel] = fn;
    },
  };
}
function fakeKeytar() {
  return {
    getPassword: async () => null,
    setPassword: async () => {},
    deletePassword: async () => {},
  };
}
function fakeShell() {
  return { openExternal: async () => true };
}
function fakeBrowserWindowFactory() {
  return () => ({ loadURL: () => {}, on: () => {}, close: () => {} });
}
function fakeFetch() {
  return async () => ({ ok: true, status: 200, json: async () => ({}) });
}
function fullEnv(overrides = {}) {
  return {
    STRUCTUREVIEW_API_URL: 'https://api.test',
    STRUCTUREVIEW_CLERK_SIGN_IN_URL: 'https://clerk.test/sign-in',
    STRUCTUREVIEW_AUTH_CALLBACK_PREFIX: 'structureview://auth-callback',
    ...overrides,
  };
}
function baseDeps(overrides = {}) {
  return {
    ipcMain: fakeIpcMain(),
    browserWindowFactory: fakeBrowserWindowFactory(),
    shell: fakeShell(),
    keytar: fakeKeytar(),
    fetch: fakeFetch(),
    env: fullEnv(),
    ...overrides,
  };
}

describe('setupDesktopAuth', () => {
  test('returns false when env is missing', () => {
    const deps = baseDeps({ env: {} });
    expect(setupDesktopAuth(deps)).toBe(false);
    expect(Object.keys(deps.ipcMain.handlers)).toEqual([]);
  });

  test('returns false when keytar is unavailable', () => {
    expect(setupDesktopAuth(baseDeps({ keytar: null }))).toBe(false);
  });

  test('returns false when fetch is unavailable', () => {
    expect(setupDesktopAuth(baseDeps({ fetch: null }))).toBe(false);
  });

  test('returns false when browserWindowFactory is unavailable', () => {
    expect(setupDesktopAuth(baseDeps({ browserWindowFactory: null }))).toBe(false);
  });

  test('returns false when API URL is missing', () => {
    expect(
      setupDesktopAuth(
        baseDeps({
          env: {
            STRUCTUREVIEW_CLERK_SIGN_IN_URL: 'x',
            STRUCTUREVIEW_AUTH_CALLBACK_PREFIX: 'y',
          },
        })
      )
    ).toBe(false);
  });

  test('registers all 5 IPC channels when env is fully set', () => {
    const deps = baseDeps();
    expect(setupDesktopAuth(deps)).toBe(true);
    expect(Object.keys(deps.ipcMain.handlers).sort()).toEqual(
      [
        'auth:current-user',
        'auth:sign-in',
        'auth:sign-out',
        'billing:refresh-entitlement',
        'billing:start-upgrade',
      ].sort()
    );
  });
});
