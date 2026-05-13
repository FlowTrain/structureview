const { renderStatusBar } = require('../../src/components/status-bar');

describe('renderStatusBar', () => {
  test('renders the DISPATCHED · EMD SD70ACe footer by default', () => {
    const html = renderStatusBar();
    expect(html).toContain('DISPATCHED');
    expect(html).toContain('EMD SD70ACe');
    expect(html).toContain('sv-statusbar--dispatched');
  });
  test('accepts the documented modes', () => {
    for (const m of ['DISPATCHED', 'IDLE', 'SIDING', 'ERROR']) {
      expect(renderStatusBar({ mode: m })).toContain(m);
    }
  });
  test('rejects unknown mode', () => {
    expect(() => renderStatusBar({ mode: 'STOPPED' })).toThrow(/mode/);
  });
  test('renders rightLabel escaped', () => {
    const html = renderStatusBar({ rightLabel: '<x>' });
    expect(html).toContain('&lt;x&gt;');
  });
  test('uses role=status and aria-live=polite', () => {
    const html = renderStatusBar();
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});
