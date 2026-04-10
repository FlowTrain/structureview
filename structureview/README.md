# StructView

A clean, document-style desktop viewer for Markdown (`.md`) and JSON (`.json`) files — built with Electron.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Launch the app
npm start
```

That's it. The app opens and you can drag files in or use File → Open.

---

## Features (Milestone 1)

| Feature | Details |
|---|---|
| Markdown rendering | Full GFM — headings, tables, blockquotes, task lists, fenced code |
| Syntax highlighting | 190+ languages via highlight.js |
| JSON tree viewer | Collapsible interactive tree, token-colored, auto-collapses large nodes |
| Multi-tab | Open multiple files simultaneously, scroll position remembered per tab |
| File sidebar | Lists open files, filter by name, relative timestamps |
| Live file watching | Files update automatically when changed on disk |
| In-doc search | Ctrl+F, prev/next navigation, match count |
| Raw source toggle | Ctrl+` to flip between rendered and raw view |
| Drag & drop | Drop .md or .json files directly onto the window |
| File associations | Double-click .md/.json from OS to open in StructView (after build) |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+W` | Close active tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+F` | Search in document |
| `Ctrl+`` ` | Toggle raw source |

---

## Building Installers

```bash
# Windows (.exe installer + Microsoft Store .appx)
npm run build:win

# Linux (.AppImage + .deb)
npm run build:linux

# Current platform only (faster, for testing)
npm run pack
```

Output goes to `dist/`.

> **Note:** Building requires an internet connection to download the Electron binary on first run. After that it's cached.

---

## Project Structure

```
structview/
├── package.json
└── src/
    ├── main/
    │   ├── index.js          # Main process (window, IPC, file watching)
    │   └── preload.js        # Secure context bridge
    └── renderer/
        ├── index.html        # App shell
        ├── css/
        │   ├── theme.css     # Design tokens & dark theme
        │   ├── layout.css    # Shell, sidebar, tabs, viewer
        │   ├── markdown.css  # Document rendering styles
        │   ├── json.css      # JSON tree viewer styles
        │   └── hljs-theme.css # Syntax highlight token colors
        └── js/
            ├── app.js        # Entry point — wires all modules
            ├── vendor/
            │   ├── marked.min.js
            │   └── highlight.min.js
            └── renderer/
                ├── markdown.js  # Markdown render pipeline
                ├── json.js      # JSON tree renderer
                ├── search.js    # In-document search
                ├── tabs.js      # Tab manager
                └── sidebar.js   # File list sidebar
```

---

## Roadmap

### Milestone 2 — VS Code Extension
- Extract the renderer modules into a VS Code webview panel
- Shared rendering logic between Electron and VS Code
- Publish to VS Code Marketplace (and Cursor / Windsurf)

### Future
- AI summary panel (bring-your-own API key)
- Export to PDF / HTML
- Cross-file search
- Pro subscription tier
