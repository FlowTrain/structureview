/**
 * Surface-only characterisation for src/renderer/js/renderer/tabs.js
 * Pins window.Tabs public methods.
 */
const { installFakeWindow, uninstallFakeWindow } = require('./__helpers__/dom-stub');

afterEach(uninstallFakeWindow);

describe('tabs.js — surface', () => {
  test('module loads without throwing', () => {
    installFakeWindow();
    expect(() => {
      jest.isolateModules(() => require('../src/renderer/js/renderer/tabs'));
    }).not.toThrow();
  });

  test('exposes Tabs with the documented method names', () => {
    installFakeWindow();
    jest.isolateModules(() => require('../src/renderer/js/renderer/tabs'));
    expect(Object.keys(global.window.Tabs).sort()).toEqual(
      [
        'close',
        'getActive',
        'getActivePath',
        'has',
        'open',
        'switchTo',
        'toggleRaw',
        'updateContent',
      ].sort()
    );
  });
});
