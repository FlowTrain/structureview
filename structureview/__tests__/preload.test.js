/**
 * Characterisation test for src/main/preload.js
 *
 * Pins the IPC surface (now extended with auth + billing namespaces per
 * sub-batches 9.x / 10.x).
 */

const exposed = {};
const ipcInvokes = [];
const ipcListeners = {};
const removedChannels = [];

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (name, api) => {
      exposed[name] = api;
    },
  },
  ipcRenderer: {
    invoke: (channel, arg) => {
      ipcInvokes.push({ channel, arg });
      return Promise.resolve({ channel, arg });
    },
    on: (channel, handler) => {
      ipcListeners[channel] = handler;
    },
    removeAllListeners: (channel) => {
      removedChannels.push(channel);
    },
  },
}));

beforeAll(() => {
  jest.isolateModules(() => {
    require('../src/main/preload');
  });
});

describe('preload.js — top-level surface', () => {
  test('exposes a single "structview" namespace on window', () => {
    expect(Object.keys(exposed)).toEqual(['structview']);
  });

  test('exposes the documented top-level keys', () => {
    expect(Object.keys(exposed.structview).sort()).toEqual(
      [
        'auth',
        'billing',
        'getAppVersion',
        'onFileChanged',
        'onFileError',
        'onFileLoaded',
        'onFolderScanned',
        'onShowAbout',
        'openExternal',
        'openFileDialog',
        'openFolderDialog',
        'readFile',
        'removeAllListeners',
      ].sort()
    );
  });

  // File-IO invoke channels
  test.each([
    ['openFileDialog', 'open-file-dialog', undefined],
    ['openFolderDialog', 'open-folder-dialog', undefined],
    ['getAppVersion', 'get-app-version', undefined],
    ['readFile', 'read-file', '/tmp/x.md'],
    ['openExternal', 'open-external', 'https://example.com'],
  ])('%s forwards to "%s" IPC channel', async (method, channel, arg) => {
    await (arg === undefined ? exposed.structview[method]() : exposed.structview[method](arg));
    expect(ipcInvokes).toContainEqual({ channel, arg });
  });

  // Event-style methods
  test.each([
    ['onFileLoaded', 'file-loaded', { path: '/a.md' }],
    ['onFileChanged', 'file-changed', { path: '/b.md' }],
    ['onFileError', 'file-error', { message: 'oops' }],
    ['onFolderScanned', 'folder-scanned', { files: [] }],
  ])('%s subscribes to "%s" and unwraps the event arg', (method, channel, payload) => {
    let received;
    exposed.structview[method]((d) => {
      received = d;
    });
    ipcListeners[channel]({ sender: 'ignored' }, payload);
    expect(received).toEqual(payload);
  });

  test('onShowAbout subscribes to "show-about" and calls back with no arg', () => {
    let called = false;
    exposed.structview.onShowAbout(() => {
      called = true;
    });
    ipcListeners['show-about']({ sender: 'ignored' });
    expect(called).toBe(true);
  });

  test('removeAllListeners forwards the channel name', () => {
    exposed.structview.removeAllListeners('file-changed');
    expect(removedChannels).toContain('file-changed');
  });
});

describe('preload.js — auth namespace', () => {
  test.each([
    ['signIn', 'auth:sign-in', undefined],
    ['signOut', 'auth:sign-out', undefined],
    ['currentUser', 'auth:current-user', undefined],
  ])('auth.%s forwards to "%s" IPC channel', async (method, channel) => {
    await exposed.structview.auth[method]();
    expect(ipcInvokes).toContainEqual({ channel, arg: undefined });
  });
});

describe('preload.js — billing namespace', () => {
  test('billing.startUpgrade forwards the plan argument', async () => {
    await exposed.structview.billing.startUpgrade('pro');
    expect(ipcInvokes).toContainEqual({ channel: 'billing:start-upgrade', arg: 'pro' });
  });

  test('billing.refreshEntitlement forwards to billing:refresh-entitlement', async () => {
    await exposed.structview.billing.refreshEntitlement();
    expect(ipcInvokes).toContainEqual({
      channel: 'billing:refresh-entitlement',
      arg: undefined,
    });
  });
});
