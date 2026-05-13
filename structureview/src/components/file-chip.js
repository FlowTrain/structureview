/**
 * FileChip — file row in the sidebar. Format-coded indicator + label.
 * Per brief: format colour coding so users can scan by type.
 */
'use strict';
const { escapeHtml } = require('./_escape');

const KNOWN_EXTS = new Set(['md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'toml']);

function normaliseExt(ext) {
  const lower = String(ext || '')
    .toLowerCase()
    .replace(/^\./, '');
  return KNOWN_EXTS.has(lower) ? lower : 'other';
}

function renderFileChip({ name, ext, active, path } = {}) {
  if (!name) throw new Error('FileChip: name is required');
  const e = normaliseExt(ext);
  const cls = ['sv-file-chip', `sv-file-chip--${e}`, active ? 'sv-file-chip--active' : null]
    .filter(Boolean)
    .join(' ');
  const pathAttr = path ? ` data-path="${escapeHtml(path)}"` : '';
  return (
    `<div class="${cls}"${pathAttr} role="listitem">` +
    `<span class="sv-file-chip__badge" aria-label="${e}">${e.toUpperCase()}</span>` +
    `<span class="sv-file-chip__name">${escapeHtml(name)}</span>` +
    `</div>`
  );
}

module.exports = { renderFileChip };
