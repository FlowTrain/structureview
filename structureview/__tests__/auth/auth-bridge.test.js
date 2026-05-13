/**
 * auth-bridge — Clerk sign-in flow orchestrator (no real electron required).
 *
 * createAuthBridge takes:
 *   - browserWindowFactory(): returns a window-like object {loadURL, on, close}
 *   - tokens: TokenStore
 *   - backendClient: { me() }
 *   - signInUrl, callbackPrefix
 *
 * signIn() resolves with the user object after successful sign-in.
 */
const { createAuthBridge } = require('../../src/auth/auth-bridge');

function fakeWindow() {
  const listeners = {};
  return {
    loadedUrl: null,
    closed: false,
    loadURL(url) {
      this.loadedUrl = url;
    },
    on(event, handler) {
      listeners[event] = handler;
    },
    close() {
      this.closed = true;
      if (listeners.closed) listeners.closed();
    },
    _fireNavigate(url) {
      if (listeners['will-navigate']) listeners['will-navigate'](url);
    },
    _fireClosed() {
      if (listeners.closed) listeners.closed();
    },
  };
}

function fakeTokens() {
  let val = null;
  return {
    get: jest.fn(async () => val),
    set: jest.fn(async (t) => {
      val = t;
    }),
    clear: jest.fn(async () => {
      val = null;
    }),
  };
}

function fakeBackend(meResult) {
  return { me: jest.fn(async () => meResult) };
}

function makeBridge(overrides = {}) {
  const win = fakeWindow();
  const factory = jest.fn(() => win);
  const tokens = fakeTokens();
  const backend = fakeBackend({ userId: 'u_1' });
  const bridge = createAuthBridge({
    browserWindowFactory: factory,
    tokens,
    backendClient: backend,
    signInUrl: 'https://clerk.test/sign-in',
    callbackPrefix: 'structureview://auth-callback',
    ...overrides,
  });
  return { bridge, factory, win, tokens, backend };
}

describe('createAuthBridge', () => {
  test('throws when required deps are missing', () => {
    expect(() => createAuthBridge()).toThrow();
  });

  test('signIn() opens a window pointed at signInUrl', async () => {
    const { bridge, win, factory } = makeBridge();
    const promise = bridge.signIn();
    expect(factory).toHaveBeenCalled();
    expect(win.loadedUrl).toBe('https://clerk.test/sign-in');
    win._fireNavigate('structureview://auth-callback#__session=tok-abc');
    await promise;
  });

  test('signIn() resolves with user after token captured from callback URL', async () => {
    const { bridge, win, tokens, backend } = makeBridge();
    const promise = bridge.signIn();
    win._fireNavigate('structureview://auth-callback#__session=tok-abc');
    const user = await promise;
    expect(user).toEqual({ userId: 'u_1' });
    expect(tokens.set).toHaveBeenCalledWith('tok-abc');
    expect(backend.me).toHaveBeenCalled();
    expect(win.closed).toBe(true);
  });

  test('signIn() also accepts ?__session=<tok> query-string form', async () => {
    const { bridge, win, tokens } = makeBridge();
    const promise = bridge.signIn();
    win._fireNavigate('structureview://auth-callback?__session=tok-xyz&state=foo');
    await promise;
    expect(tokens.set).toHaveBeenCalledWith('tok-xyz');
  });

  test('signIn() rejects when the user closes the window without signing in', async () => {
    const { bridge, win } = makeBridge();
    const promise = bridge.signIn();
    win._fireClosed();
    await expect(promise).rejects.toThrow(/cancel/i);
  });

  test('signIn() rejects when callback URL has no token', async () => {
    const { bridge, win } = makeBridge();
    const promise = bridge.signIn();
    win._fireNavigate('structureview://auth-callback#error=denied');
    await expect(promise).rejects.toThrow(/token/i);
  });

  test('signOut() clears the token and does not call backend', async () => {
    const { bridge, tokens, backend } = makeBridge();
    await bridge.signOut();
    expect(tokens.clear).toHaveBeenCalled();
    expect(backend.me).not.toHaveBeenCalled();
  });

  test('getCurrentUser() delegates to backendClient.me', async () => {
    const { bridge, backend } = makeBridge();
    const user = await bridge.getCurrentUser();
    expect(user).toEqual({ userId: 'u_1' });
    expect(backend.me).toHaveBeenCalled();
  });

  test('non-callback navigation events do not resolve the sign-in promise', async () => {
    const { bridge, win, tokens } = makeBridge();
    const promise = bridge.signIn();
    win._fireNavigate('https://clerk.test/sign-in/step-2');
    win._fireNavigate('https://clerk.test/sign-in/step-3');
    // still pending — assert by racing a microtask flush
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);
    // now fire the real callback to clean up the pending promise
    win._fireNavigate('structureview://auth-callback#__session=ok');
    await promise;
    expect(tokens.set).toHaveBeenCalledWith('ok');
  });
});
