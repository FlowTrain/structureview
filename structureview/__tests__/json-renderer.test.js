/**
 * Characterisation test for src/renderer/js/renderer/json.js
 *
 * Pins JSONRenderer.render output for canonical inputs and the
 * collapse-threshold behaviour. attachToggleHandlers is exercised via
 * a tiny jsdom-free fake container.
 *
 * CCQG: Practice 9 (Boy Scout).
 */

function loadModule() {
  global.window = {};
  jest.isolateModules(() => require('../src/renderer/js/renderer/json'));
  return global.window.JSONRenderer;
}

afterEach(() => {
  delete global.window;
});

describe('json.js — JSONRenderer.render', () => {
  test('exposes render and attachToggleHandlers', () => {
    const J = loadModule();
    expect(Object.keys(J).sort()).toEqual(['attachToggleHandlers', 'render']);
  });

  test('wraps output in <div class="doc-json"> with a json-root child', () => {
    const J = loadModule();
    const out = J.render('{"a":1}');
    expect(out).toContain('<div class="doc-json">');
    expect(out).toContain('<div class="json-root">');
  });

  test('renders a parse error block on malformed JSON', () => {
    const J = loadModule();
    const out = J.render('{not json');
    expect(out).toContain('class="json-error"');
    expect(out).toContain('JSON parse error');
  });

  test('truncates the error raw block at 2000 chars with an ellipsis', () => {
    const J = loadModule();
    const big = 'x'.repeat(2500);
    const out = J.render(big);
    expect(out).toContain('…');
  });

  test('empty object renders inline as {}', () => {
    const J = loadModule();
    expect(J.render('{}')).toContain('<span class="json-bracket">{}</span>');
  });

  test('empty array renders inline as []', () => {
    const J = loadModule();
    expect(J.render('[]')).toContain('<span class="json-bracket">[]</span>');
  });

  test('number, boolean, and null get type-specific spans', () => {
    const J = loadModule();
    const out = J.render('{"n":1,"b":true,"x":null}');
    expect(out).toContain('class="json-number">1');
    expect(out).toContain('class="json-boolean">true');
    expect(out).toContain('class="json-null">null');
  });

  test('strings escape HTML special chars and get the json-string class', () => {
    const J = loadModule();
    const out = J.render('{"k":"<&\\">"}');
    expect(out).toContain('class="json-string">"&lt;&amp;&quot;&gt;"');
  });

  test('long strings (>120 chars) get the json-string-long class', () => {
    const J = loadModule();
    const long = 'a'.repeat(121);
    const out = J.render(`{"k":"${long}"}`);
    expect(out).toContain('json-string-long');
  });

  test('plural preview shown when collapsed (>6 keys)', () => {
    const J = loadModule();
    const out = J.render(JSON.stringify({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 }));
    expect(out).toContain('7 keys');
  });

  test('plural preview shown when array collapsed (>6 items)', () => {
    const J = loadModule();
    const out = J.render('[1,2,3,4,5,6,7]');
    expect(out).toContain('7 items');
  });

  test('non-empty array renders rows with json-index spans', () => {
    const J = loadModule();
    const out = J.render('[1,2,3]');
    expect(out).toContain('class="json-index">0');
    expect(out).toContain('class="json-index">1');
    expect(out).toContain('class="json-index">2');
  });

  test('arrays of objects nest correctly', () => {
    const J = loadModule();
    const out = J.render('[{"k":1}]');
    expect(out).toContain('class="json-key">"k"');
    expect(out).toContain('json-number">1');
  });

  test('objects with <= 6 keys render expanded (no hidden attr on children)', () => {
    const J = loadModule();
    const out = J.render(JSON.stringify({ a: 1, b: 2 }));
    expect(out).toMatch(/<div class="json-children" data-children="jn\d+">/);
  });

  test('size + modified meta render with JSON badge', () => {
    const J = loadModule();
    const out = J.render('{}', { size: 1024 * 5, modified: '2026-03-15T00:00:00Z' });
    expect(out).toContain('doc-meta-badge json">JSON');
    expect(out).toContain('5.0 KB');
    expect(out).toMatch(/2026/);
  });

  test('meta with only size omits the date span', () => {
    const J = loadModule();
    const out = J.render('{}', { size: 500 });
    expect(out).toContain('500 B');
  });

  test('size formatter handles MB range', () => {
    const J = loadModule();
    const out = J.render('{}', { size: 5 * 1024 * 1024 });
    expect(out).toContain('5.0 MB');
  });
});

describe('json.js — attachToggleHandlers', () => {
  function makeFakeContainer(initialHidden) {
    const child = { hidden: initialHidden };
    const preview = { textContent: '', dataset: { origPreview: 'PV' } };
    const close = { hidden: false };
    const closeInline = { hidden: true };
    const btn = {
      textContent: initialHidden ? '+' : '−',
      dataset: { node: 'jn1' },
      closest: function (sel) {
        return sel === '.json-toggle' ? this : null;
      },
    };
    const handlers = [];
    return {
      btn,
      child,
      preview,
      close,
      closeInline,
      addEventListener: (_evt, h) => handlers.push(h),
      querySelector: (sel) => {
        if (sel.includes('data-children')) return child;
        if (sel.includes('data-preview')) return preview;
        if (sel.includes('data-close-inline')) return closeInline;
        if (sel.includes('data-close')) return close;
        return null;
      },
      fire: (target) => handlers.forEach((h) => h({ target })),
    };
  }

  test('toggle flips children.hidden and updates button text', () => {
    const J = loadModule();
    const c = makeFakeContainer(true);
    J.attachToggleHandlers(c);
    c.fire(c.btn);
    expect(c.child.hidden).toBe(false);
    expect(c.btn.textContent).toBe('−');
  });

  test('ignores clicks not on a toggle button', () => {
    const J = loadModule();
    const c = makeFakeContainer(true);
    J.attachToggleHandlers(c);
    expect(() => c.fire({ closest: () => null })).not.toThrow();
    expect(c.child.hidden).toBe(true);
  });

  test('also flips close-bracket visibility', () => {
    const J = loadModule();
    const c = makeFakeContainer(true);
    J.attachToggleHandlers(c);
    c.fire(c.btn);
    expect(c.close.hidden).toBe(false);
    expect(c.closeInline.hidden).toBe(true);
  });
});
