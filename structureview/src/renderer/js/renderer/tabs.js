'use strict';
/* ─── Tab Manager ───────────────────────────────────────────────
   Manages open file tabs. Each tab holds its file data and scroll
   position. Exported as window.Tabs.
──────────────────────────────────────────────────────────────── */

window.Tabs = (() => {

  // Map<filePath, {name, ext, content, size, modified, scrollTop, rawMode}>
  const store = new Map();
  let active  = null;

  const tabBar    = document.getElementById('tab-bar');
  const docScroll = document.getElementById('doc-scroll');

  // ── Public API ───────────────────────────────────────────────

  function open(fileData) {
    const { filePath, name, ext, content, size, modified } = fileData;

    if (store.has(filePath)) {
      // Update content (live reload) and switch to it
      const existing = store.get(filePath);
      existing.content  = content;
      existing.size     = size;
      existing.modified = modified;
      switchTo(filePath);
    } else {
      store.set(filePath, {
        name, ext, content, size, modified,
        scrollTop: 0,
        rawMode: false,
      });
      renderTabEl(filePath);
      switchTo(filePath);
    }
  }

  function updateContent(filePath, content) {
    if (!store.has(filePath)) return;
    store.get(filePath).content = content;
    if (active === filePath) {
      renderDocument(filePath);
    }
    // Pulse the tab to signal live update
    const tab = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (tab) {
      tab.classList.add('updated');
      setTimeout(() => tab.classList.remove('updated'), 800);
    }
  }

  function close(filePath) {
    if (!store.has(filePath)) return;
    store.delete(filePath);
    const tab = tabBar.querySelector(`[data-path="${CSS.escape(filePath)}"]`);
    if (tab) tab.remove();

    if (active === filePath) {
      active = null;
      const remaining = [...store.keys()];
      if (remaining.length > 0) switchTo(remaining[remaining.length - 1]);
      else showWelcome();
    }
  }

  function switchTo(filePath) {
    if (!store.has(filePath)) return;

    // Save scroll position of current tab
    if (active && active !== filePath) {
      const prev = store.get(active);
      if (prev && docScroll) prev.scrollTop = docScroll.scrollTop;
    }

    active = filePath;
    updateTabActiveState(filePath);
    renderDocument(filePath);
  }

  function toggleRaw(filePath) {
    const data = store.get(filePath);
    if (!data) return;
    data.rawMode = !data.rawMode;
    renderDocument(filePath);
    return data.rawMode;
  }

  function getActive()      { return active ? store.get(active) : null; }
  function getActivePath()  { return active; }
  function has(filePath)    { return store.has(filePath); }

  // ── Internal ─────────────────────────────────────────────────

  function renderTabEl(filePath) {
    const data = store.get(filePath);
    const tab  = document.createElement('button');
    tab.className = 'tab';
    tab.dataset.path = filePath;
    tab.title = filePath;

    tab.innerHTML = `
      <span class="tab-dot ${data.ext}"></span>
      <span class="tab-name">${escapeHtml(data.name)}</span>
      <button class="tab-close" title="Close tab">×</button>
    `;

    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) {
        e.stopPropagation();
        close(filePath);
      } else {
        switchTo(filePath);
      }
    });

    tabBar.appendChild(tab);
    tab.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
  }

  function updateTabActiveState(filePath) {
    tabBar.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.path === filePath);
    });
  }

  function renderDocument(filePath) {
    const data    = store.get(filePath);

    // If content hasn't loaded yet, fetch it then re-render
    if (!data.content) {
      window.structview.readFile(filePath).then(result => {
        if (result.ok) {
          data.content  = result.content;
          data.size     = result.size;
          data.modified = result.modified;
          renderDocument(filePath);
        }
      });
      return;
    }

    const viewer  = document.getElementById('viewer');
    const welcome = document.getElementById('welcome');
    const content = document.getElementById('doc-content');
    const breadcrumb = document.getElementById('viewer-breadcrumb');
    const titlebarFilename = document.getElementById('titlebar-filename');
    const rawBtn  = document.getElementById('btn-toggle-raw');

    welcome.hidden = true;
    viewer.hidden  = false;

    breadcrumb.textContent      = filePath;
    titlebarFilename.textContent = data.name;

    const meta = { size: data.size, modified: data.modified };

    DocSearch.clearHighlights();

    if (data.rawMode) {
      content.innerHTML = `<pre class="doc-raw">${escapeHtml(data.content)}</pre>`;
      rawBtn.classList.add('active');
    } else {
      if (data.ext === 'md' || data.ext === 'markdown') {
        content.innerHTML = MDRenderer.render(data.content, meta);
        attachExternalLinks(content);
      } else if (data.ext === 'json') {
        content.innerHTML = JSONRenderer.render(data.content, meta);
        JSONRenderer.attachToggleHandlers(content);
        // Store preview texts for re-expand
        content.querySelectorAll('[data-preview]').forEach(el => {
          el.dataset.origPreview = el.textContent;
        });
      } else {
        content.innerHTML = `<pre class="doc-raw">${escapeHtml(data.content)}</pre>`;
      }
      rawBtn.classList.remove('active');
    }

    // Restore scroll position
    if (docScroll) {
      requestAnimationFrame(() => {
        docScroll.scrollTop = data.scrollTop || 0;
      });
    }

    DocSearch.rerun();

    // Notify sidebar
    Sidebar.setActive(filePath);
  }

  function showWelcome() {
    const viewer  = document.getElementById('viewer');
    const welcome = document.getElementById('welcome');
    viewer.hidden  = true;
    welcome.hidden = false;
    document.getElementById('titlebar-filename').textContent = '';
    document.getElementById('viewer-breadcrumb').textContent = '';
    Sidebar.setActive(null);
  }

  function attachExternalLinks(container) {
    container.querySelectorAll('a.sv-external-link').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const href = a.getAttribute('href');
        if (href) window.structview.openExternal(href);
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { open, updateContent, close, switchTo, toggleRaw, getActive, getActivePath, has };
})();
