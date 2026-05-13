/**
 * Design tokens — single source of truth for FlowTrain brand identity.
 *
 * Test-first per Practice 6. These assertions pin the brand to the brief
 * (StructureView Brief, Visual Identity section). Any drift from the
 * brand colours/fonts will break this test.
 */
const tokens = require('../src/tokens');
const { toCssVariables } = require('../src/tokens');

describe('design tokens — colour palette', () => {
  test('FlowTrain Blue is the documented brand primary', () => {
    expect(tokens.colors.brand.primary).toBe('#2BAEE4');
  });

  test('Gold is the documented accent', () => {
    expect(tokens.colors.brand.accent).toBe('#F0C050');
  });

  test('Steam Red is the documented warning colour', () => {
    expect(tokens.colors.brand.warning).toBe('#D44030');
  });

  test('background colours match the dark-theme load-bearing values', () => {
    expect(tokens.colors.bg.deep).toBe('#0a0a0f');
    expect(tokens.colors.bg.card).toBe('#12121a');
  });
});

describe('design tokens — typography', () => {
  test('mono stack starts with JetBrains Mono', () => {
    expect(tokens.fonts.mono).toMatch(/^['"]?JetBrains Mono/);
  });

  test('serif stack starts with Georgia', () => {
    expect(tokens.fonts.serif).toMatch(/^Georgia/);
  });
});

describe('design tokens — scales', () => {
  test('spacing scale uses a 4px base', () => {
    expect(tokens.spacing.xs).toBe(4);
    expect(tokens.spacing.sm).toBe(8);
    expect(tokens.spacing.md).toBe(16);
    expect(tokens.spacing.lg).toBe(24);
    expect(tokens.spacing.xl).toBe(32);
  });

  test('radius scale is sm/md/lg', () => {
    expect(Object.keys(tokens.radii).sort()).toEqual(['lg', 'md', 'sm']);
  });
});

describe('toCssVariables()', () => {
  test('emits a :root block with all brand colours as CSS custom properties', () => {
    const css = toCssVariables();
    expect(css).toContain(':root {');
    expect(css).toContain('--sv-color-brand-primary: #2BAEE4;');
    expect(css).toContain('--sv-color-brand-accent: #F0C050;');
    expect(css).toContain('--sv-color-bg-deep: #0a0a0f;');
    expect(css).toContain('}');
  });

  test('emits typography stacks as CSS variables', () => {
    const css = toCssVariables();
    expect(css).toContain('--sv-font-mono:');
    expect(css).toContain('--sv-font-serif:');
  });

  test('emits spacing scale with px units', () => {
    const css = toCssVariables();
    expect(css).toContain('--sv-space-xs: 4px;');
    expect(css).toContain('--sv-space-xl: 32px;');
  });

  test('output is deterministic (same call returns same string)', () => {
    expect(toCssVariables()).toBe(toCssVariables());
  });
});
