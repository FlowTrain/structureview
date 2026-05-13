/**
 * Characterisation test for src/renderer/js/renderer/markdown.js
 *
 * Pins the MDRenderer public surface and the three custom token renderers
 * (link, code, listitem) passed to marked.use. Stubs `marked` + `hljs`.
 *
 * CCQG: Practice 9 (Boy Scout). Tests pin behaviour, not desired correctness.
 */

let capturedRenderer;

function loadModuleWithGlobals({ withMarked = true, withHljs = true } = {}) {
  capturedRenderer = null;
  global.window = {};
  if (withMarked) {
    global.marked = {
      use: (cfg) => {
        capturedRenderer = cfg.renderer;
      },
      parse: (s) => `<MARKED:${s}>`,
    };
    global.window.marked = global.marked;
  }
  if (withHljs) {
    global.hljs = {
      getLanguage: (lang) => (lang === 'js' ? { name: 'js' } : null),
      highlight: (_code, opts) => ({ value: `<HL:${opts.language}>` }),
      highlightAuto: (_code) => ({ value: '<HL:auto>' }),
    };
    global.window.hljs = global.hljs;
  }
  jest.isolateModules(() => require('../src/renderer/js/renderer/markdown'));
  return global.window.MDRenderer;
}

afterEach(() => {
  delete global.window;
  delete global.marked;
  delete global.hljs;
});

describe('markdown.js — MDRenderer', () => {
  test('exposes a single render() function on window.MDRenderer', () => {
    const MD = loadModuleWithGlobals();
    expect(Object.keys(MD)).toEqual(['render']);
    expect(typeof MD.render).toBe('function');
  });

  test('falls back to escaped <pre> when marked is unavailable', () => {
    const MD = loadModuleWithGlobals({ withMarked: false, withHljs: false });
    const out = MD.render('<b>hi</b> & bye');
    expect(out).toBe('<pre class="doc-raw">&lt;b&gt;hi&lt;/b&gt; &amp; bye</pre>');
  });

  test('wraps parsed output in <div class="doc-md"> when marked is present', () => {
    const MD = loadModuleWithGlobals();
    const out = MD.render('# hello');
    expect(out).toContain('<div class="doc-md">');
    expect(out).toContain('<MARKED:# hello>');
  });

  test('renders a meta line with size + date when meta is provided', () => {
    const MD = loadModuleWithGlobals();
    const out = MD.render('x', { size: 2048, modified: '2026-04-01T00:00:00Z' });
    expect(out).toContain('class="doc-meta-badge md">MD</span>');
    expect(out).toContain('2.0 KB');
    expect(out).toMatch(/2026/);
  });

  describe('custom link renderer', () => {
    test('produces an <a> with the sv-external-link class and escaped href', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x'); // triggers configure -> capturedRenderer
      const html = capturedRenderer.link({ href: 'https://a.test?x="y"', text: 'go' });
      expect(html).toBe('<a href="https://a.test?x=&quot;y&quot;" class="sv-external-link">go</a>');
    });

    test('includes title attribute when present', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      const html = capturedRenderer.link({ href: '/a', title: 't"x', text: 'go' });
      expect(html).toContain(' title="t&quot;x"');
    });
  });

  describe('custom code renderer', () => {
    test('uses hljs.highlight when lang is recognised', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      const html = capturedRenderer.code({ text: 'const a=1;', lang: 'js' });
      expect(html).toContain('<HL:js>');
      expect(html).toContain('class="code-lang-label">js</span>');
      expect(html).toContain('language-js"');
    });

    test('falls back to highlightAuto when lang is unknown', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      const html = capturedRenderer.code({ text: 'xx', lang: 'unknownlang' });
      expect(html).toContain('<HL:auto>');
    });

    test('emits no lang label when lang is missing', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      const html = capturedRenderer.code({ text: 'plain', lang: undefined });
      expect(html).not.toContain('code-lang-label');
    });
  });

  describe('custom listitem renderer', () => {
    test('emits a checked task list item', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      expect(capturedRenderer.listitem({ text: 'do', task: true, checked: true })).toBe(
        '<li><input type="checkbox" checked disabled> do</li>\n'
      );
    });

    test('emits an unchecked task list item', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      expect(capturedRenderer.listitem({ text: 'do', task: true, checked: false })).toBe(
        '<li><input type="checkbox"  disabled> do</li>\n'
      );
    });

    test('emits a plain list item when not a task', () => {
      loadModuleWithGlobals();
      global.window.MDRenderer.render('x');
      expect(capturedRenderer.listitem({ text: 'hi', task: false })).toBe('<li>hi</li>\n');
    });
  });

  test('configure() is idempotent — second render does not call marked.use again', () => {
    const MD = loadModuleWithGlobals();
    let useCalls = 0;
    global.marked.use = () => {
      useCalls += 1;
    };
    global.window.marked = global.marked;
    MD.render('a');
    MD.render('b');
    expect(useCalls).toBeLessThanOrEqual(1);
  });
});
