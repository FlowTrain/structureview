/**
 * Registers auth + billing IPC handlers on ipcMain.
 *
 * Wires the renderer-visible channels (consumed by preload.js):
 *   - auth:sign-in              → authBridge.signIn()
 *   - auth:sign-out             → authBridge.signOut()
 *   - auth:current-user         → authBridge.getCurrentUser()
 *   - billing:start-upgrade     → upgradeBridge.startUpgrade(plan)
 *   - billing:refresh-entitlement → upgradeBridge.refreshEntitlement()
 *
 * SRP: only IPC wiring. Bridges are constructed elsewhere.
 */
'use strict';

function registerAuthIpc({ ipcMain, authBridge, upgradeBridge } = {}) {
  if (!ipcMain) throw new Error('registerAuthIpc: ipcMain is required');
  if (!authBridge) throw new Error('registerAuthIpc: authBridge is required');
  if (!upgradeBridge) throw new Error('registerAuthIpc: upgradeBridge is required');

  ipcMain.handle('auth:sign-in', () => authBridge.signIn());
  ipcMain.handle('auth:sign-out', () => authBridge.signOut());
  ipcMain.handle('auth:current-user', () => authBridge.getCurrentUser());
  ipcMain.handle('billing:start-upgrade', (_e, plan) => upgradeBridge.startUpgrade(plan));
  ipcMain.handle('billing:refresh-entitlement', () => upgradeBridge.refreshEntitlement());
}

module.exports = { registerAuthIpc };
