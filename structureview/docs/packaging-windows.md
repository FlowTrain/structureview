# Packaging StructureView for Windows

Two toolchains are configured. **Option 1 (electron-builder) is the primary path** — it carries the Windows config (file associations, icons, NSIS + AppX targets). Option 2 (Electron Forge/Squirrel) is the legacy path that produced the 2026-07-02 build in `out/`.

## Shared first steps (both options)

Run from the Electron app root (the directory containing `package.json`), **not** `ui/`:

```bash
npm install            # first time only
npm run ui:install     # first time only
npm run ui:build       # React UI → src/renderer-dist (required after any UI change)
npm run quality-gate   # recommended: lint + tests
npm run icons          # only if build/icon.png changed (regenerates icon.ico + build/appx/*)
```

The desktop shell loads `src/renderer-dist` when present, so a stale or missing UI build means a stale or fallback renderer in the package.

## Option 1 — electron-builder (NSIS installer + AppX)

```bash
npm run build:win
```

Output in `dist/`:

| File | What it is |
|---|---|
| `StructureView Setup <version>.exe` | NSIS installer — user-choosable install dir, registers `.md`/`.json` file associations |
| `StructureView <version>.appx` | MSIX package — Microsoft Store / enterprise (Intune) deployment |
| `win-unpacked/` | Unpacked app — zip this for an IT-pushed, no-installer distribution |

Variants:

```bash
npx electron-builder --win nsis   # installer only
npx electron-builder --win appx   # appx only
npm run pack                      # unpacked dir only (dist/win-unpacked)
```

## Option 2 — Electron Forge (Squirrel installer)

```bash
npx electron-forge package    # unpacked app → out/structureview-win32-x64
npx electron-forge make       # Squirrel installer → out/make/squirrel.windows/x64/
```

Squirrel installs silently to `%LocalAppData%\structureview` (no install dialog) and is auto-update-friendly, but has no file-association or AppX config here.

## Gotchas (learned the hard way)

- **Unsigned builds trip SmartScreen.** NSIS/Squirrel exes will warn on client machines. AppX or an IT-pushed zip of `dist/win-unpacked` avoids it. Code signing is the real fix.
- **Kill running copies before testing an install.** All builds share `%AppData%\structureview`; a running old instance locks the cache (`Unable to move the cache: Access is denied`). `taskkill /F /IM StructureView.exe`.
- **Multiple installs coexist.** Squirrel (`%LocalAppData%`), NSIS (Program Files), and older "StructView"-named installs all register shortcuts. When the app "looks old", check which exe the shortcut points at — or launch `dist/win-unpacked/StructureView.exe` directly to see the freshest build.
- **Bump `version` in package.json every build.** Multiple builds all claiming 0.1.0 are indistinguishable.
- **`appx.assets` is not a valid electron-builder option** (removed 2026-07-12). AppX assets are picked up from `build/appx/` by directory convention.
- **Script names are `ui:*` prefixed** — `ui:install`, `ui:build`, `ui:dev` — and it's `npm run`, never `npx run`.
