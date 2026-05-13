/**
 * setup-auth — composition root for desktop auth/billing wiring.
 *
 * Returns false (no-op) when any dependency / env is missing — so dev
 * builds without secrets, and the legacy test environment, still boot.
 *
 * Production wiring (inside main/index.js's app.whenReady()):
 *
 *   setupDesktopAuth({
 *     ipcMain,
 *     browserWindowFactory: () => new BrowserWindow({ width: 480, height: 720 }),
 *     shell,
 *     keytar: require('keytar'),
 *     fetch: globalThis.fetch,
 *     env: process.env,
 *   });
 */
'use strict';

const { createTokenStore } = require('../auth/token-store');
const { createBackendClient } = require('../auth/backend-client');
const { createAuthBridge } = require('../auth/auth-bridge');
const { createUpgradeBridge } = require('../auth/upgrade-bridge');
const { registerAuthIpc } = require('./ipc-auth');

const REQUIRED_ENV = [
  'STRUCTUREVIEW_API_URL',
  'STRUCTUREVIEW_CLERK_SIGN_IN_URL',
  'STRUCTUREVIEW_AUTH_CALLBACK_PREFIX',
];

function hasAllEnv(env) {
  return REQUIRED_ENV.every((k) => Boolean(env[k]));
}

function setupDesktopAuth({ ipcMain, browserWindowFactory, shell, keytar, fetch, env }) {
  if (!keytar || !fetch || !browserWindowFactory) return false;
  if (!hasAllEnv(env)) return false;

  const tokens = createTokenStore({ keytar });
  const backendClient = createBackendClient({
    baseUrl: env.STRUCTUREVIEW_API_URL,
    tokens,
    fetch,
  });
  const authBridge = createAuthBridge({
    browserWindowFactory,
    tokens,
    backendClient,
    signInUrl: env.STRUCTUREVIEW_CLERK_SIGN_IN_URL,
    callbackPrefix: env.STRUCTUREVIEW_AUTH_CALLBACK_PREFIX,
  });
  const upgradeBridge = createUpgradeBridge({ shell, backendClient });

  registerAuthIpc({ ipcMain, authBridge, upgradeBridge });
  return true;
}

module.exports = { setupDesktopAuth };
