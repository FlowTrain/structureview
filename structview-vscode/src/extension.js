'use strict';

const vscode = require('vscode');
const path   = require('path');
const fs     = require('fs');

// ── Panel registry ─────────────────────────────────────────────
// Map<filePath, PreviewPanel>
const panels = new Map();

// ── Activate ───────────────────────────────────────────────────

function activate(context) {

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('structview.openPreview', (uri) => {
      openPreview(context, uri, false);
    }),
    vscode.commands.registerCommand('structview.openPreviewToSide', (uri) => {
      openPreview(context, uri, true);
    }),
    vscode.commands.registerCommand('structview.toggleRaw', () => {
      const panel = getActivePanel();
      if (panel) panel.toggleRaw();
    }),
    vscode.commands.registerCommand('structview.refresh', () => {
      const panel = getActivePanel();
      if (panel) panel.refresh();
    }),
  );

  // Auto-preview on open (if configured)
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const config = vscode.workspace.getConfiguration('structview');
      if (!config.get('autoPreview')) return;
      if (isSupportedFile(doc.uri)) {
        openPreview(context, doc.uri, true);
      }
    }),
  );

  // Live update when active editor changes content
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const filePath = e.document.uri.fsPath;
      if (panels.has(filePath)) {
        panels.get(filePath).updateContent(e.document.getText());
      }
    }),
  );

  // Track active editor to update context key
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateContextKey();
    }),
  );
}

// ── Open / focus a preview panel ────────────────────────────────

function openPreview(context, uri, toSide) {
  // Resolve URI — from command palette uri may be undefined, use active editor
  if (!uri) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    uri = editor.document.uri;
  }

  if (!isSupportedFile(uri)) {
    vscode.window.showInformationMessage('StructView: Only .md and .json files are supported.');
    return;
  }

  const filePath = uri.fsPath;

  // If panel already open, just reveal it
  if (panels.has(filePath)) {
    panels.get(filePath).reveal();
    return;
  }

  // Create new panel
  const panel = new PreviewPanel(context, uri, toSide);
  panels.set(filePath, panel);

  panel.onDispose(() => {
    panels.delete(filePath);
    updateContextKey();
  });
}

// ── PreviewPanel class ──────────────────────────────────────────

class PreviewPanel {
  constructor(context, uri, toSide) {
    this._context  = context;
    this._uri      = uri;
    this._filePath = uri.fsPath;
    this._fileName = path.basename(uri.fsPath);
    this._ext      = path.extname(uri.fsPath).toLowerCase().slice(1);
    this._rawMode  = vscode.workspace.getConfiguration('structview').get('defaultView') === 'raw';
    this._disposed = false;
    this._onDisposeCb = null;

    // Create webview panel
    const column = toSide
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.Active;

    this._panel = vscode.window.createWebviewPanel(
      'structviewPreview',
      `Preview: ${this._fileName}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'media'),
        ],
        retainContextWhenHidden: true,
      },
    );

    // Set initial content
    this._panel.webview.html = this._buildHtml();
    this._loadFile();

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage((msg) => {
      this._handleMessage(msg);
    }, null, context.subscriptions);

    // Sync scroll from editor → preview
    context.subscriptions.push(
      vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (e.textEditor.document.uri.fsPath !== this._filePath) return;
        const config = vscode.workspace.getConfiguration('structview');
        if (!config.get('syncScroll')) return;
        const firstLine = e.visibleRanges[0]?.start.line ?? 0;
        this._panel.webview.postMessage({ type: 'scroll-to-line', line: firstLine });
      }),
    );

    // Clean up on panel close
    this._panel.onDidDispose(() => {
      this._disposed = true;
      if (this._onDisposeCb) this._onDisposeCb();
    });

    // Watch file for external changes (saves from another editor, etc.)
    this._watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.Uri.file(path.dirname(this._filePath)),
        this._fileName,
      ),
    );
    this._watcher.onDidChange(() => this._loadFile());
    context.subscriptions.push(this._watcher);

    updateContextKey();
  }

  // ── Public methods ────────────────────────────────────────────

  reveal() {
    this._panel.reveal();
  }

  updateContent(text) {
    this._panel.webview.postMessage({
      type: 'update-content',
      content: text,
      rawMode: this._rawMode,
    });
  }

  toggleRaw() {
    this._rawMode = !this._rawMode;
    this._panel.webview.postMessage({ type: 'toggle-raw', rawMode: this._rawMode });
  }

  refresh() {
    this._loadFile();
  }

  onDispose(cb) {
    this._onDisposeCb = cb;
  }

  // ── Private ───────────────────────────────────────────────────

  _loadFile() {
    try {
      // Prefer the live editor buffer if the file is open
      const openDoc = vscode.workspace.textDocuments.find(
        d => d.uri.fsPath === this._filePath,
      );
      const content  = openDoc ? openDoc.getText() : fs.readFileSync(this._filePath, 'utf8');
      const stat     = fs.statSync(this._filePath);

      this._panel.webview.postMessage({
        type: 'load-file',
        filePath: this._filePath,
        name: this._fileName,
        ext: this._ext,
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        rawMode: this._rawMode,
      });
    } catch (err) {
      this._panel.webview.postMessage({
        type: 'file-error',
        message: err.message,
      });
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'open-external':
        vscode.env.openExternal(vscode.Uri.parse(msg.url));
        break;
      case 'ready':
        this._loadFile();
        break;
      case 'error':
        vscode.window.showErrorMessage(`StructView: ${msg.message}`);
        break;
    }
  }

  // ── HTML shell ────────────────────────────────────────────────

  _buildHtml() {
    const webview = this._panel.webview;
    const mediaUri = (rel) => webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', rel),
    );

    // Content Security Policy
    const nonce = getNonce();
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} data: https:`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StructView</title>
  <link rel="stylesheet" href="${mediaUri('css/vscode-theme.css')}" />
  <link rel="stylesheet" href="${mediaUri('css/markdown.css')}" />
  <link rel="stylesheet" href="${mediaUri('css/json.css')}" />
  <link rel="stylesheet" href="${mediaUri('css/hljs-theme.css')}" />
</head>
<body>

  <div id="toolbar">
    <span id="toolbar-filename"></span>
    <div id="toolbar-right">
      <button id="btn-raw"    title="Toggle raw source (Ctrl+\`)">{ }</button>
      <button id="btn-search" title="Search (Ctrl+F)">⌕</button>
    </div>
  </div>

  <div id="search-bar" hidden>
    <input id="search-input" type="text" placeholder="Search…" autocomplete="off" spellcheck="false" />
    <span id="search-count"></span>
    <button id="search-prev">↑</button>
    <button id="search-next">↓</button>
    <button id="search-close">✕</button>
  </div>

  <div id="doc-scroll">
    <div id="doc-content"></div>
  </div>

  <script nonce="${nonce}" src="${mediaUri('js/vendor/marked.min.js')}"></script>
  <script nonce="${nonce}" src="${mediaUri('js/vendor/highlight.min.js')}"></script>
  <script nonce="${nonce}" src="${mediaUri('js/renderer/markdown.js')}"></script>
  <script nonce="${nonce}" src="${mediaUri('js/renderer/json.js')}"></script>
  <script nonce="${nonce}" src="${mediaUri('js/renderer/search.js')}"></script>
  <script nonce="${nonce}" src="${mediaUri('js/webview.js')}"></script>
</body>
</html>`;
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function isSupportedFile(uri) {
  const ext = path.extname(uri.fsPath).toLowerCase();
  return ext === '.md' || ext === '.markdown' || ext === '.json';
}

function getActivePanel() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return null;
  return panels.get(editor.document.uri.fsPath) || null;
}

function updateContextKey() {
  const editor = vscode.window.activeTextEditor;
  const active = editor && panels.has(editor.document.uri.fsPath);
  vscode.commands.executeCommand('setContext', 'structview.previewActive', active);
}

function getNonce() {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function deactivate() {
  panels.forEach(p => p._panel.dispose());
  panels.clear();
}

module.exports = { activate, deactivate };
