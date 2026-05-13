/**
 * StatusBar — the "DISPATCHED · EMD SD70ACe" footer from the brief.
 * Renders mode + locomotive nameplate with optional file path on the right.
 */
'use strict';
const { escapeHtml } = require('./_escape');

const MODES = new Set(['DISPATCHED', 'IDLE', 'SIDING', 'ERROR']);

function renderStatusBar({ mode = 'DISPATCHED', rightLabel } = {}) {
  if (!MODES.has(mode)) throw new Error(`StatusBar: unknown mode "${mode}"`);
  const right = rightLabel
    ? `<span class="sv-statusbar__right">${escapeHtml(rightLabel)}</span>`
    : '';
  return (
    `<footer class="sv-statusbar sv-statusbar--${mode.toLowerCase()}" role="status" aria-live="polite">` +
    `<span class="sv-statusbar__mode">${escapeHtml(mode)}</span>` +
    `<span class="sv-statusbar__sep">·</span>` +
    `<span class="sv-statusbar__loco">EMD SD70ACe</span>` +
    right +
    `</footer>`
  );
}

module.exports = { renderStatusBar };
