/**
 * Button — FlowTrain primitive.
 *
 * Pure render(props) → HTML string. No DOM, no events bound here —
 * callers attach listeners after innerHTML insertion.
 *
 * SRP: visual representation only. Behaviour lives at the call site.
 */
'use strict';

const VARIANTS = new Set(['primary', 'accent', 'ghost', 'danger']);
const SIZES = new Set(['sm', 'md', 'lg']);
const TYPES = new Set(['button', 'submit', 'reset']);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classes(variant, size, loading) {
  const parts = ['sv-btn', `sv-btn--${variant}`, `sv-btn--${size}`];
  if (loading) parts.push('sv-btn--loading');
  return parts.join(' ');
}

function renderButton({
  label,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  id,
  type = 'button',
  iconHtml,
} = {}) {
  if (label === undefined || label === null) throw new Error('Button: label is required');
  if (!VARIANTS.has(variant)) throw new Error(`Button: unknown variant "${variant}"`);
  if (!SIZES.has(size)) throw new Error(`Button: unknown size "${size}"`);
  if (!TYPES.has(type)) throw new Error(`Button: unknown type "${type}"`);

  const attrs = [
    `type="${type}"`,
    `class="${classes(variant, size, loading)}"`,
    id ? `id="${escapeHtml(id)}"` : null,
    disabled ? 'disabled' : null,
    disabled ? 'aria-disabled="true"' : null,
    loading ? 'aria-busy="true"' : null,
  ]
    .filter(Boolean)
    .join(' ');

  const icon = iconHtml ? `<span class="sv-btn__icon">${iconHtml}</span>` : '';
  return `<button ${attrs}>${icon}${escapeHtml(label)}</button>`;
}

module.exports = { renderButton };
