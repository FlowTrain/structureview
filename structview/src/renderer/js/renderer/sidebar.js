'use strict';
/* ─── Sidebar ───────────────────────────────────────────────────
   Manages the file list panel. Exported as window.Sidebar.
──────────────────────────────────────────────────────────────── */

window.Sidebar = (() => {

  // Map<filePath, {name, ext, modified}>
  const fileRegistry = new Map();

  const fileList    = document.getElementById('file-list');
  const emptyState  = document.getElementById('sidebar-empty');
  const searchInput = document.getElementById('sidebar-search');

  let filterQuery = '';

  function init() {
    searchInput.addEventListener('input', () => {
      filterQuery = searchInput.value.toLowerCase();
      renderList();
    });
  }

  // ── Public API ───────────────────────────────────────────────

  function addFile(fileData) {
    fileRegistry.set(fileData.filePath, {
      name:     fileData.name,
      ext:      fileData.ext,
      modified: fileData.modified,
    });
    renderList();
  }

  function addFiles(filePaths) {
    filePaths.forEach(fp => {
      if (!fileRegistry.has(fp)) {
        const parts = fp.split(/[/\\]/);
        const name  = parts[parts.length - 1];
        const ext   = name.split('.').pop().toLowerCase();
        fileRegistry.set(fp, { name, ext, modified: null });
      }
    });
    renderList();
  }

  function removeFile(filePath) {
    fileRegistry.delete(filePath);
    renderList();
  }

  function setActive(filePath) {
    fileList.querySelectorAll('.file-entry').forEach(el => {
      el.classList.toggle('active', el.dataset.path === filePath);
    });
  }

  // ── Render ───────────────────────────────────────────────────

  function renderList() {
    fileList.innerHTML = '';

    const entries = [...fileRegistry.entries()].filter(([fp, d]) => {
      if (!filterQuery) return true;
      return d.name.toLowerCase().includes(filterQuery) ||
             fp.toLowerCase().includes(filterQuery);
    });

    const isEmpty = fileRegistry.size === 0;
    emptyState.hidden = !isEmpty;
    fileList.hidden   = isEmpty;

    entries.forEach(([fp, data]) => {
      const div = document.createElement('div');
      div.className    = 'file-entry';
      div.dataset.path = fp;
      div.title        = fp;

      const modText = data.modified
        ? formatRelativeTime(new Date(data.modified))
        : '';

      div.innerHTML = `
        <span class="file-dot ${data.ext}"></span>
        <span class="file-name">${escapeHtml(data.name)}</span>
        ${modText ? `<span class="file-modified">${modText}</span>` : ''}
      `;

      div.addEventListener('click', () => {
        if (Tabs.has(fp)) {
          Tabs.switchTo(fp);
        } else {
          window.structview.readFile(fp).then(result => {
            if (result.ok) {
              Tabs.open({
                filePath: fp,
                name: data.name,
                ext: data.ext,
                content: result.content,
                size: result.size,
                modified: result.modified,
              });
            }
          });
        }
      });

      fileList.appendChild(div);
    });

    // Re-apply active state
    const activePath = Tabs.getActivePath();
    if (activePath) setActive(activePath);
  }

  // ── Utilities ────────────────────────────────────────────────

  function formatRelativeTime(date) {
    const now   = Date.now();
    const diff  = now - date.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)   return 'just now';
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  < 7)   return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { init, addFile, addFiles, removeFile, setActive };
})();
