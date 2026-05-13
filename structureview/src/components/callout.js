/**
 * Callout — inline upgrade prompt (the moment of pull).
 * Per the brief: subtle, inline, never persistent, fires once per session.
 *
 * Variants: info (blue accent), upgrade (gold accent), warning (steam red).
 */
'use strict';
const { escapeHtml } = require('./_escape');

const VARIANTS = new Set(['info', 'upgrade', 'warning']);

function renderCallout({ title, body, variant = 'info', actionHtml } = {}) {
  if (!title) throw new Error('Callout: title is required');
  if (!VARIANTS.has(variant)) throw new Error(`Callout: unknown variant "${variant}"`);
  const action = actionHtml ? `<div class="sv-callout__action">${actionHtml}</div>` : '';
  const bodyHtml = body ? `<p class="sv-callout__body">${escapeHtml(body)}</p>` : '';
  return (
    `<aside class="sv-callout sv-callout--${variant}" role="note">` +
    `<h3 class="sv-callout__title">${escapeHtml(title)}</h3>` +
    bodyHtml +
    action +
    `</aside>`
  );
}

module.exports = { renderCallout };
