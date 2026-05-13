/**
 * outline-view — composes ParserPort.outline() output with OutlineNode primitives.
 *
 * SRP: turns OutlineNode[] (tree or flat) into the panel HTML.
 * Independent of any specific parser — works for any ParserPort.
 */
'use strict';

const { renderOutlineNode } = require('../components/outline-node');

function renderNode(node) {
  const kids =
    Array.isArray(node.children) && node.children.length > 0
      ? node.children.map(renderNode).join('')
      : '';
  return renderOutlineNode({
    label: node.label,
    depth: node.depth,
    childrenHtml: kids,
  });
}

function renderOutlineView(nodes) {
  if (!Array.isArray(nodes)) {
    throw new Error('renderOutlineView: nodes must be an array');
  }
  if (nodes.length === 0) {
    return '<div class="sv-outline sv-outline--empty" role="tree" aria-label="Outline">No outline available.</div>';
  }
  const items = nodes.map(renderNode).join('');
  return `<ul class="sv-outline" role="tree" aria-label="Outline">${items}</ul>`;
}

module.exports = { renderOutlineView };
