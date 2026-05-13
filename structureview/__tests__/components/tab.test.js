const { renderTab } = require('../../src/components/tab');

describe('renderTab', () => {
  test('name is required', () => {
    expect(() => renderTab({})).toThrow(/name/);
  });
  test('active adds the active modifier and aria-selected=true', () => {
    const html = renderTab({ name: 'a.md', active: true });
    expect(html).toContain('sv-tab--active');
    expect(html).toContain('aria-selected="true"');
  });
  test('inactive sets aria-selected=false and omits modifier', () => {
    const html = renderTab({ name: 'a.md', active: false });
    expect(html).toContain('aria-selected="false"');
    expect(html).not.toContain('sv-tab--active');
  });
  test('renders close button by default', () => {
    expect(renderTab({ name: 'a.md' })).toContain('sv-tab__close');
  });
  test('closeable=false omits close button', () => {
    expect(renderTab({ name: 'a.md', closeable: false })).not.toContain('sv-tab__close');
  });
  test('escapes name in close button aria-label', () => {
    const html = renderTab({ name: '<x>.md' });
    expect(html).toContain('aria-label="Close &lt;x&gt;.md"');
  });
  test('data-path when provided', () => {
    expect(renderTab({ name: 'a.md', path: '/x/a.md' })).toContain('data-path="/x/a.md"');
  });
});
