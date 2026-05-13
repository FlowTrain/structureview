/**
 * Markdown ParserPort — ADR-0005 conformant.
 * Uses `marked.lexer()` to build a heading-based outline.
 */
const { validateParserPort } = require('../../src/parsers/parser-port');
const mdPort = require('../../src/parsers/markdown-port');

describe('mdPort — contract conformance', () => {
  test('satisfies the ParserPort shape', () => {
    expect(() => validateParserPort(mdPort)).not.toThrow();
  });

  test('id is "md" and claims md + markdown extensions', () => {
    expect(mdPort.id).toBe('md');
    expect(mdPort.extensions).toEqual(expect.arrayContaining(['md', 'markdown']));
  });
});

describe('mdPort.parse', () => {
  test('returns a doc with type="md" and the raw text preserved', () => {
    const doc = mdPort.parse('# hello');
    expect(doc.type).toBe('md');
    expect(doc.raw).toBe('# hello');
    expect(Array.isArray(doc.value)).toBe(true); // token stream
  });

  test('empty input returns a doc with zero tokens', () => {
    expect(mdPort.parse('').value.length).toBe(0);
  });

  test('falsy input is tolerated and produces zero tokens', () => {
    expect(mdPort.parse(undefined).value.length).toBe(0);
  });
});

describe('mdPort.outline', () => {
  test('returns [] for content with no headings', () => {
    expect(mdPort.outline(mdPort.parse('just some text'))).toEqual([]);
  });

  test('returns [] for null/undefined doc (defensive)', () => {
    expect(mdPort.outline(null)).toEqual([]);
    expect(mdPort.outline(undefined)).toEqual([]);
    expect(mdPort.outline({ value: 'not array' })).toEqual([]);
  });

  test('emits one node per heading, depth = heading level - 1', () => {
    const out = mdPort.outline(mdPort.parse('# A\n## B\n### C\n# D'));
    expect(out.map((n) => ({ label: n.label, depth: n.depth }))).toEqual([
      { label: 'A', depth: 0 },
      { label: 'B', depth: 1 },
      { label: 'C', depth: 2 },
      { label: 'D', depth: 0 },
    ]);
  });

  test('preserves heading text verbatim including punctuation', () => {
    const out = mdPort.outline(mdPort.parse('# Hello, World!'));
    expect(out[0].label).toBe('Hello, World!');
  });

  test('ignores non-heading tokens', () => {
    const md = '# Title\n\nA paragraph.\n\n- item\n- item\n\n## Section';
    const out = mdPort.outline(mdPort.parse(md));
    expect(out.map((n) => n.label)).toEqual(['Title', 'Section']);
  });
});

describe('mdPort.render', () => {
  test('returns an HTML string', () => {
    const html = mdPort.render(mdPort.parse('# hi'));
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  test('contains the heading text', () => {
    expect(mdPort.render(mdPort.parse('# hello'))).toMatch(/hello/);
  });
});
