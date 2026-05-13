/**
 * Surface-only characterisation for src/renderer/js/renderer/search.js
 * Pins window.DocSearch public methods.
 */
const { installFakeWindow, uninstallFakeWindow } = require('./__helpers__/dom-stub');

afterEach(uninstallFakeWindow);

describe('search.js — surface', () => {
  test('module loads without throwing', () => {
    installFakeWindow();
    expect(() => {
      jest.isolateModules(() => require('../src/renderer/js/renderer/search'));
    }).not.toThrow();
  });

  test('exposes DocSearch with the documented method names', () => {
    installFakeWindow();
    jest.isolateModules(() => require('../src/renderer/js/renderer/search'));
    expect(Object.keys(global.window.DocSearch).sort()).toEqual(
      ['clearHighlights', 'init', 'rerun', 'run'].sort()
    );
  });
});
