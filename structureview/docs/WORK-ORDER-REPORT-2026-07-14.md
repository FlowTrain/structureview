# Work Order Report — 2026-07-14 — Claude Code (routed via Dispatch)

> Re: *Work Order — StructureView: JSON→UI Activity + Bug Fixes* (prepared 2026-07-11).
> Dispatch proof-point run. All three activities shipped; the quality gate is green on the
> final state; per-activity commits present; one pre-existing blocker and two `[NEEDS OWNER]`
> items surfaced rather than guessed.

## §7 summary

- **Activity 1 (Corpus): DONE** — Corpus panel derived live via `useMemo` over open `docs`
  (files = `docs.length`; total requirements = Σ each doc's EARS requirement lines; PASS/WARN/FAIL
  = docs bucketed by composite score >80 / 60–80 / <60 from the TIMC Light engine). Purged the
  `SAMPLE_DOCS` seeding and deleted `ui/src/timc-samples.js`; app now starts on an honest empty
  state. Verified against the real engine (0 docs → all zeros; N docs → live counts/buckets).
- **Activity 2 (Mockup Canvas): DONE B1 / B2** — landed in **`ui/`** (see `[NEEDS OWNER]` #1).
  Lazy `/mockup` route (separate 24 kB chunk, not in the main bundle) + Sidebar nav item.
  Click-to-add region boxes on a CSS grid from the B1D vocabulary, arrow-key nudge (no dnd-kit),
  component rows with data-element chips + state tags. Reveal flips the right pane to a
  self-contained JSON tree of the canvas state, captioned verbatim *"a more precise version of
  what you already drew."* localStorage autosave, `Download .json`. B2: B1D lint pane
  (emerging/working/strong), `Download .html` skeleton `ui-layout-[screen].html`, canvas empty +
  corrupt-draft error states. Verified end-to-end in-browser: built a real screen → reveal →
  persisted deliverable validates against the B1D shape; lint climbs emerging→strong; exported
  HTML parses clean with the expected landmarks.
- **Activity 3 (Cleanup): DONE 3a / 3b** — 3a: removed the Antagonist `<Route>` + lazy import
  and the Sidebar nav item; `Antagonist.tsx` retained on disk (no longer imported, so no
  Antagonist chunk is emitted); old `/antagonist` links fall through to the catch-all redirect.
  3b: opening a doc from an active cross-file search carries the query into the Document reader,
  highlights every occurrence, and scrolls to the first hit (with a term/match-count bar + Clear).
- **Quality gate: GREEN** — `29 suites / 237 tests pass`, `0 lint errors` (33 pre-existing
  warnings, unchanged). ⚠️ It was **RED at baseline** — see Surprises.
- **[NEEDS OWNER] decisions surfaced:**
  1. **MockupCanvas home: `ui/` vs `spikes/`.** Defaulted to **`ui/`** per work order §3 default.
     The `spikes/` lane (fleet-packaging §4) does not exist in the repo yet, so `ui/` was the only
     concrete option; confirm whether it should move to `spikes/` when that lane is stood up.
  2. **Constitution files absent.** `AGENTS.md` and `CLAUDE.md` (work order §0, "the
     constitution") are **not present** in the repo root, nor under `C:\Users\JamesGifford\.claude`
     (only an unrelated `ai_upskilling/CLAUDE.md`). Proceeded using `README.md`,
     `docs/BUILD-BACKLOG.md`, and the two spec docs. Owner may want to add them.
- **Commits (per activity, oldest→newest):**
  - `95fbf13` fix(main): commit antagonist unwiring so contract tests + gate go green *(pre-flight — see Surprises)*
  - `a56898a` fix(ui): wire Corpus panel to live docs; purge sample data *(Activity 1)*
  - `e1f8d78` feat(ui): mockup canvas spike (B1) *(Activity 2)*
  - `5a55a94` feat(ui): mockup canvas class-ready — B1D lint + html export (B2) *(Activity 2)*
  - `5a92964` chore(ui): remove antagonist route *(Activity 3a)*
  - `f700afb` feat(ui): carry search query into opened doc *(Activity 3b)*

## Guardrails honored

- `src/main/antagonist.js` **untouched**; the spike stays unwired. Its re-entry still requires the
  documented contract-test update + Decision Log entry.
- Quality gate green after every activity; per-activity commits; no new mock data (Activity 1
  *removes* it, and the canvas starts empty — no seeded examples).
- Context contract respected: read only §0's listed docs (constitution files were missing);
  everything else retrieved just-in-time.

## Notes / surprises (owner should know)

1. **The gate was RED at baseline — pre-existing uncommitted drift.** The 2026-07-11 antagonist
   *unwiring* was left uncommitted in `src/main/index.js` + `preload.js`, but the working tree also
   had **backwards** edits to `__tests__/main-index-surface.test.js` and `__tests__/preload.test.js`
   that *re-added* `antagonist:*` expectations — so the contract tests asserted handlers the
   unwired source no longer registers (2 failing tests). The work order asserts these "currently
   pass," so this was a genuine surprise. Resolution (commit `95fbf13`): kept the source unwired
   (matches §1 intent + the in-source unwire comments) and dropped the erroneous test additions so
   the contract tests match the unwired surface. This is exactly the "contract-test update" the
   unwire comments call for — **not** a re-wire, and `antagonist.js` was not touched. This was the
   only way to give the three activities a green baseline to build on.
2. **Shipping surface is the React `ui/`, not the vanilla renderer.** `src/main/index.js` loads
   `src/renderer-dist/` (the built React app) when present, falling back to `src/renderer/` (the
   vanilla `window.*` renderer). All of Activities 1/2/3a target the React app. For 3b: the work
   order prose cited the vanilla `src/renderer/js/renderer/search.js`, but (a) the vanilla Sidebar
   only filters by *filename*, not the cross-file *content* search the field-finding describes
   ("referenced in N other specs"), which lives **only** in the React StructureView; and (b) the
   work order's own commit scope for 3b is **`feat(ui)`** — matching its other React changes. So 3b
   was implemented in `ui/`, reproducing the search.js highlight/scroll behavior in the React
   reader. Flagging in case the owner intended the vanilla fallback instead.
3. **JSON reveal is a React re-implementation, not the window-global renderer.** The vanilla
   `json.js` renderer depends on CCQG design tokens (`--text-primary`, `--border-strong`) absent
   from the `ui/` flowtrain token set, and on being a `window.JSONRenderer` global. Rather than
   couple the self-contained Vite app to it (and ship a mis-tokened tree), the reveal uses a small
   self-contained React JSON tree with the `ui/` tokens — same collapsible-tree UX, faithful to the
   "reveal the structure you drew" intent.
4. **`ui/` has no test harness and is excluded from the gate.** ESLint `ignorePatterns` and Jest
   `collectCoverageFrom` both exclude `ui/`; the root gate covers the Electron `src/` only. So the
   `ui/` activities are gate-neutral, and B2's "any new tests pass the gate" had no harness to hook
   into — behavior was verified end-to-end in a real browser instead (documented per commit).
5. **Vite dev server crashes here** on a corrupt `lucide-react` source map
   (`Unexpected end of file in source map`) — an environment/dependency issue, not app code. The
   production `vite build` is unaffected; browser verification used `vite preview` on the build.
6. **Untracked planning docs left as-is.** `docs/BUILD-BACKLOG.md`, `docs/fleet-packaging-and-spikes-spec.md`,
   and `docs/HANDOFF-json-ui-and-bugfix.md` were already untracked at session start; not committed
   (owner's planning docs). The BUILD-BACKLOG items for Corpus, Antagonist-in-UI, MockupCanvas
   B1/B2, and cross-file→in-doc highlight are all now addressed and can be checked off.

## Dispatch proof-point self-assessment (§6)

- **Respected the context contract (§0):** read only the listed docs; noted the missing
  constitution rather than hunting the whole repo.
- **Honored the guardrails (§1):** `antagonist.js` untouched; gate green after every activity; no
  new mock data.
- **Per-activity commits:** yes — one focused commit per activity (plus one clearly-scoped
  pre-flight to repair the inherited red baseline).
- **Stop-and-log over guessing:** surfaced the `ui/` vs `spikes/` decision, the missing
  constitution, and the red-baseline drift instead of silently guessing.
