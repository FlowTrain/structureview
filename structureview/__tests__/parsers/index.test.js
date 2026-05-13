/**
 * parsers/index — pre-booted registry with all v1.0 ports registered.
 */
const parsers = require('../../src/parsers');

describe('parsers default export — booted registry', () => {
  test('exposes resolveByExt and all', () => {
    expect(typeof parsers.resolveByExt).toBe('function');
    expect(typeof parsers.all).toBe('function');
  });

  test('md and json ports are registered', () => {
    expect(parsers.resolveByExt('md').id).toBe('md');
    expect(parsers.resolveByExt('markdown').id).toBe('md');
    expect(parsers.resolveByExt('json').id).toBe('json');
  });

  test('all() returns both ports', () => {
    expect(
      parsers
        .all()
        .map((p) => p.id)
        .sort()
    ).toEqual(['json', 'md']);
  });

  test('resolveByExt is case-insensitive and tolerates leading dot', () => {
    expect(parsers.resolveByExt('.JSON').id).toBe('json');
  });

  test('still returns null for unregistered formats (xml/yaml/toml come later)', () => {
    expect(parsers.resolveByExt('xml')).toBeNull();
  });
});
