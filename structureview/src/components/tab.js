/**
 * Tab — open file tab. Has name, active state, and optional close button.
 */
'use strict';
const { escapeHtml } = require('./_escape');

function renderTab({ name, active, path, closeable = true } = {}) {
  if (!name) throw new Error('Tab: name is required');
  const cls = ['sv-tab', active ? 'sv-tab--active' : null].filter(Boolean).join(' ');
  const pathAttr = path ? ` data-path="${escapeHtml(path)}"` : '';
  const closeBtn = closeable
    ? `<button class="sv-tab__close" aria-label="Close ${escapeHtml(name)}" type="button">×</button>`
    : '';
  return (
    `<div class="${cls}"${pathAttr} role="tab" aria-selected="${active ? 'true' : 'false'}">` +
    `<span class="sv-tab__name">${escapeHtml(name)}</span>` +
    closeBtn +
    `</div>`
  );
}

module.exports = { renderTab };
