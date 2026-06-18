# StructureView UI (React renderer)

The React renderer for the StructureView Electron app, bundled from the
`roundhousehq-ui-experiment` prototype (StructureView page + Login, design system via
`flowtrain.css`). The TIMC Light panel is driven live by the shared engine at
`../src/timc-light` (imported through the `@timc` Vite alias).

## Build & run

From the Electron app root (`structureview/`):

```bash
npm run ui:install     # one-time: install the UI's dependencies
npm run ui:build       # build into ../src/renderer-dist (shipped in the app package)
npm start              # launch Electron — it loads renderer-dist when present
```

During UI development you can run the Vite dev server with `npm run ui:dev`.

## Known npm-audit advisories (accepted, dev-only)

`npm install` reports a couple of advisories (e.g. "2 vulnerabilities (1 moderate, 1 high)").
These are **accepted risk** and require no action:

- They originate from **`esbuild`'s development server**, inherited transitively through
  **`vite`** — a `devDependency` (advisory [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
  and successors).
- `vite`/`esbuild` are **build-time only**. They produce `../src/renderer-dist` and are not
  part of the shipped Electron app — the packaged renderer contains no esbuild.
- The advisory only applies while the **dev server** (`npm run ui:dev`) is running and a
  malicious web page targets its port — not a realistic exposure for a desktop build tool.
- The CI quality gate does **not** run `npm audit`, so these do not block anything.
- **Do not run `npm audit fix --force`** — it jumps to a breaking major (vite 8). Revisit
  when vite/esbuild ship a clean fix; bumping to vite 7 reduces the set but leaves a low
  dev-only advisory.

## How it loads

`src/main/index.js` loads `src/renderer-dist/index.html` when it exists, and otherwise
falls back to the self-contained vanilla renderer (`src/renderer/index.html`) — so the
window is never blank, built or not. Packaging (`electron-builder`) includes
`src/renderer-dist` and excludes this `ui/` source tree (see `files` in the root
`package.json`).

## Routing

Uses `HashRouter` (not `BrowserRouter`) so navigation works under the `file://` protocol
in the packaged app, and Vite `base: './'` so assets resolve with relative paths.

## Still to wire (next phase)

The TIMC Light panel currently analyses bundled sample documents (`src/timc-samples.js`).
The next step is to feed it the file the user actually opens via the existing preload IPC
(`window.structview` — `onFileLoaded`, `readFile`), replacing the samples.
