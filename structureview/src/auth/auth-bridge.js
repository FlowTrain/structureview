/**
 * auth-bridge — Clerk sign-in flow orchestrator.
 *
 * SRP: opens the Clerk hosted sign-in page in a BrowserWindow, listens for
 * navigation to a known callback URL, extracts the session token, persists
 * it, and resolves with the authenticated user.
 *
 * DIP: every electron-specific dependency is injected, so tests run pure-JS.
 */
'use strict';

function extractToken(url) {
  const m = /[?#&]__session=([^&]+)/.exec(url || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function createAuthBridge({
  browserWindowFactory,
  tokens,
  backendClient,
  signInUrl,
  callbackPrefix,
} = {}) {
  if (!browserWindowFactory || !tokens || !backendClient || !signInUrl || !callbackPrefix) {
    throw new Error('createAuthBridge: all dependencies are required');
  }

  function captureCallback(win) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };
      win.on('will-navigate', (url) => {
        if (!url.startsWith(callbackPrefix)) return;
        const token = extractToken(url);
        // Settle BEFORE closing — close() may fire 'closed' synchronously.
        if (token) finish(resolve, token);
        else finish(reject, new Error('Sign-in callback contained no token'));
        win.close();
      });
      win.on('closed', () => {
        finish(reject, new Error('Sign-in cancelled'));
      });
    });
  }

  async function signIn() {
    const win = browserWindowFactory();
    win.loadURL(signInUrl);
    const token = await captureCallback(win);
    await tokens.set(token);
    return backendClient.me();
  }

  async function signOut() {
    await tokens.clear();
  }

  function getCurrentUser() {
    return backendClient.me();
  }

  return { signIn, signOut, getCurrentUser };
}

module.exports = { createAuthBridge };
