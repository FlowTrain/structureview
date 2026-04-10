'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('structview', {
  // File operations
  openFileDialog:   ()         => ipcRenderer.invoke('open-file-dialog'),
  openFolderDialog: ()         => ipcRenderer.invoke('open-folder-dialog'),
  readFile:         (filePath) => ipcRenderer.invoke('read-file', filePath),
  openExternal:     (url)      => ipcRenderer.invoke('open-external', url),
  getAppVersion:    ()         => ipcRenderer.invoke('get-app-version'),

  // Event listeners (main → renderer)
  onFileLoaded:    (cb) => ipcRenderer.on('file-loaded',    (_e, d) => cb(d)),
  onFileChanged:   (cb) => ipcRenderer.on('file-changed',   (_e, d) => cb(d)),
  onFileError:     (cb) => ipcRenderer.on('file-error',     (_e, d) => cb(d)),
  onFolderScanned: (cb) => ipcRenderer.on('folder-scanned', (_e, d) => cb(d)),
  onShowAbout:     (cb) => ipcRenderer.on('show-about',     ()      => cb()),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
