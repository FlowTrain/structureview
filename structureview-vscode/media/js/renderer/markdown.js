'use strict';
/* ─── Markdown Renderer ─────────────────────────────────────────
   Wraps marked.js and highlight.js into a clean render pipeline.
   Exported as window.MDRenderer so app.js can call it.
──────────────────────────────────────────────────────────────── */

window.MDRenderer = (() => {

  function configure() {
    if (!window.marked || !window.hljs) return;

    marked.setOptions({
      gfm: true,
      breaks: false,
      pedantic: false,
    });

    // Custom renderer
    const renderer = new marked.Renderer();

    // Open external links in the OS browser
    renderer.link = (href, title, text) => {
      const safe = escapeAttr(href || '');
      const t    = title ? ` title="${escapeAttr(title)}"` : '';
      return `<a href="${safe}"${t} class="sv-external-link">${text}</a>`;
    };

    // Syntax-highlighted code blocks
    renderer.code = (code, lang) => {
      let highlighted = code;
      if (lang && hljs.getLanguage(lang)) {
        try { highlighted = hljs.highlight(code, { language: lang }).value; }
        catch {}
      } else {
        try { highlighted = hljs.highlightAuto(code).value; }
        catch {}
      }
      const langLabel = lang
        ? `<span class="code-lang-label">${escapeHtml(lang)}</span>`
        : '';
      return `<pre>${langLabel}<code class="hljs language-${escapeAttr(lang || '')}">${highlighted}</code></pre>`;
    };

    // Task list items
    renderer.listitem = (text, task, checked) => {
      if (task) {
        return `<li><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${text}</li>\n`;
      }
      return `<li>${text}</li>\n`;
    };

    marked.use({ renderer });
  }

  function render(raw, meta) {
    if (!window.marked) {
      return `<pre class="doc-raw">${escapeHtml(raw)}</pre>`;
    }
    configure();

    const html = marked.parse(raw);

    const metaHtml = buildMetaLine(meta);
    return `<div class="doc-md">${metaHtml}${html}</div>`;
  }

  function buildMetaLine(meta) {
    if (!meta) return '';
    const size   = meta.size ? formatBytes(meta.size) : '';
    const mod    = meta.modified ? formatDate(meta.modified) : '';
    const parts  = [size, mod].filter(Boolean).map(s => `<span>${s}</span>`).join('');
    return `<div class="doc-meta">
      <span class="doc-meta-badge md">MD</span>
      ${parts}
    </div>`;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  return { render };
})();
