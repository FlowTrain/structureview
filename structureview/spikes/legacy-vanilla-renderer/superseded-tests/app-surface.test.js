/**
 * Surface-only characterisation for src/renderer/js/app.js
 * app.js is an IIFE that wires window.structview event handlers on load.
 * It references DocSearch/Sidebar/Tabs/etc. as bare globals (script-tag
 * load order in production), so this test mirrors them onto `global`.
 */
const { installFakeWindow, uninstallFakeWindow } = require('./__helpers__/dom-stub');

function installRendererGlobals() {
  global.Sidebar = { init: () => {}, addFile: () => {}, addFiles: () => {} };
  global.Tabs = {
    open: () => {},
    close: () => {},
    switchTo: () => {},
    updateContent: () => {},
    has: () => false,
    getActive: () => null,
    getActivePath: () => null,
    toggleRaw: () => {},
  };
  global.DocSearch = { init: () => {}, rerun: () => {}, clearHighlights: () => {} };
  global.MDRenderer = { render: () => '' };
  global.JSONRenderer = { render: () => '', attachToggleHandlers: () => {} };
  // Mirror onto window for code that reads via window.*
  global.window.Sidebar = global.Sidebar;
  global.window.Tabs = global.Tabs;
  global.window.DocSearch = global.DocSearch;
  global.window.MDRenderer = global.MDRenderer;
  global.window.JSONRenderer = global.JSONRenderer;
}

function uninstallRendererGlobals() {
  delete global.Sidebar;
  delete global.Tabs;
  delete global.DocSearch;
  delete global.MDRenderer;
  delete global.JSONRenderer;
}

afterEach(() => {
  uninstallRendererGlobals();
  uninstallFakeWindow();
});

describe('app.js — surface', () => {
  test('module loads without throwing under stubbed DOM + globals', () => {
    installFakeWindow();
    installRendererGlobals();
    expect(() => {
      jest.isolateModules(() => require('../src/renderer/js/app'));
    }).not.toThrow();
  });

  test('subscribes to file-loaded / file-changed / file-error / folder-scanned / show-about', () => {
    installFakeWindow();
    installRendererGlobals();
    const subscribed = [];
    global.window.structview.onFileLoaded = () => subscribed.push('file-loaded');
    global.window.structview.onFileChanged = () => subscribed.push('file-changed');
    global.window.structview.onFileError = () => subscribed.push('file-error');
    global.window.structview.onFolderScanned = () => subscribed.push('folder-scanned');
    global.window.structview.onShowAbout = () => subscribed.push('show-about');

    jest.isolateModules(() => require('../src/renderer/js/app'));
    expect(subscribed.sort()).toEqual(
      ['file-changed', 'file-error', 'file-loaded', 'folder-scanned', 'show-about'].sort()
    );
  });
});
