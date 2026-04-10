'use strict';
/* ─── StructView Webview — webview.js ───────────────────────────
   Runs inside the VS Code webview. Replaces app.js + tabs.js +
   sidebar.js from the Electron build. Uses VS Code's message-
   passing API instead of Electron IPC. The three renderer modules
   (markdown.js, json.js, search.js) are shared unchanged.
──────────────────────────────────────────────────────────────── */

(function () {
  const vscode = acquireVsCodeApi();

  // ── State ──────────────────────────────────────────────────────
  let currentExt     = null;
  let currentContent = null;
  let rawMode        = false;

  // ── Elements ───────────────────────────────────────────────────
  const docContent  = document.getElementById('doc-content');
  const docScroll   = document.getElementById('doc-scroll');
  const toolbar     = document.getElementById('toolbar');
  const filenameEl  = document.getElementById('toolbar-filename');
  const btnRaw      = document.getElementById('btn-raw');
  const btnSearch   = document.getElementById('btn-search');
  const searchBar   = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const searchCount = document.getElementById('search-count');
  const searchPrev  = document.getElementById('search-prev');
  const searchNext  = document.getElementById('search-next');
  const searchClose = document.getElementById('search-close');

  // ── Boot: tell extension we're ready ───────────────────────────
  vscode.postMessage({ type: 'ready' });

  // ── Message handler (extension → webview) ──────────────────────
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {

      case 'load-file':
        currentExt     = msg.ext;
        currentContent = msg.content;
        rawMode        = msg.rawMode || false;
        filenameEl.textContent = msg.name;
        renderContent({ size: msg.size, modified: msg.modified });
        btnRaw.classList.toggle('active', rawMode);
        DocSearch.clearHighlights();
        break;

      case 'update-content':
        currentContent = msg.content;
        rawMode        = msg.rawMode;
        renderContent(null);
        DocSearch.rerun();
        break;

      case 'toggle-raw':
        rawMode = msg.rawMode;
        renderContent(null);
        btnRaw.classList.toggle('active', rawMode);
        break;

      case 'scroll-to-line':
        scrollToLine(msg.line);
        break;

      case 'file-error':
        docContent.innerHTML = `<div class="sv-error">Error loading file: ${escHtml(msg.message)}</div>`;
        break;
    }
  });

  // ── Render ──────────────────────────────────────────────────────

  function renderContent(meta) {
    if (!currentContent) return;
    DocSearch.clearHighlights();

    if (rawMode) {
      docContent.innerHTML = `<pre class="doc-raw">${escHtml(currentContent)}</pre>`;
      return;
    }

    if (currentExt === 'md' || currentExt === 'markdown') {
      docContent.innerHTML = MDRenderer.render(currentContent, meta);
      attachExternalLinks();
    } else if (currentExt === 'json') {
      docContent.innerHTML = JSONRenderer.render(currentContent, meta);
      JSONRenderer.attachToggleHandlers(docContent);
      // Store preview text for re-expand
      docContent.querySelectorAll('[data-preview]').forEach(el => {
        el.dataset.origPreview = el.textContent;
      });
    } else {
      docContent.innerHTML = `<pre class="doc-raw">${escHtml(currentContent)}</pre>`;
    }
  }

  // ── External links ──────────────────────────────────────────────

  function attachExternalLinks() {
    docContent.querySelectorAll('a.sv-external-link').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const href = a.getAttribute('href');
        if (href) vscode.postMessage({ type: 'open-external', url: href });
      });
    });
  }

  // ── Scroll sync ─────────────────────────────────────────────────

  function scrollToLine(line) {
    // Find a heading or paragraph near that line — best effort
    const lineHeight = parseInt(getComputedStyle(docContent).lineHeight) || 20;
    docScroll.scrollTo({ top: line * lineHeight, behavior: 'smooth' });
  }

  // ── Toolbar buttons ─────────────────────────────────────────────

  btnRaw.addEventListener('click', () => {
    vscode.postMessage({ type: 'toggle-raw' });
  });

  btnSearch.addEventListener('click', openSearch);

  // ── Search ──────────────────────────────────────────────────────

  function openSearch() {
    searchBar.hidden = false;
    searchInput.focus();
    searchInput.select();
    if (searchInput.value) runSearch();
  }

  function closeSearch() {
    searchBar.hidden = true;
    DocSearch.clearHighlights();
    searchCount.textContent = '';
  }

  function runSearch() {
    DocSearch.run(searchInput.value, searchCount);
  }

  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.shiftKey
        ? DocSearch.prev(searchCount)
        : DocSearch.next(searchCount);
    }
    if (e.key === 'Escape') closeSearch();
  });

  searchPrev.addEventListener('click',  () => DocSearch.prev(searchCount));
  searchNext.addEventListener('click',  () => DocSearch.next(searchCount));
  searchClose.addEventListener('click', closeSearch);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && !searchBar.hidden) {
      closeSearch();
    }
  });

  // ── Patch DocSearch for VS Code webview ─────────────────────────
  // DocSearch.init() in search.js expects DOM IDs from the Electron shell.
  // In the webview we wire search manually above, so we override init.
  if (window.DocSearch) {
    DocSearch.init = () => {};   // no-op — wired above
    DocSearch.init();
  }

  // ── Utility ─────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
