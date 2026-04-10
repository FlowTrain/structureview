'use strict';
/* ─── JSON Tree Renderer ────────────────────────────────────────
   Renders JSON as a collapsible, syntax-colored interactive tree.
   Exported as window.JSONRenderer.
──────────────────────────────────────────────────────────────── */

window.JSONRenderer = (() => {

  const COLLAPSE_THRESHOLD = 6;   // auto-collapse objects/arrays larger than this
  const MAX_STRING_INLINE  = 120; // wrap longer strings

  // ── Public entry point ───────────────────────────────────────

  function render(raw, meta) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return renderError(err, raw);
    }

    const metaHtml = buildMetaLine(meta);
    const tree     = renderValue(parsed, 0, null);

    return `<div class="doc-json">${metaHtml}<div class="json-root">${tree}</div></div>`;
  }

  // ── Value dispatcher ─────────────────────────────────────────

  function renderValue(val, depth, key) {
    const type = getType(val);
    switch (type) {
      case 'object': return renderObject(val, depth);
      case 'array':  return renderArray(val, depth);
      case 'string': return renderString(val);
      case 'number': return `<span class="json-number">${val}</span>`;
      case 'boolean': return `<span class="json-boolean">${val}</span>`;
      case 'null':   return `<span class="json-null">null</span>`;
      default:       return escapeHtml(String(val));
    }
  }

  // ── Object ───────────────────────────────────────────────────

  function renderObject(obj, depth) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return `<span class="json-bracket">{}</span>`;

    const autoCollapse = keys.length > COLLAPSE_THRESHOLD;
    const nodeId = uid();
    const preview = `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`;

    const rows = keys.map((k, i) => {
      const isLast = i === keys.length - 1;
      const valHtml = renderValue(obj[k], depth + 1, k);
      return `<div class="json-row">
        <span class="json-key">"${escapeHtml(k)}"</span>
        <span class="json-colon">:</span>
        ${valHtml}${isLast ? '' : '<span class="json-comma">,</span>'}
      </div>`;
    }).join('\n');

    return collapsibleNode(nodeId, '{', '}', rows, autoCollapse, preview);
  }

  // ── Array ────────────────────────────────────────────────────

  function renderArray(arr, depth) {
    if (arr.length === 0) return `<span class="json-bracket">[]</span>`;

    const autoCollapse = arr.length > COLLAPSE_THRESHOLD;
    const nodeId = uid();
    const preview = `[${arr.length} item${arr.length === 1 ? '' : 's'}]`;

    const rows = arr.map((item, i) => {
      const isLast = i === arr.length - 1;
      const valHtml = renderValue(item, depth + 1, i);
      return `<div class="json-row">
        <span class="json-index">${i}</span>
        ${valHtml}${isLast ? '' : '<span class="json-comma">,</span>'}
      </div>`;
    }).join('\n');

    return collapsibleNode(nodeId, '[', ']', rows, autoCollapse, preview);
  }

  // ── String ───────────────────────────────────────────────────

  function renderString(val) {
    const escaped = escapeHtml(val);
    const cls = val.length > MAX_STRING_INLINE ? ' json-string-long' : '';
    return `<span class="json-string${cls}">"${escaped}"</span>`;
  }

  // ── Collapsible wrapper ──────────────────────────────────────

  function collapsibleNode(id, open, close, innerHtml, collapsed, preview) {
    const hiddenAttr = collapsed ? ' hidden' : '';
    const btnLabel   = collapsed ? '+' : '−';
    return `<span class="json-node" id="${id}">
      <button class="json-toggle" data-node="${id}" title="Expand/collapse">${btnLabel}</button>
      <span class="json-bracket">${open}</span>
      <span class="json-preview" data-preview="${id}">${collapsed ? preview : ''}</span>
      <div class="json-children" data-children="${id}"${hiddenAttr}>${innerHtml}</div>
      <span class="json-bracket" data-close="${id}"${collapsed ? '' : ''}>${collapsed ? '' : close}</span>
      <span class="json-bracket" data-close-inline="${id}"${collapsed ? '' : ' hidden'}>${close}</span>
    </span>`;
  }

  // ── Error rendering ──────────────────────────────────────────

  function renderError(err, raw) {
    const snippet = raw.length > 2000 ? raw.slice(0, 2000) + '\n…' : raw;
    return `<div class="json-error">
      <div class="json-error-title">JSON parse error</div>
      <div class="json-error-msg">${escapeHtml(err.message)}</div>
      <pre class="json-error-raw">${escapeHtml(snippet)}</pre>
    </div>`;
  }

  // ── Toggle handler (delegated, call once after render) ───────

  function attachToggleHandlers(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.json-toggle');
      if (!btn) return;
      const nodeId   = btn.dataset.node;
      const children = container.querySelector(`[data-children="${nodeId}"]`);
      const preview  = container.querySelector(`[data-preview="${nodeId}"]`);
      const close    = container.querySelector(`[data-close="${nodeId}"]`);
      const closeInline = container.querySelector(`[data-close-inline="${nodeId}"]`);
      if (!children) return;

      const isCollapsed = children.hidden;
      children.hidden = !isCollapsed;
      btn.textContent = isCollapsed ? '−' : '+';
      if (preview) preview.textContent = isCollapsed ? '' : getPreviewText(nodeId, container);
      if (close) close.hidden = !isCollapsed;           // full closing bracket
      if (closeInline) closeInline.hidden = isCollapsed; // inline bracket when collapsed
    });
  }

  function getPreviewText(nodeId, container) {
    // Re-derive preview from toggle btn's aria or dataset if needed.
    // Simpler: store it as a data attribute on the preview span.
    const preview = container.querySelector(`[data-preview="${nodeId}"]`);
    return preview ? (preview.dataset.origPreview || '') : '';
  }

  // ── Meta line ────────────────────────────────────────────────

  function buildMetaLine(meta) {
    if (!meta) return '';
    const size = meta.size ? formatBytes(meta.size) : '';
    const mod  = meta.modified ? formatDate(meta.modified) : '';
    const parts = [size, mod].filter(Boolean).map(s => `<span>${s}</span>`).join('');
    return `<div class="doc-meta">
      <span class="doc-meta-badge json">JSON</span>
      ${parts}
    </div>`;
  }

  // ── Utilities ────────────────────────────────────────────────

  let _uid = 0;
  function uid() { return `jn${++_uid}`; }

  function getType(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return ''; }
  }

  return { render, attachToggleHandlers };
})();
