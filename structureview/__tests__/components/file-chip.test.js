const { renderFileChip } = require('../../src/components/file-chip');

describe('renderFileChip', () => {
  test('name is required', () => {
    expect(() => renderFileChip({})).toThrow(/name/);
  });
  test.each(['md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'toml'])(
    'applies sv-file-chip--%s class for known extension',
    (ext) => {
      const html = renderFileChip({ name: 'f', ext });
      expect(html).toContain(`sv-file-chip--${ext}`);
    }
  );
  test('unknown extension falls back to sv-file-chip--other', () => {
    expect(renderFileChip({ name: 'f', ext: 'whatever' })).toContain('sv-file-chip--other');
  });
  test('case-insensitive and tolerates leading dot', () => {
    expect(renderFileChip({ name: 'f', ext: '.MD' })).toContain('sv-file-chip--md');
  });
  test('active adds the active modifier', () => {
    expect(renderFileChip({ name: 'f', active: true })).toContain('sv-file-chip--active');
  });
  test('renders the badge with uppercase ext', () => {
    expect(renderFileChip({ name: 'f', ext: 'json' })).toContain('>JSON</span>');
  });
  test('escapes name', () => {
    expect(renderFileChip({ name: '<x>' })).toContain('&lt;x&gt;');
  });
  test('sets data-path when path provided', () => {
    expect(renderFileChip({ name: 'f', path: '/a/b' })).toContain('data-path="/a/b"');
  });
});
