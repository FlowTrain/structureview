# StructView — VS Code Extension

Clean document-style preview for Markdown and JSON files — part of the [FlowTrain](https://github.com/FlowTrain) toolchain.

---

## Features

- **Markdown** rendered as a clean, typeset document — headings, tables, code blocks, task lists, blockquotes
- **JSON** as an interactive collapsible tree with syntax coloring
- **Live preview** — updates as you type, no save required
- **Scroll sync** — editor and preview stay in step
- **In-preview search** — Ctrl+F with prev/next navigation
- **Raw source toggle** — flip between rendered and source with Ctrl+`
- **Theme-aware** — works with any VS Code light, dark, or high-contrast theme automatically
- **Works in Cursor and Windsurf** — any VS Code-compatible editor

---

## Usage

### Open a preview

| Method | Action |
|---|---|
| `Ctrl+Shift+V` | Open preview to the side |
| Editor title bar icon | Click the preview icon (▤) |
| Right-click in editor | StructView: Open Preview |
| Right-click in Explorer | StructView: Open Preview |
| Command Palette | `StructView: Open Preview to Side` |

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+V` | Open / focus preview |
| `Ctrl+F` | Search in preview |
| `Ctrl+`` ` | Toggle raw source |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `structview.autoPreview` | `false` | Auto-open preview when a file opens |
| `structview.syncScroll` | `true` | Sync scroll position with editor |
| `structview.defaultView` | `rendered` | Start in rendered or raw mode |
| `structview.jsonAutoCollapse` | `true` | Auto-collapse large JSON nodes |

---

## Installation

### From the Marketplace
Search **StructView** in the VS Code Extensions panel and click Install.

### Manual (VSIX)
```bash
code --install-extension structview-0.1.0.vsix
```

### Build from source
```bash
git clone https://github.com/FlowTrain/structureview
cd structureview/structview-vscode
npm install
npm run package   # produces structview-0.1.0.vsix
```

---

## Part of the FlowTrain Toolchain

| Tool | Description |
|---|---|
| [StructView Electron](https://github.com/FlowTrain/structureview) | Standalone desktop app |
| [Brand Portal](https://github.com/FlowTrain/brand-portal) | FlowTrain brand assets and guidelines |
| [Quality Guardian](https://github.com/FlowTrain/Clean_Code_Quality_Guardian) | Code quality tooling |

---

## License

MIT © [James Gifford / FlowTrain](https://github.com/FlowTrain)
