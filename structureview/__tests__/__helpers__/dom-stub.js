/**
 * Minimal DOM + window stub for renderer surface characterisation.
 * Returns a chainable fake element so the existing renderer code can
 * call .addEventListener, .appendChild, etc. during module init
 * without throwing.
 *
 * CCQG: characterisation helper — not production code, not coverage-counted.
 */
function fakeEl() {
  const el = {
    children: [],
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false,
    },
    dataset: {},
    style: {},
    hidden: false,
    textContent: '',
    innerHTML: '',
    value: '',
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: (c) => {
      el.children.push(c);
      return c;
    },
    removeChild: () => {},
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    closest: () => null,
    focus: () => {},
    blur: () => {},
    click: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => null,
  };
  return el;
}

function installFakeWindow(overrides = {}) {
  const document = {
    getElementById: () => fakeEl(),
    querySelector: () => fakeEl(),
    querySelectorAll: () => [],
    createElement: () => fakeEl(),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: fakeEl(),
  };
  global.window = {
    document,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { href: 'app://test' },
    structview: {
      openFileDialog: () => Promise.resolve(null),
      openFolderDialog: () => Promise.resolve(null),
      readFile: () => Promise.resolve({ content: '', meta: {} }),
      openExternal: () => Promise.resolve(),
      getAppVersion: () => Promise.resolve('0.1.0'),
      onFileLoaded: () => {},
      onFileChanged: () => {},
      onFileError: () => {},
      onFolderScanned: () => {},
      onShowAbout: () => {},
      removeAllListeners: () => {},
    },
    ...overrides,
  };
  global.document = document;
  return global.window;
}

function uninstallFakeWindow() {
  delete global.window;
  delete global.document;
}

module.exports = { fakeEl, installFakeWindow, uninstallFakeWindow };
