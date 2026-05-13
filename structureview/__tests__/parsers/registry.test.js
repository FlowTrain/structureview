/**
 * ParserRegistry — resolves file extensions to ParserPort instances.
 * Test-first.
 */
const { createRegistry } = require('../../src/parsers/registry');

const mdPort = {
  id: 'md',
  extensions: ['md', 'markdown'],
  parse: () => ({}),
  outline: () => [],
  render: () => '',
};

const jsonPort = {
  id: 'json',
  extensions: ['json'],
  parse: () => ({}),
  outline: () => [],
  render: () => '',
};

describe('createRegistry', () => {
  test('starts empty (all() returns [])', () => {
    expect(createRegistry().all()).toEqual([]);
  });

  test('register() adds a port; all() returns it', () => {
    const r = createRegistry();
    r.register(mdPort);
    expect(r.all()).toContain(mdPort);
  });

  test('resolveByExt() returns the port whose extensions include the ext', () => {
    const r = createRegistry();
    r.register(mdPort);
    r.register(jsonPort);
    expect(r.resolveByExt('md')).toBe(mdPort);
    expect(r.resolveByExt('markdown')).toBe(mdPort);
    expect(r.resolveByExt('json')).toBe(jsonPort);
  });

  test('resolveByExt() is case-insensitive and tolerates a leading dot', () => {
    const r = createRegistry();
    r.register(mdPort);
    expect(r.resolveByExt('MD')).toBe(mdPort);
    expect(r.resolveByExt('.md')).toBe(mdPort);
  });

  test('resolveByExt() returns null when no parser matches', () => {
    const r = createRegistry();
    r.register(mdPort);
    expect(r.resolveByExt('xml')).toBeNull();
  });

  test('register() rejects ports that fail the shape validator', () => {
    const r = createRegistry();
    expect(() => r.register({ id: 'broken' })).toThrow();
  });

  test('register() rejects a port whose id collides with an existing one', () => {
    const r = createRegistry();
    r.register(mdPort);
    expect(() => r.register({ ...mdPort })).toThrow(/already registered/);
  });

  test('register() rejects an extension already claimed by another port', () => {
    const r = createRegistry();
    r.register(mdPort);
    const otherMd = { ...jsonPort, id: 'md2', extensions: ['md'] };
    expect(() => r.register(otherMd)).toThrow(/extension .* already/);
  });
});
