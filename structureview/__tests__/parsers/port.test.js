/**
 * Contract test for the ParserPort shape (ADR-0005).
 *
 * Every parser implementation must satisfy validateParserPort().
 * RED first: validator doesn't exist yet.
 */
const { validateParserPort } = require('../../src/parsers/parser-port');

const validPort = {
  id: 'md',
  extensions: ['md', 'markdown'],
  parse: (raw) => ({ type: 'md', raw }),
  outline: (_doc) => [],
  render: (_doc) => '',
};

describe('validateParserPort', () => {
  test('accepts a valid port', () => {
    expect(() => validateParserPort(validPort)).not.toThrow();
  });

  test('rejects when id is missing', () => {
    const bad = { ...validPort, id: undefined };
    expect(() => validateParserPort(bad)).toThrow(/id/);
  });

  test('rejects when extensions is not a non-empty array', () => {
    expect(() => validateParserPort({ ...validPort, extensions: [] })).toThrow(/extensions/);
    expect(() => validateParserPort({ ...validPort, extensions: 'md' })).toThrow(/extensions/);
  });

  test('rejects when parse is not a function', () => {
    expect(() => validateParserPort({ ...validPort, parse: 'nope' })).toThrow(/parse/);
  });

  test('rejects when outline is not a function', () => {
    expect(() => validateParserPort({ ...validPort, outline: null })).toThrow(/outline/);
  });

  test('rejects when render is not a function', () => {
    expect(() => validateParserPort({ ...validPort, render: 42 })).toThrow(/render/);
  });

  test('returns the same port when valid (chainable)', () => {
    expect(validateParserPort(validPort)).toBe(validPort);
  });
});
