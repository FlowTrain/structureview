const { renderOutlineNode } = require('../../src/components/outline-node');

describe('renderOutlineNode', () => {
  test('label is required', () => {
    expect(() => renderOutlineNode({})).toThrow(/label/);
  });
  test('rejects negative depth', () => {
    expect(() => renderOutlineNode({ label: 'x', depth: -1 })).toThrow(/depth/);
  });
  test('rejects non-finite depth', () => {
    expect(() => renderOutlineNode({ label: 'x', depth: NaN })).toThrow(/depth/);
  });
  test('renders with the depth class and data-depth attribute', () => {
    const html = renderOutlineNode({ label: 'H1', depth: 0 });
    expect(html).toContain('sv-outline__node--depth-0');
    expect(html).toContain('data-depth="0"');
  });
  test('renders an anchor when href is provided', () => {
    const html = renderOutlineNode({ label: 'H1', href: '#h1' });
    expect(html).toContain('href="#h1"');
    expect(html).toContain('sv-outline__link');
  });
  test('renders a span when no href', () => {
    expect(renderOutlineNode({ label: 'H1' })).toContain('sv-outline__label');
  });
  test('renders children when childrenHtml provided', () => {
    const html = renderOutlineNode({ label: 'p', childrenHtml: '<li>c</li>' });
    expect(html).toContain('<ul class="sv-outline__children"><li>c</li></ul>');
  });
  test('escapes label', () => {
    expect(renderOutlineNode({ label: '<x>' })).toContain('&lt;x&gt;');
  });
});
