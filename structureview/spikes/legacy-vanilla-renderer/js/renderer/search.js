'use strict';
/* ─── In-document search ────────────────────────────────────────
   Highlights occurrences of a query in #doc-content and provides
   prev/next navigation. Exported as window.DocSearch.
──────────────────────────────────────────────────────────────── */

window.DocSearch = (() => {

  let matches    = [];
  let current    = -1;
  let lastQuery  = '';

  const $ = id => document.getElementById(id);

  function init() {
    const bar     = $('doc-search-bar');
    const input   = $('doc-search-input');
    const count   = $('doc-search-count');
    const btnPrev = $('doc-search-prev');
    const btnNext = $('doc-search-next');
    const btnClose= $('doc-search-close');
    const btnOpen = $('btn-search-in-doc');

    // Open / close
    btnOpen.addEventListener('click', openSearch);

    btnClose.addEventListener('click', closeSearch);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && !bar.hidden) {
        closeSearch();
      }
    });

    // Search as you type
    input.addEventListener('input', () => {
      run(input.value, count);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) prev(count);
        else next(count);
      }
    });

    btnPrev.addEventListener('click', () => prev(count));
    btnNext.addEventListener('click', () => next(count));

    function openSearch() {
      bar.hidden = false;
      input.focus();
      input.select();
      if (input.value) run(input.value, count);
    }

    function closeSearch() {
      bar.hidden = true;
      clearHighlights();
      matches = []; current = -1;
      count.textContent = '';
    }
  }

  // ── Core search ──────────────────────────────────────────────

  function run(query, countEl) {
    clearHighlights();
    matches = []; current = -1;
    lastQuery = query;

    if (!query || query.length < 2) {
      if (countEl) countEl.textContent = '';
      return;
    }

    const container = document.getElementById('doc-content');
    if (!container) return;

    highlight(container, query);
    matches = Array.from(container.querySelectorAll('mark.sv-highlight'));

    if (countEl) {
      countEl.textContent = matches.length
        ? `1 / ${matches.length}`
        : 'No results';
    }

    if (matches.length > 0) {
      current = 0;
      activate(countEl);
    }
  }

  function next(countEl) {
    if (!matches.length) return;
    current = (current + 1) % matches.length;
    activate(countEl);
  }

  function prev(countEl) {
    if (!matches.length) return;
    current = (current - 1 + matches.length) % matches.length;
    activate(countEl);
  }

  function activate(countEl) {
    matches.forEach(m => m.classList.remove('current'));
    const m = matches[current];
    if (!m) return;
    m.classList.add('current');
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (countEl) countEl.textContent = `${current + 1} / ${matches.length}`;
  }

  // ── DOM highlighter (text node walker) ───────────────────────

  function highlight(root, query) {
    const regex = new RegExp(escapeRegex(query), 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        // Skip already-highlighted marks and code/pre for MD
        if (p.tagName === 'MARK' || p.closest('pre') || p.closest('code'))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodesToReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      if (regex.test(node.textContent)) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach(textNode => {
      const parent = textNode.parentNode;
      if (!parent) return;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let m;
      regex.lastIndex = 0;
      const text = textNode.textContent;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        const mark = document.createElement('mark');
        mark.className = 'sv-highlight';
        mark.textContent = m[0];
        frag.appendChild(mark);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      parent.replaceChild(frag, textNode);
    });
  }

  function clearHighlights() {
    const container = document.getElementById('doc-content');
    if (!container) return;
    container.querySelectorAll('mark.sv-highlight').forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Re-run search after content is replaced (e.g. file reload)
  function rerun() {
    if (lastQuery && !document.getElementById('doc-search-bar').hidden) {
      const count = document.getElementById('doc-search-count');
      run(lastQuery, count);
    }
  }

  return { init, run, rerun, clearHighlights };
})();
