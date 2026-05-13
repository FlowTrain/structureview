/**
 * JSON ParserPort — first concrete ParserPort implementation (ADR-0005).
 * Contract-conforms to validateParserPort; adds outline() over the value tree.
 */
const { validateParserPort } = require('../../src/parsers/parser-port');
const jsonPort = require('../../src/parsers/json-port');

describe('jsonPort — contract conformance', () => {
  test('satisfies the ParserPort shape', () => {
    expect(() => validateParserPort(jsonPort)).not.toThrow();
  });

  test('has id "json" and claims the json extension', () => {
    expect(jsonPort.id).toBe('json');
    expect(jsonPort.extensions).toContain('json');
  });
});

describe('jsonPort.parse', () => {
  test('parses a valid object', () => {
    const doc = jsonPort.parse('{"a":1}');
    expect(doc.type).toBe('json');
    expect(doc.value).toEqual({ a: 1 });
    expect(doc.raw).toBe('{"a":1}');
    expect(doc.error).toBeUndefined();
  });

  test('parses a valid array', () => {
    const doc = jsonPort.parse('[1,2,3]');
    expect(doc.value).toEqual([1, 2, 3]);
  });

  test('returns a doc with .error set on malformed input (does not throw)', () => {
    const doc = jsonPort.parse('{not json');
    expect(doc.value).toBeNull();
    expect(doc.error).toMatch(/JSON/i);
  });
});

describe('jsonPort.outline', () => {
  test('returns [] for primitives', () => {
    expect(jsonPort.outline(jsonPort.parse('"hi"'))).toEqual([]);
    expect(jsonPort.outline(jsonPort.parse('42'))).toEqual([]);
    expect(jsonPort.outline(jsonPort.parse('true'))).toEqual([]);
    expect(jsonPort.outline(jsonPort.parse('null'))).toEqual([]);
  });

  test('returns one node per top-level object key', () => {
    const outline = jsonPort.outline(jsonPort.parse('{"a":1,"b":2}'));
    expect(outline.map((n) => n.label)).toEqual(['a', 'b']);
    expect(outline.every((n) => n.depth === 0)).toBe(true);
  });

  test('returns one node per array index labeled [i]', () => {
    const outline = jsonPort.outline(jsonPort.parse('[10,20,30]'));
    expect(outline.map((n) => n.label)).toEqual(['[0]', '[1]', '[2]']);
  });

  test('nests children for nested objects and arrays', () => {
    const outline = jsonPort.outline(jsonPort.parse('{"a":{"b":1,"c":[1,2]}}'));
    expect(outline[0].label).toBe('a');
    expect(outline[0].children.map((n) => n.label)).toEqual(['b', 'c']);
    expect(outline[0].children[1].children.map((n) => n.label)).toEqual(['[0]', '[1]']);
  });

  test('depth increases with nesting', () => {
    const outline = jsonPort.outline(jsonPort.parse('{"a":{"b":{"c":1}}}'));
    expect(outline[0].depth).toBe(0);
    expect(outline[0].children[0].depth).toBe(1);
    expect(outline[0].children[0].children[0].depth).toBe(2);
  });

  test('returns [] when the doc has a parse error', () => {
    expect(jsonPort.outline(jsonPort.parse('{broken'))).toEqual([]);
  });
});

describe('jsonPort.render', () => {
  test('returns a string for a parsed doc', () => {
    expect(typeof jsonPort.render(jsonPort.parse('{"a":1}'))).toBe('string');
  });

  test('renders a parse error block when the doc has an error', () => {
    const html = jsonPort.render(jsonPort.parse('{broken'));
    expect(html).toContain('json-error');
  });
});
