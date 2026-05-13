/**
 * Button — FlowTrain primitive. Pure render function.
 * Variants: primary | accent | ghost | danger
 * Sizes:    sm | md | lg
 * States:   disabled, loading
 */
const { renderButton } = require('../../src/components/button');

describe('renderButton', () => {
  test('returns a <button> element wrapped in sv-btn class', () => {
    const html = renderButton({ label: 'Click me' });
    expect(html).toMatch(/^<button[\s>]/);
    expect(html).toContain('class="sv-btn');
  });

  test('defaults to variant="primary" and size="md"', () => {
    const html = renderButton({ label: 'X' });
    expect(html).toContain('sv-btn--primary');
    expect(html).toContain('sv-btn--md');
  });

  test.each(['primary', 'accent', 'ghost', 'danger'])(
    'applies sv-btn--%s for variant=%s',
    (variant) => {
      const html = renderButton({ label: 'X', variant });
      expect(html).toContain(`sv-btn--${variant}`);
    }
  );

  test.each(['sm', 'md', 'lg'])('applies sv-btn--%s for size=%s', (size) => {
    const html = renderButton({ label: 'X', size });
    expect(html).toContain(`sv-btn--${size}`);
  });

  test('rejects unknown variant', () => {
    expect(() => renderButton({ label: 'X', variant: 'purple' })).toThrow(/variant/);
  });

  test('rejects unknown size', () => {
    expect(() => renderButton({ label: 'X', size: 'xl' })).toThrow(/size/);
  });

  test('renders the label as text content (HTML-escaped)', () => {
    const html = renderButton({ label: '<script>x</script>' });
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>x');
  });

  test('label is required', () => {
    expect(() => renderButton({})).toThrow(/label/);
  });

  test('disabled=true adds the disabled attribute and aria-disabled', () => {
    const html = renderButton({ label: 'X', disabled: true });
    expect(html).toContain(' disabled');
    expect(html).toContain('aria-disabled="true"');
  });

  test('disabled=false omits the disabled attribute', () => {
    const html = renderButton({ label: 'X', disabled: false });
    expect(html).not.toContain(' disabled');
  });

  test('loading=true adds aria-busy and the sv-btn--loading modifier', () => {
    const html = renderButton({ label: 'X', loading: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('sv-btn--loading');
  });

  test('passing an id sets the id attribute (escaped)', () => {
    const html = renderButton({ label: 'X', id: 'btn-sign-in' });
    expect(html).toContain('id="btn-sign-in"');
  });

  test('default type is "button" (not "submit")', () => {
    const html = renderButton({ label: 'X' });
    expect(html).toContain('type="button"');
  });

  test('type="submit" is allowed when explicitly set', () => {
    const html = renderButton({ label: 'X', type: 'submit' });
    expect(html).toContain('type="submit"');
  });

  test('renders an icon prefix when iconHtml provided', () => {
    const html = renderButton({ label: 'Sign in', iconHtml: '<svg></svg>' });
    expect(html).toContain('<span class="sv-btn__icon"><svg></svg></span>');
    expect(html.indexOf('sv-btn__icon')).toBeLessThan(html.indexOf('Sign in'));
  });
});
