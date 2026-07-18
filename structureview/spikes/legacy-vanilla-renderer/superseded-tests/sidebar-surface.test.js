/**
 * Surface-only characterisation for src/renderer/js/renderer/sidebar.js
 * Pins the public method names exposed on window.Sidebar.
 * Deeper coverage deferred to Phase 1 when this file gets refactored.
 */
const { installFakeWindow, uninstallFakeWindow } = require('./__helpers__/dom-stub');

afterEach(uninstallFakeWindow);

describe('sidebar.js — surface', () => {
  test('module loads without throwing under stubbed DOM', () => {
    installFakeWindow();
    expect(() => {
      jest.isolateModules(() => require('../src/renderer/js/renderer/sidebar'));
    }).not.toThrow();
  });

  test('exposes Sidebar with the documented method names', () => {
    installFakeWindow();
    jest.isolateModules(() => require('../src/renderer/js/renderer/sidebar'));
    expect(Object.keys(global.window.Sidebar).sort()).toEqual(
      ['addFile', 'addFiles', 'init', 'removeFile', 'setActive'].sort()
    );
  });
});
