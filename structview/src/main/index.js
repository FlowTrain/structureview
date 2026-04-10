'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

const isDev = process.argv.includes('--dev');

let mainWindow = null;
let watcher = null;
let watchedFiles = new Set();

// ─── Window ────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 500,
    backgroundColor: '#0f0f0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  buildMenu();
}

// ─── Application Menu ───────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog(),
        },
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => openFolderDialog(),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools', visible: isDev },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About StructView',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-about');
            }
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── File Operations ─────────────────────────────────────────────────────────

async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Supported Files', extensions: ['md', 'json'] },
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    result.filePaths.forEach(fp => loadFile(fp));
  }
}

async function openFolderDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    scanFolder(result.filePaths[0]);
  }
}

function loadFile(filePath) {
  console.log('[loadFile] path:', filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    console.log('[loadFile] success, ext:', ext, 'size:', stat.size);
    mainWindow.webContents.send('file-loaded', {
      filePath,
      name: path.basename(filePath),
      ext,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
    watchFile(filePath);
  } catch (err) {
    console.error('[loadFile] error:', err.message);
    mainWindow.webContents.send('file-error', { filePath, message: err.message });
  }
}

function scanFolder(folderPath) {
  const supportedExt = new Set(['.md', '.markdown', '.json']);
  const entries = [];

  function walk(dir, depth = 0) {
    if (depth > 3) return;
    let items;
    try { items = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(full, depth + 1);
      } else if (supportedExt.has(path.extname(item.name).toLowerCase())) {
        entries.push(full);
      }
    }
  }

  walk(folderPath);
  mainWindow.webContents.send('folder-scanned', { folderPath, files: entries });
}

// ─── File Watching ────────────────────────────────────────────────────────────

function watchFile(filePath) {
  if (watchedFiles.has(filePath)) return;
  watchedFiles.add(filePath);

  if (!watcher) {
    watcher = chokidar.watch([], { persistent: true, ignoreInitial: true });
    watcher.on('change', (fp) => {
      try {
        const content = fs.readFileSync(fp, 'utf8');
        if (mainWindow) mainWindow.webContents.send('file-changed', { filePath: fp, content });
      } catch {}
    });
  }
  watcher.add(filePath);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('open-file-dialog', openFileDialog);
ipcMain.handle('open-folder-dialog', openFolderDialog);

ipcMain.handle('read-file', (_e, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    return { ok: true, content, size: stat.size, modified: stat.mtime.toISOString() };
  } catch (err) {
    return { ok: false, message: err.message };
  }
});

ipcMain.handle('open-external', (_e, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-app-version', () => app.getVersion());

// Handle file passed as CLI argument (e.g. double-clicked from OS)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) loadFile(filePath);
});

// ─── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // Handle file passed via argv on Windows/Linux
  const argFile = process.argv.find(a => /\.(md|json|markdown)$/i.test(a));
  if (argFile && fs.existsSync(argFile)) {
    mainWindow.once('ready-to-show', () => loadFile(argFile));
  }
});

app.on('window-all-closed', () => {
  if (watcher) watcher.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
