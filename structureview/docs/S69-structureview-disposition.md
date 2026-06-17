# S69 disposition — StructureView desktop additions

> **Input to S69** (*Design System Extraction & New UI Salvage*). This records the S69
> disposition + token remap for the UI/logic added to the StructureView Electron app, so
> the reusable parts feed `trainyard-design-system` / `@trainyard/ui` rather than forking.
> It is a contribution to the CCQG S69 artifacts (`docs/design/new-ui-salvage-map.md`,
> `docs/design/new-ui-token-remap.md`); paths below are in `FlowTrain/structureview`.

Dispositions use the S69 categories: `extract-component`, `extract-pattern`,
`demo-surface`, `product-candidate`, `archive-prototype`, `discard`.

## 1. Artifact disposition

| Artifact | Disposition | Owner → consumer | Notes |
|---|---|---|---|
| `src/timc-light/` (`@trainyard/timc-light`) | **extract-component** (shared lib) | shared package → StructureView (desktop + web), Quality Guardian | Framework-free ESM, zero deps, browser + Node. Already a package boundary (`index.js`/`index.d.ts`). Hoist to a `packages/` workspace or its own repo; no rewrite. **The clean win.** |
| TIMC panel — composite score, Q-style metric bars, EARS/Sections/BDD segmented toggle, findings list, upgrade CTA (`StructureView.tsx`) | **extract-pattern** + `extract-component` (segmented toggle, metric bar) | `@trainyard/ui` pattern → StructureView product page | Bind to live engine output; the segmented control + horizontal metric bar are reusable primitives. |
| Document reader — `marked` + `highlight.js`, `.doc-reader` styles | **extract-pattern** ("Markdown/JSON document reader") | `@trainyard/ui` → any product that views artifacts | Needs token remap (§2). Link clicks routed to host (`openExternal`). |
| Documents list — filter/cross-file search, match-count badges, remove ×, folder loading, open actions | **extract-pattern** ("document list + cross-file search") | `@trainyard/ui` pattern → StructureView page | Cross-file reference search is product-distinctive; keep as composed pattern. |
| `Sidebar` / `Topbar` (`components/layout/`) | **extract-component** | `@trainyard/ui` | Already named in S69 examples (sidebar primitives, panel headers). The collapse behavior is wired here; promote to the canonical shell components (defer to S46 RoundhouseShell). |
| `flowtrain.css` + `.doc-reader` additions | **discard (file)** / **token-remap (values)** | → `@trainyard/ui` tokens | Brand-conflicted prototype stylesheet. Discard the file once consumers use design-system tokens; remap values per §2. |
| HashRouter SPA shell, `ui/vite.config.js`, `ui/index.html`, `ui/package.json` | **archive-prototype** (web) / keep (desktop) | desktop only | The web platform routes through RoundhouseShell (S46); this Vite/Hash shell is the desktop packaging wrapper, not product architecture. |
| Sample docs (`timc-samples.js`), mock nav badges (`Documents 5`, `EARS 247`), Corpus stats card (`184`, `5 files`) | **discard** | — | Prototype mock data. Replace with real counts or remove (see `ui/BACKLOG.md`). |
| Spec-driven help links + bundled `spec-instructions.md` | **product-candidate** | StructureView page | Keep as product content. `spec-instructions.md` is a CCQG artifact — reference/sync, don't fork. |

## 2. Token remap — `flowtrain.css` → `@trainyard/ui`

`@trainyard/ui` (S32-derived) uses shadcn-style semantic tokens. Mapping for the variables
this app actually uses:

| flowtrain.css | `@trainyard/ui` token | Note |
|---|---|---|
| `--ft-blue` (#2BAEE4 brand) | `--primary` | **Brand conflict** — flowtrain blue vs. design-system primary. Resolve in S69, don't hardcode. |
| `--ft-gold` | `--fleet-gold` | Composite-score accent. |
| `--ok` / `--warn` / `--err` | `--color-success` / `--color-warning` / `--color-error` | Traffic-light scoring + dots/badges. |
| `--bg` | `--background` | |
| `--sf2` (raised surface) | `--card` (or `--muted`) | Panels, code blocks, search input. |
| `--bd` | `--border` / `--input` | |
| `--tx` | `--foreground` | |
| `--txm` (muted) | `--muted-foreground` | |
| `--txf` (faint) | `--muted-foreground` (reduced) | No 1:1; derive from muted-foreground. |
| `--ff-display` | `--font-display` | |
| `--ff-mono` | `--font-mono` | Reader code blocks. |
| `--r-sm` / `--r-md` | `--radius-sm` / `--radius-md` | |
| `--s1…--s5` (spacing) | design-system spacing scale / Tailwind | flowtrain spacing has no token equivalent yet — map to the scale or Tailwind utilities. |

Code-block colors come from a `highlight.js` theme (`github-dark`); align that to design-system
surface/contrast tokens, or ship a tokenized highlight theme, when extracting the reader.

## 3. Open decisions / handoffs

1. **Brand primary** — `--ft-blue` vs `@trainyard/ui --primary`. Needs the S69 / brand call before remap.
2. **Engine home** — which shared location owns `@trainyard/timc-light` (`packages/` workspace vs standalone repo) and its publish cadence (S69 explicitly defers npm publication).
3. **Shell ownership** — Sidebar/Topbar promotion is governed by S46 (RoundhouseShell); this app's collapse wiring is a candidate, not the canonical implementation.
