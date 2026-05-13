/**
 * JSON ParserPort — ADR-0005 conformant.
 *
 * SRP: parse JSON, derive outline, render. No DOM, no globals.
 * Existing renderer (src/renderer/js/renderer/json.js) is the Phase 1
 * refactor target; this port wraps the minimal logic needed for parser
 * and outline. render() returns a placeholder error block on parse failure
 * and a basic <pre> for now — the rich renderer will fold into this port
 * in a later batch when json.js is properly extracted.
 */
'use strict';

function parse(raw) {
  try {
    return { type: 'json', value: JSON.parse(raw), raw };
  } catch (err) {
    return { type: 'json', value: null, raw, error: err.message };
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function outlineValue(value, depth) {
  if (Array.isArray(value)) {
    return value.map((item, i) => ({
      label: `[${i}]`,
      depth,
      children: outlineValue(item, depth + 1),
    }));
  }
  if (isPlainObject(value)) {
    return Object.keys(value).map((key) => ({
      label: key,
      depth,
      children: outlineValue(value[key], depth + 1),
    }));
  }
  return [];
}

function outline(doc) {
  if (!doc || doc.error) return [];
  return outlineValue(doc.value, 0);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render(doc) {
  if (doc.error) {
    return `<div class="json-error"><div class="json-error-msg">${escapeHtml(doc.error)}</div></div>`;
  }
  return `<pre class="json-port-render">${escapeHtml(JSON.stringify(doc.value, null, 2))}</pre>`;
}

module.exports = {
  id: 'json',
  extensions: ['json'],
  parse,
  outline,
  render,
};
