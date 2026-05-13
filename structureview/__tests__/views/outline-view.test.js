/**
 * outline-view — composes parser.outline() output with OutlineNode primitives.
 *
 * Tree-shaped outlines (JSON, XML) keep children nested.
 * Flat outlines (Markdown headings — depth encodes hierarchy) render as a flat list.
 */
const { renderOutlineView } = require('../../src/views/outline-view');

const flatHeadings = [
  { label: 'Intro', depth: 0 },
  { label: 'Body', depth: 0 },
  { label: 'Sub', depth: 1 },
];

const treeJson = [
  {
    label: 'root',
    depth: 0,
    children: [
      { label: 'a', depth: 1, children: [] },
      { label: 'b', depth: 1, children: [{ label: 'b.0', depth: 2, children: [] }] },
    ],
  },
];

describe('renderOutlineView', () => {
  test('empty outline yields the empty-state placeholder', () => {
    const html = renderOutlineView([]);
    expect(html).toContain('sv-outline--empty');
    expect(html).toMatch(/no outline|empty/i);
  });

  test('wraps the outline in a sv-outline list', () => {
    const html = renderOutlineView(flatHeadings);
    expect(html).toContain('<ul class="sv-outline"');
    expect(html).toContain('role="tree"');
  });

  test('renders one node per flat heading', () => {
    const html = renderOutlineView(flatHeadings);
    expect(html).toContain('Intro');
    expect(html).toContain('Body');
    expect(html).toContain('Sub');
    // Three nodes
    const matches = html.match(/sv-outline__node--depth-\d/g);
    expect(matches).toHaveLength(3);
  });

  test('renders nested children for tree-shaped outlines', () => {
    const html = renderOutlineView(treeJson);
    expect(html).toContain('root');
    expect(html).toContain('b.0');
    expect(html).toContain('sv-outline__children');
  });

  test('preserves depth on each node', () => {
    const html = renderOutlineView(flatHeadings);
    expect(html).toContain('sv-outline__node--depth-0');
    expect(html).toContain('sv-outline__node--depth-1');
  });

  test('rejects non-array input', () => {
    expect(() => renderOutlineView('nope')).toThrow();
    expect(() => renderOutlineView(null)).toThrow();
  });

  test('escapes labels (defence in depth — primitives also escape)', () => {
    const html = renderOutlineView([{ label: '<x>', depth: 0 }]);
    expect(html).toContain('&lt;x&gt;');
  });
});
