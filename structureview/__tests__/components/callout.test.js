const { renderCallout } = require('../../src/components/callout');

describe('renderCallout', () => {
  test('title is required', () => {
    expect(() => renderCallout({})).toThrow(/title/);
  });
  test('rejects unknown variant', () => {
    expect(() => renderCallout({ title: 't', variant: 'success' })).toThrow(/variant/);
  });
  test('defaults to variant=info', () => {
    expect(renderCallout({ title: 't' })).toContain('sv-callout--info');
  });
  test.each(['info', 'upgrade', 'warning'])('accepts variant=%s', (v) => {
    expect(renderCallout({ title: 't', variant: v })).toContain(`sv-callout--${v}`);
  });
  test('renders title (escaped) and optional body', () => {
    const html = renderCallout({ title: '<t>', body: '<b>' });
    expect(html).toContain('&lt;t&gt;');
    expect(html).toContain('&lt;b&gt;');
  });
  test('omits body section when not provided', () => {
    expect(renderCallout({ title: 't' })).not.toContain('sv-callout__body');
  });
  test('embeds actionHtml when provided', () => {
    const html = renderCallout({ title: 't', actionHtml: '<button>x</button>' });
    expect(html).toContain('sv-callout__action');
    expect(html).toContain('<button>x</button>');
  });
  test('uses role=note', () => {
    expect(renderCallout({ title: 't' })).toContain('role="note"');
  });
});
