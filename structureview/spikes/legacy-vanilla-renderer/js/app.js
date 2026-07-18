'use strict';
/* ─── StructView — app.js ───────────────────────────────────────
   Entry point for the renderer process. Wires all modules
   together and sets up IPC listeners, drag-and-drop, and
   keyboard shortcuts.
──────────────────────────────────────────────────────────────── */

(function () {
  const sv = window.structview;

  // ── Init ─────────────────────────────────────────────────────

  DocSearch.init();
  Sidebar.init();

  // ── IPC: file events from main process ───────────────────────

  sv.onFileLoaded((data) => {
    console.log('[onFileLoaded] received:', data.filePath, 'ext:', data.ext, 'content length:', data.content?.length);
    Sidebar.addFile(data);
    Tabs.open(data);
  });

  sv.onFileChanged(({ filePath, content }) => {
    console.log('[onFileChanged]', filePath);
    Tabs.updateContent(filePath, content);
  });

  sv.onFileError(({ filePath, message }) => {
    console.error('[onFileError]', filePath, message);
  });

  sv.onFolderScanned(({ folderPath, files }) => {
    Sidebar.addFiles(files);
    // Auto-open first file if nothing is currently open
    if (!Tabs.getActivePath() && files.length > 0) {
      sv.readFile(files[0]).then(result => {
        if (result.ok) {
          const name = files[0].split(/[/\\]/).pop();
          const ext  = name.split('.').pop().toLowerCase();
          Tabs.open({ filePath: files[0], name, ext, ...result });
        }
      });
    }
  });

  sv.onShowAbout(() => {
    showAboutModal();
  });

  // ── Toolbar buttons ──────────────────────────────────────────

  document.getElementById('btn-open-file').addEventListener('click', () => {
    sv.openFileDialog();
  });

  document.getElementById('btn-open-folder').addEventListener('click', () => {
    sv.openFolderDialog();
  });

  document.getElementById('welcome-open-file').addEventListener('click', () => {
    sv.openFileDialog();
  });

  document.getElementById('welcome-open-folder').addEventListener('click', () => {
    sv.openFolderDialog();
  });

  document.getElementById('btn-toggle-raw').addEventListener('click', () => {
    const fp = Tabs.getActivePath();
    if (fp) Tabs.toggleRaw(fp);
  });

  document.getElementById('btn-search-in-doc').addEventListener('click', () => {
    // DocSearch handles its own open/close via click listener set in search.js
  });

  // ── About modal ──────────────────────────────────────────────

  async function showAboutModal() {
    const overlay = document.getElementById('modal-overlay');
    const ver     = document.getElementById('modal-version');
    try {
      const v = await sv.getAppVersion();
      ver.textContent = `Version ${v}`;
    } catch {
      ver.textContent = 'Version 0.1.0';
    }
    overlay.hidden = false;
  }

  document.getElementById('modal-close').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('modal-overlay').hidden = true;
  });

  document.getElementById('modal-about').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('modal-overlay').addEventListener('click', () => {
    document.getElementById('modal-overlay').hidden = true;
  });

  // ── Keyboard shortcuts ───────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl+O — open file
    if (ctrl && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      sv.openFileDialog();
    }

    // Ctrl+Shift+O — open folder
    if (ctrl && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      sv.openFolderDialog();
    }

    // Ctrl+W — close active tab
    if (ctrl && e.key === 'w') {
      e.preventDefault();
      const fp = Tabs.getActivePath();
      if (fp) Tabs.close(fp);
    }

    // Ctrl+Tab / Ctrl+Shift+Tab — cycle tabs
    if (ctrl && e.key === 'Tab') {
      e.preventDefault();
      cycleTab(e.shiftKey ? -1 : 1);
    }

    // Ctrl+` — toggle raw
    if (ctrl && e.key === '`') {
      e.preventDefault();
      const fp = Tabs.getActivePath();
      if (fp) Tabs.toggleRaw(fp);
    }
  });

  function cycleTab(dir) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    if (tabs.length < 2) return;
    const activeIdx = tabs.findIndex(t => t.classList.contains('active'));
    const nextIdx   = (activeIdx + dir + tabs.length) % tabs.length;
    const nextPath  = tabs[nextIdx].dataset.path;
    if (nextPath) Tabs.switchTo(nextPath);
  }

  // ── Drag-and-drop ─────────────────────────────────────────────

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    document.body.classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      document.body.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('drag-over');

    const files = [...e.dataTransfer.files].filter(f =>
      /\.(md|markdown|json)$/i.test(f.name)
    );

    files.forEach(f => {
      sv.readFile(f.path).then(result => {
        if (result.ok) {
          const ext = f.name.split('.').pop().toLowerCase();
          Tabs.open({
            filePath: f.path,
            name: f.name,
            ext,
            content: result.content,
            size: result.size,
            modified: result.modified,
          });
          Sidebar.addFile({
            filePath: f.path,
            name: f.name,
            ext,
            modified: result.modified,
          });
        }
      });
    });
  });

})();
