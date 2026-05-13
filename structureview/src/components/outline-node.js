/**
 * OutlineNode — single navigable node in the outline view.
 * Renders depth-indented label with optional children container.
 */
'use strict';
const { escapeHtml } = require('./_escape');

function renderOutlineNode({ label, depth = 0, childrenHtml = '', href } = {}) {
  if (label === undefined || label === null) throw new Error('OutlineNode: label is required');
  if (!Number.isFinite(depth) || depth < 0)
    throw new Error('OutlineNode: depth must be a non-negative number');
  const link = href
    ? `<a class="sv-outline__link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
    : `<span class="sv-outline__label">${escapeHtml(label)}</span>`;
  const kids = childrenHtml ? `<ul class="sv-outline__children">${childrenHtml}</ul>` : '';
  return (
    `<li class="sv-outline__node sv-outline__node--depth-${depth}" data-depth="${depth}">` +
    link +
    kids +
    `</li>`
  );
}

module.exports = { renderOutlineNode };
