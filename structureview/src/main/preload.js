'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('structview', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Event listeners (main → renderer)
  onFileLoaded: (cb) => ipcRenderer.on('file-loaded', (_e, d) => cb(d)),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (_e, d) => cb(d)),
  onFileError: (cb) => ipcRenderer.on('file-error', (_e, d) => cb(d)),
  onFolderScanned: (cb) => ipcRenderer.on('folder-scanned', (_e, d) => cb(d)),
  onShowAbout: (cb) => ipcRenderer.on('show-about', () => cb()),

  // Auth + entitlements (Clerk-backed; ADR-0001)
  auth: {
    signIn: () => ipcRenderer.invoke('auth:sign-in'),
    signOut: () => ipcRenderer.invoke('auth:sign-out'),
    currentUser: () => ipcRenderer.invoke('auth:current-user'),
  },

  // Billing (Stripe-backed; ADR-0002)
  billing: {
    startUpgrade: (plan) => ipcRenderer.invoke('billing:start-upgrade', plan),
    refreshEntitlement: () => ipcRenderer.invoke('billing:refresh-entitlement'),
  },

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
