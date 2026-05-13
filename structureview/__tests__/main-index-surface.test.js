/**
 * Surface-only characterisation for src/main/index.js
 * Pins the IPC handler channel names and app lifecycle hooks registered on load.
 */

const ipcHandlers = {};
const appOnHandlers = {};
let whenReadyCalled = false;

jest.mock('electron', () => ({
  app: {
    getVersion: () => '0.1.0',
    getPath: () => '/tmp',
    whenReady: () => {
      whenReadyCalled = true;
      return { then: (cb) => cb() };
    },
    on: (evt, h) => {
      appOnHandlers[evt] = h;
    },
    quit: () => {},
    isReady: () => true,
  },
  BrowserWindow: function BrowserWindow() {
    return {
      loadFile: () => {},
      once: () => {},
      on: () => {},
      webContents: { openDevTools: () => {}, send: () => {} },
      show: () => {},
      isDestroyed: () => false,
    };
  },
  ipcMain: {
    handle: (channel, h) => {
      ipcHandlers[channel] = h;
    },
    on: () => {},
  },
  dialog: {
    showOpenDialog: () => Promise.resolve({ canceled: true }),
    showMessageBox: () => Promise.resolve({ response: 0 }),
  },
  shell: { openExternal: () => Promise.resolve() },
  Menu: {
    buildFromTemplate: () => ({}),
    setApplicationMenu: () => {},
  },
}));

jest.mock('chokidar', () => ({
  watch: () => ({ add: () => {}, unwatch: () => {}, close: () => {}, on: () => {} }),
}));

beforeAll(() => {
  jest.isolateModules(() => require('../src/main/index'));
});

describe('main/index.js — registered IPC + lifecycle surface', () => {
  test('registers exactly these IPC handlers', () => {
    expect(Object.keys(ipcHandlers).sort()).toEqual(
      [
        'get-app-version',
        'open-external',
        'open-file-dialog',
        'open-folder-dialog',
        'read-file',
      ].sort()
    );
  });

  test('registers window-all-closed + activate + open-file app lifecycle hooks', () => {
    expect(Object.keys(appOnHandlers).sort()).toEqual(
      ['activate', 'open-file', 'window-all-closed'].sort()
    );
  });

  test('calls app.whenReady on load', () => {
    expect(whenReadyCalled).toBe(true);
  });

  test('get-app-version IPC handler returns the package version', () => {
    expect(ipcHandlers['get-app-version']()).toBe('0.1.0');
  });
});
