// MockupCanvas — PR B1 spike (JSON→UI Mockup Canvas).
//
// The pedagogy: Markdown/JSON read as "coded languages" to Tier 1–2 learners. Let them
// produce structure *spatially* (draw region boxes, hang components off them) and then meet
// its text form as a reveal — "a more precise version of what you already drew."
//
// The design center (docs/classroom-build-and-mockup-canvas-plan.md, Workstream B): the canvas
// state model mirrors the B1D deliverable JSON (regions → components → dataElements → states),
// so "Reveal JSON" is a view toggle, not a converter. The only fields elided from the reveal
// are presentation-only (internal ids, grid coordinates) — the semantic content is identical.
//
// Spike scope (mirrors the SpecAuthor PR1 shape — one lazy route, no scope creep): click-to-add
// region boxes on a CSS grid + arrow-key nudge (no @dnd-kit dependency — that's a fast-follow),
// component rows with data-element chips and state tags, localStorage autosave, Download .json.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ── B1D vocabulary ────────────────────────────────────────────────────────────────────────
const REGION_TYPES = ['header', 'sidebar', 'content', 'footer', 'overlay'] as const
type RegionType = (typeof REGION_TYPES)[number]

const STATE_TAGS = ['default', 'loading', 'empty', 'error', 'populated'] as const
type StateTag = (typeof STATE_TAGS)[number]

interface MockComponent {
  id: string
  name: string
  dataElements: string[]
  states: StateTag[]
}
interface Region {
  id: string
  name: string
  type: RegionType
  col: number // grid column (0-based) — canvas placement only, not part of the deliverable
  row: number // grid row (0-based)
  components: MockComponent[]
}
interface MockupDoc {
  screen: string
  regions: Region[]
}

// The B1D deliverable shape — what "Reveal JSON" shows and Download .json emits. Presentation-
// only fields (ids, grid coordinates) are dropped; regions/components/dataElements/states remain.
interface Deliverable {
  screen: string
  regions: Array<{
    name: string
    type: RegionType
    components: Array<{ name: string; dataElements: string[]; states: StateTag[] }>
  }>
}

const GRID_COLS = 4
const GRID_ROWS = 4

// Region type → accent colour (canvas box + JSON badge share the vocabulary).
const TYPE_COLOR: Record<RegionType, string> = {
  header: 'var(--ft-blue)',
  sidebar: 'var(--warn)',
  content: 'var(--ok)',
  footer: 'var(--txm)',
  overlay: '#a855f7',
}

// ── Persistence (SpecAuthor pattern: single-slot localStorage autosave) ─────────────────────
const STORAGE_KEY = 'mockupCanvas.draft.v1'

let _seq = 0
function uid(prefix: string): string {
  _seq += 1
  return `${prefix}_${_seq}`
}

function emptyDoc(): MockupDoc {
  return { screen: '', regions: [] }
}

// Guarded read — localStorage can throw in private/sandboxed contexts; never crash the route.
// `error` is true only when a saved draft existed but was unreadable (corrupt JSON / wrong
// shape), so the canvas can surface an honest recovery banner (B2 error state).
function loadInitial(): { doc: MockupDoc; error: boolean } {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed && Array.isArray(parsed.regions)) return { doc: normalise(parsed), error: false }
        } catch {
          // fall through to the corrupt-draft branch below
        }
        return { doc: emptyDoc(), error: true }
      }
    }
  } catch {
    // storage blocked entirely — not a corrupted draft, just start empty
  }
  return { doc: emptyDoc(), error: false }
}

// Repair a loaded doc so a hand-edited or older draft can't break rendering (B2 error posture).
function normalise(d: any): MockupDoc {
  return {
    screen: typeof d.screen === 'string' ? d.screen : '',
    regions: (Array.isArray(d.regions) ? d.regions : []).map((r: any) => ({
      id: typeof r.id === 'string' ? r.id : uid('r'),
      name: typeof r.name === 'string' ? r.name : 'region',
      type: (REGION_TYPES as readonly string[]).includes(r.type) ? r.type : 'content',
      col: Number.isInteger(r.col) ? Math.max(0, Math.min(GRID_COLS - 1, r.col)) : 0,
      row: Number.isInteger(r.row) ? Math.max(0, Math.min(GRID_ROWS - 1, r.row)) : 0,
      components: (Array.isArray(r.components) ? r.components : []).map((c: any) => ({
        id: typeof c.id === 'string' ? c.id : uid('c'),
        name: typeof c.name === 'string' ? c.name : 'Component',
        dataElements: Array.isArray(c.dataElements) ? c.dataElements.filter((x: any) => typeof x === 'string') : [],
        states: Array.isArray(c.states) ? c.states.filter((x: any) => (STATE_TAGS as readonly string[]).includes(x)) : [],
      })),
    })),
  }
}

function toDeliverable(doc: MockupDoc): Deliverable {
  return {
    screen: doc.screen,
    regions: doc.regions.map((r) => ({
      name: r.name,
      type: r.type,
      components: r.components.map((c) => ({
        name: c.name,
        dataElements: c.dataElements,
        states: c.states,
      })),
    })),
  }
}

function slugify(s: string, fallback: string): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || fallback
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// B1D artifact: the canvas state as a skeleton `ui-layout-[screen].html`. Each region becomes a
// semantic landmark (header/aside/main/footer, overlay → role="dialog"); components are
// placeholders listing their data elements, with states carried on a data-states attribute.
function toHtml(doc: MockupDoc): string {
  const landmark: Record<RegionType, string> = {
    header: 'header', sidebar: 'aside', content: 'main', footer: 'footer', overlay: 'div',
  }
  const screen = doc.screen || 'screen'
  const regionsHtml = doc.regions
    .map((r) => {
      const tag = landmark[r.type]
      const attrs = r.type === 'overlay' ? ' role="dialog" aria-modal="true"' : ''
      const comps = r.components
        .map(
          (c) => `      <section class="component" data-states="${escHtml(c.states.join(' '))}">
        <h3>${escHtml(c.name)}</h3>
        <ul class="data-elements">${c.dataElements.map((d) => `<li>${escHtml(d)}</li>`).join('')}</ul>
      </section>`
        )
        .join('\n')
      return `    <${tag} class="region region-${r.type}"${attrs} data-region="${escHtml(r.name)}">
      <!-- ${r.type}: ${escHtml(r.name)} -->
${comps}
    </${tag}>`
    })
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(screen)} — layout skeleton</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; color: #222; }
    .region { border: 1px dashed #bbb; padding: 12px; margin: 8px 0; border-radius: 6px; }
    .region-header  { background: #eef2ff; }
    .region-sidebar { background: #fffbe6; }
    .region-content { background: #eefaf0; }
    .region-footer  { background: #f4f4f5; }
    .region-overlay { position: fixed; inset: 20% 25%; background: #fff; box-shadow: 0 8px 40px rgba(0,0,0,.2); }
    .component { border: 1px solid #ddd; padding: 8px; margin: 6px 0; background: #fff; border-radius: 4px; }
    .data-elements { margin: 4px 0 0; padding-left: 18px; color: #666; font-size: .9em; }
    h3 { margin: 0 0 4px; font-size: 14px; }
  </style>
</head>
<body>
  <!-- ui-layout-${slugify(screen, 'screen')}.html — B1D deliverable skeleton generated by
       StructureView Mockup Canvas. Regions are landmarks; components are placeholders. -->
${regionsHtml}
</body>
</html>
`
}

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke next tick — synchronous revoke can cancel the download in some WebViews.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// ── Self-contained JSON tree (reproduces the vanilla src/renderer json.js tree UX in React,
//    themed with the ui/ tokens rather than importing the window-global renderer + CCQG CSS). ─
function JsonTree({ value, k, last }: { value: any; k?: string | number; last?: boolean }) {
  const [open, setOpen] = useState(true)
  const isObj = value && typeof value === 'object'
  const keyLabel =
    k === undefined ? null : typeof k === 'number' ? (
      <span className="mc-json-index">{k}</span>
    ) : (
      <>
        <span className="mc-json-key">"{k}"</span>
        <span className="mc-json-colon">:</span>
      </>
    )
  const comma = last ? null : <span className="mc-json-comma">,</span>

  if (!isObj) {
    let cls = 'mc-json-null'
    let text = 'null'
    if (typeof value === 'string') { cls = 'mc-json-string'; text = `"${value}"` }
    else if (typeof value === 'number') { cls = 'mc-json-number'; text = String(value) }
    else if (typeof value === 'boolean') { cls = 'mc-json-boolean'; text = String(value) }
    return (
      <div className="mc-json-row">
        {keyLabel}
        <span className={cls}>{text}</span>
        {comma}
      </div>
    )
  }

  const isArr = Array.isArray(value)
  const entries: Array<[string | number, any]> = isArr
    ? (value as any[]).map((v, i) => [i, v])
    : Object.entries(value)
  const openB = isArr ? '[' : '{'
  const closeB = isArr ? ']' : '}'

  if (entries.length === 0) {
    return (
      <div className="mc-json-row">
        {keyLabel}
        <span className="mc-json-bracket">{openB}{closeB}</span>
        {comma}
      </div>
    )
  }

  return (
    <div className="mc-json-node">
      <div className="mc-json-row">
        <button className="mc-json-toggle" onClick={() => setOpen((o) => !o)} title="Expand/collapse">
          {open ? '−' : '+'}
        </button>
        {keyLabel}
        <span className="mc-json-bracket">{openB}</span>
        {!open && <span className="mc-json-preview">{entries.length} {isArr ? (entries.length === 1 ? 'item' : 'items') : (entries.length === 1 ? 'key' : 'keys')}</span>}
        {!open && <span className="mc-json-bracket">{closeB}{comma}</span>}
      </div>
      {open && (
        <div className="mc-json-children">
          {entries.map(([ek, ev], i) => (
            <JsonTree key={ek} value={ev} k={ek} last={i === entries.length - 1} />
          ))}
        </div>
      )}
      {open && (
        <div className="mc-json-row">
          <span className="mc-json-bracket">{closeB}</span>
          {comma}
        </div>
      )}
    </div>
  )
}

export function MockupCanvas() {
  const [initial] = useState(loadInitial) // read localStorage once
  const [doc, setDoc] = useState<MockupDoc>(initial.doc)
  const [loadError, setLoadError] = useState(initial.error)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addType, setAddType] = useState<RegionType>('content')
  const [revealed, setRevealed] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = doc.regions.find((r) => r.id === selectedId) ?? null
  const deliverable = useMemo(() => toDeliverable(doc), [doc])

  // B1D readiness lint — mirrors the lesson's acceptance rubric (≥3 regions; ≥3 states used
  // including at least one error/empty; data elements present). Shown emerging/working/strong.
  const lint = useMemo(() => {
    const states = new Set<StateTag>()
    let dataElements = 0
    for (const r of doc.regions) {
      for (const c of r.components) {
        c.states.forEach((s) => states.add(s))
        dataElements += c.dataElements.length
      }
    }
    const hasErrorOrEmpty = states.has('error') || states.has('empty')
    const rules = [
      { key: 'regions', label: 'At least 3 regions', pass: doc.regions.length >= 3, detail: `${doc.regions.length} / 3` },
      {
        key: 'states',
        label: '≥3 states, incl. one error/empty',
        pass: states.size >= 3 && hasErrorOrEmpty,
        detail: `${states.size} used${hasErrorOrEmpty ? ' · error/empty ✓' : ' · no error/empty'}`,
      },
      { key: 'data', label: 'Data elements present', pass: dataElements > 0, detail: `${dataElements} element${dataElements === 1 ? '' : 's'}` },
    ]
    const passed = rules.filter((r) => r.pass).length
    const level: 'emerging' | 'working' | 'strong' = passed === 3 ? 'strong' : passed === 2 ? 'working' : 'emerging'
    return { rules, level, passed }
  }, [doc])

  // Debounced single-slot autosave (SpecAuthor pattern).
  const commit = useCallback((next: MockupDoc) => {
    setDoc(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setSavedAt(new Date().toLocaleTimeString())
      } catch {
        // storage unavailable — editing still works, just no autosave
      }
    }, 500)
  }, [])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const occupied = useMemo(() => {
    const m = new Map<string, Region>()
    for (const r of doc.regions) m.set(`${r.col},${r.row}`, r)
    return m
  }, [doc.regions])

  function firstFreeCell(): { col: number; row: number } | null {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupied.has(`${col},${row}`)) return { col, row }
      }
    }
    return null
  }

  function addRegion(type: RegionType, at?: { col: number; row: number }) {
    const cell = at ?? firstFreeCell()
    if (!cell) return // grid full
    const id = uid('r')
    const region: Region = { id, name: type, type, col: cell.col, row: cell.row, components: [] }
    commit({ ...doc, regions: [...doc.regions, region] })
    setSelectedId(id)
    setRevealed(false)
  }

  function updateRegion(id: string, patch: Partial<Region>) {
    commit({ ...doc, regions: doc.regions.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  }

  function removeRegion(id: string) {
    commit({ ...doc, regions: doc.regions.filter((r) => r.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }

  // Arrow-key nudge — move the selected region one grid cell (swap if the target is occupied).
  function nudge(dCol: number, dRow: number) {
    if (!selected) return
    const col = Math.max(0, Math.min(GRID_COLS - 1, selected.col + dCol))
    const row = Math.max(0, Math.min(GRID_ROWS - 1, selected.row + dRow))
    if (col === selected.col && row === selected.row) return
    const other = occupied.get(`${col},${row}`)
    commit({
      ...doc,
      regions: doc.regions.map((r) => {
        if (r.id === selected.id) return { ...r, col, row }
        if (other && r.id === other.id) return { ...r, col: selected.col, row: selected.row }
        return r
      }),
    })
  }

  // Component editing (nested immutably under the selected region).
  function mutateComponents(regionId: string, fn: (list: MockComponent[]) => MockComponent[]) {
    updateRegion(regionId, { components: fn(doc.regions.find((r) => r.id === regionId)?.components ?? []) })
  }
  function addComponent(regionId: string) {
    mutateComponents(regionId, (list) => [...list, { id: uid('c'), name: 'Component', dataElements: [], states: [] }])
  }
  function updateComponent(regionId: string, compId: string, patch: Partial<MockComponent>) {
    mutateComponents(regionId, (list) => list.map((c) => (c.id === compId ? { ...c, ...patch } : c)))
  }
  function removeComponent(regionId: string, compId: string) {
    mutateComponents(regionId, (list) => list.filter((c) => c.id !== compId))
  }

  function downloadJson() {
    download(`${slugify(doc.screen, 'mockup')}.json`, JSON.stringify(deliverable, null, 2), 'application/json;charset=utf-8')
  }

  function downloadHtml() {
    download(`ui-layout-${slugify(doc.screen, 'screen')}.html`, toHtml(doc), 'text/html;charset=utf-8')
  }

  // Global arrow-key nudge — only when a region is selected and focus isn't in a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (!selectedId) return
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      }
      if (e.key in map) { e.preventDefault(); nudge(map[e.key][0], map[e.key][1]) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); removeRegion(selectedId) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, doc])

  return (
    <div className="mc-shell">
      <style>{MC_CSS}</style>

      {/* Header bar */}
      <div className="mc-topbar">
        <Link to="/" className="mc-btn" style={{ textDecoration: 'none' }} title="Back to StructureView">
          ← StructureView
        </Link>
        <strong style={{ fontSize: 14 }}>Mockup Canvas</strong>
        <input
          className="mc-screen-input"
          value={doc.screen}
          onChange={(e) => commit({ ...doc, screen: e.target.value })}
          placeholder="screen name (e.g. invoice-list)"
          spellCheck={false}
        />
        <span className="mc-saved">{savedAt ? `Auto-saved · ${savedAt}` : 'Auto-saves to this device'}</span>
        <button className={`mc-btn ${revealed ? 'mc-btn-primary' : ''}`} onClick={() => setRevealed((v) => !v)} style={{ marginLeft: 'auto' }}>
          {revealed ? 'Back to canvas' : 'Reveal JSON'}
        </button>
        <button className="mc-btn" onClick={downloadJson} title="Download the B1D deliverable JSON">
          Download .json
        </button>
        <button className="mc-btn" onClick={downloadHtml} title="Download the B1D skeleton ui-layout-[screen].html">
          Download .html
        </button>
      </div>

      <div className="mc-body">
        {/* LEFT: palette + region list */}
        <div className="mc-rail">
          <div className="mc-rail-title">Add region</div>
          <div className="mc-type-grid">
            {REGION_TYPES.map((t) => (
              <button
                key={t}
                className={`mc-type-btn ${addType === t ? 'active' : ''}`}
                style={{ borderColor: addType === t ? TYPE_COLOR[t] : undefined }}
                onClick={() => { setAddType(t); addRegion(t) }}
                title={`Add a ${t} region`}
              >
                <span className="mc-type-dot" style={{ background: TYPE_COLOR[t] }} />
                {t}
              </button>
            ))}
          </div>
          <div className="mc-hint">Click a type to drop a box, or click an empty cell on the grid. Select a box and use arrow keys to nudge; Delete removes it.</div>

          <div className="mc-rail-title" style={{ marginTop: 16 }}>Regions ({doc.regions.length})</div>
          {doc.regions.length === 0 && <div className="mc-empty-rail">No regions yet.</div>}
          {doc.regions.map((r) => (
            <div
              key={r.id}
              className={`mc-region-row ${selectedId === r.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(r.id); setRevealed(false) }}
            >
              <span className="mc-type-dot" style={{ background: TYPE_COLOR[r.type] }} />
              <span className="mc-region-row-name">{r.name || r.type}</span>
              <span className="mc-region-row-meta">{r.components.length}c</span>
            </div>
          ))}
        </div>

        {/* CENTER: the grid canvas */}
        <div className="mc-canvas-wrap">
          {loadError && (
            <div className="mc-error-banner">
              <span>Couldn’t read your last saved draft — it may have been corrupted. Starting with a fresh canvas.</span>
              <button className="mc-mini-btn" onClick={() => setLoadError(false)}>Dismiss</button>
            </div>
          )}
          {doc.regions.length === 0 && (
            <div className="mc-canvas-empty">
              <div className="mc-canvas-empty-title">Draw your screen</div>
              <div className="mc-canvas-empty-sub">Pick a region type on the left, or click an empty cell below, to add your first box.</div>
            </div>
          )}
          <div className="mc-grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}>
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
              const col = i % GRID_COLS
              const row = Math.floor(i / GRID_COLS)
              const region = occupied.get(`${col},${row}`)
              if (region) {
                return (
                  <button
                    key={i}
                    className={`mc-box ${selectedId === region.id ? 'selected' : ''}`}
                    style={{ gridColumn: col + 1, gridRow: row + 1, borderColor: TYPE_COLOR[region.type] }}
                    onClick={() => { setSelectedId(region.id); setRevealed(false) }}
                  >
                    <span className="mc-box-type" style={{ color: TYPE_COLOR[region.type] }}>{region.type}</span>
                    <span className="mc-box-name">{region.name || region.type}</span>
                    <span className="mc-box-count">{region.components.length} component{region.components.length === 1 ? '' : 's'}</span>
                  </button>
                )
              }
              return (
                <button
                  key={i}
                  className="mc-cell"
                  style={{ gridColumn: col + 1, gridRow: row + 1 }}
                  onClick={() => addRegion(addType, { col, row })}
                  title={`Add a ${addType} region here`}
                  aria-label={`Add ${addType} region at column ${col + 1}, row ${row + 1}`}
                >
                  +
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT: B1D lint (always visible) + inspector — or, on Reveal, the JSON tree */}
        <div className="mc-pane">
          <div className="mc-lint">
            <div className="mc-lint-hd">
              <span className="mc-pane-title" style={{ margin: 0 }}>B1D readiness</span>
              <span className={`mc-level mc-level-${lint.level}`}>{lint.level}</span>
            </div>
            {lint.rules.map((r) => (
              <div key={r.key} className="mc-lint-row">
                <span className={`mc-lint-mark ${r.pass ? 'ok' : ''}`}>{r.pass ? '✓' : '○'}</span>
                <span className="mc-lint-label">{r.label}</span>
                <span className="mc-lint-detail">{r.detail}</span>
              </div>
            ))}
          </div>

          {revealed ? (
            <div className="mc-reveal">
              <div className="mc-pane-title">Deliverable JSON</div>
              <div className="mc-json-scroll">
                <div className="mc-json-root">
                  <JsonTree value={deliverable} last />
                </div>
              </div>
              <div className="mc-caption">a more precise version of what you already drew.</div>
            </div>
          ) : selected ? (
            <div className="mc-inspector">
              <div className="mc-pane-title">Region</div>
              <label className="mc-field-label">Name</label>
              <input
                className="mc-input"
                value={selected.name}
                onChange={(e) => updateRegion(selected.id, { name: e.target.value })}
                placeholder="region name"
                spellCheck={false}
              />
              <label className="mc-field-label">Type</label>
              <div className="mc-seg">
                {REGION_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`mc-seg-btn ${selected.type === t ? 'active' : ''}`}
                    style={{ borderColor: selected.type === t ? TYPE_COLOR[t] : undefined }}
                    onClick={() => updateRegion(selected.id, { type: t })}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mc-field-label" style={{ display: 'flex', alignItems: 'center' }}>
                Components ({selected.components.length})
                <button className="mc-mini-btn" style={{ marginLeft: 'auto' }} onClick={() => addComponent(selected.id)}>+ add</button>
              </div>
              {selected.components.length === 0 && <div className="mc-empty-rail">No components. Add one to hang data + states off this region.</div>}
              {selected.components.map((c) => (
                <ComponentEditor
                  key={c.id}
                  comp={c}
                  onName={(name) => updateComponent(selected.id, c.id, { name })}
                  onData={(dataElements) => updateComponent(selected.id, c.id, { dataElements })}
                  onStates={(states) => updateComponent(selected.id, c.id, { states })}
                  onRemove={() => removeComponent(selected.id, c.id)}
                />
              ))}

              <button className="mc-btn mc-btn-danger" style={{ marginTop: 14 }} onClick={() => removeRegion(selected.id)}>
                Delete region
              </button>
            </div>
          ) : (
            <div className="mc-inspector">
              <div className="mc-pane-title">Inspector</div>
              <div className="mc-empty-rail">Select a region to edit its name, type, and components — or hit “Reveal JSON” to see the structure you’ve drawn.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Component row editor — data-element chips + state tags ───────────────────────────────────
function ComponentEditor({
  comp, onName, onData, onStates, onRemove,
}: {
  comp: MockComponent
  onName: (v: string) => void
  onData: (v: string[]) => void
  onStates: (v: StateTag[]) => void
  onRemove: () => void
}) {
  const [chip, setChip] = useState('')

  function addChip() {
    const v = chip.trim()
    if (!v || comp.dataElements.includes(v)) { setChip(''); return }
    onData([...comp.dataElements, v])
    setChip('')
  }
  function toggleState(s: StateTag) {
    onStates(comp.states.includes(s) ? comp.states.filter((x) => x !== s) : [...comp.states, s])
  }

  return (
    <div className="mc-comp">
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="mc-input"
          value={comp.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="ComponentName"
          spellCheck={false}
        />
        <button className="mc-mini-btn danger" onClick={onRemove} title="Remove component">×</button>
      </div>

      <div className="mc-chip-row">
        {comp.dataElements.map((d) => (
          <span key={d} className="mc-chip">
            {d}
            <button className="mc-chip-x" onClick={() => onData(comp.dataElements.filter((x) => x !== d))} aria-label={`Remove ${d}`}>×</button>
          </span>
        ))}
        <input
          className="mc-chip-input"
          value={chip}
          onChange={(e) => setChip(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip() } }}
          onBlur={addChip}
          placeholder="+ data element (e.g. customer.name)"
          spellCheck={false}
        />
      </div>

      <div className="mc-state-row">
        {STATE_TAGS.map((s) => (
          <button
            key={s}
            className={`mc-state ${comp.states.includes(s) ? 'on' : ''} mc-state-${s}`}
            onClick={() => toggleState(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// Styles are scoped with the mc- prefix and use the ui/ design tokens.
const MC_CSS = `
.mc-shell { display:flex; flex-direction:column; height:100vh; background:var(--bg); color:var(--tx); font-family:var(--ff-display); }
.mc-topbar { display:flex; align-items:center; gap:12px; padding:10px 18px; border-bottom:1px solid var(--bd); flex-shrink:0; }
.mc-screen-input { width:220px; padding:5px 10px; background:var(--sf2); border:1px solid var(--bd); border-radius:var(--r-sm); color:var(--tx); font-size:12px; outline:none; font-family:var(--ff-mono); }
.mc-saved { font-size:11px; color:var(--txm); }
.mc-btn { font-size:12px; padding:5px 11px; border-radius:var(--r-sm); border:1px solid var(--bd); background:var(--sf2); color:var(--tx); cursor:pointer; }
.mc-btn:hover { border-color:var(--ft-blue); }
.mc-btn-primary { background:var(--ft-blue); color:#fff; border-color:var(--ft-blue); }
.mc-btn-danger:hover { border-color:var(--err); color:var(--err); }
.mc-body { display:flex; flex:1; min-height:0; }
.mc-rail { width:230px; border-right:1px solid var(--bd); padding:14px; overflow:auto; flex-shrink:0; }
.mc-pane { width:360px; border-left:1px solid var(--bd); padding:14px; overflow:auto; flex-shrink:0; }
.mc-rail-title { font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; color:var(--txf,var(--txm)); font-weight:600; margin-bottom:8px; }
.mc-type-grid { display:flex; flex-direction:column; gap:6px; }
.mc-type-btn { display:flex; align-items:center; gap:8px; padding:6px 9px; border:1px solid var(--bd); border-radius:var(--r-sm); background:var(--sf2); color:var(--tx); cursor:pointer; font-size:12px; text-transform:capitalize; }
.mc-type-btn.active { background:var(--sf); }
.mc-type-dot { width:9px; height:9px; border-radius:2px; flex-shrink:0; }
.mc-hint { font-size:10.5px; color:var(--txm); line-height:1.5; margin-top:10px; }
.mc-region-row { display:flex; align-items:center; gap:8px; padding:5px 7px; border-radius:var(--r-sm); cursor:pointer; font-size:12px; }
.mc-region-row:hover { background:var(--sf2); }
.mc-region-row.active { background:var(--sf2); outline:1px solid var(--ft-blue); }
.mc-region-row-name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-transform:capitalize; }
.mc-region-row-meta { font-size:10px; color:var(--txm); }
.mc-empty-rail { font-size:11px; color:var(--txm); line-height:1.5; padding:6px 0; }
.mc-canvas-wrap { flex:1; min-width:0; position:relative; padding:20px; overflow:auto; }
.mc-canvas-empty { position:absolute; inset:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; z-index:1; }
.mc-canvas-empty-title { font-size:18px; font-weight:800; color:var(--ft-blue); }
.mc-canvas-empty-sub { font-size:12px; color:var(--txm); margin-top:6px; max-width:320px; }
.mc-grid { display:grid; gap:10px; width:100%; height:100%; min-height:460px; }
.mc-cell { border:1.5px dashed var(--bd); border-radius:var(--r-md); background:transparent; color:var(--txm); font-size:18px; cursor:pointer; opacity:.5; }
.mc-cell:hover { opacity:1; border-color:var(--ft-blue); color:var(--ft-blue); }
.mc-box { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:3px; border:2px solid; border-radius:var(--r-md); background:var(--sf2); padding:10px 12px; cursor:pointer; text-align:left; overflow:hidden; }
.mc-box.selected { box-shadow:0 0 0 2px var(--ft-blue); }
.mc-box-type { font-size:10px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; }
.mc-box-name { font-size:13px; font-weight:600; color:var(--tx); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
.mc-box-count { font-size:10.5px; color:var(--txm); }
.mc-pane-title { font-size:10.5px; text-transform:uppercase; letter-spacing:.06em; color:var(--txm); font-weight:600; margin-bottom:10px; }
.mc-field-label { display:block; font-size:11px; color:var(--txm); margin:12px 0 5px; }
.mc-input { width:100%; padding:6px 9px; background:var(--sf2); border:1px solid var(--bd); border-radius:var(--r-sm); color:var(--tx); font-size:12px; outline:none; }
.mc-input:focus { border-color:var(--ft-blue); }
.mc-seg { display:flex; flex-wrap:wrap; gap:4px; }
.mc-seg-btn { padding:4px 8px; border:1px solid var(--bd); border-radius:var(--r-sm); background:var(--sf2); color:var(--tx); font-size:11px; cursor:pointer; text-transform:capitalize; }
.mc-seg-btn.active { background:var(--sf); }
.mc-mini-btn { padding:2px 8px; border:1px solid var(--bd); border-radius:var(--r-sm); background:var(--sf2); color:var(--tx); font-size:11px; cursor:pointer; }
.mc-mini-btn.danger:hover { border-color:var(--err); color:var(--err); }
.mc-comp { border:1px solid var(--bd); border-radius:var(--r-md); padding:9px; margin-top:8px; background:var(--sf); }
.mc-chip-row { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
.mc-chip { display:inline-flex; align-items:center; gap:4px; background:var(--sf2); border:1px solid var(--bd); border-radius:999px; padding:2px 4px 2px 9px; font-size:11px; font-family:var(--ff-mono); }
.mc-chip-x { background:none; border:none; color:var(--txm); cursor:pointer; font-size:13px; line-height:1; padding:0 2px; }
.mc-chip-x:hover { color:var(--err); }
.mc-chip-input { flex:1; min-width:120px; background:transparent; border:none; color:var(--tx); font-size:11px; outline:none; font-family:var(--ff-mono); }
.mc-state-row { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
.mc-state { padding:3px 7px; border:1px solid var(--bd); border-radius:var(--r-sm); background:transparent; color:var(--txm); font-size:10.5px; cursor:pointer; text-transform:capitalize; }
.mc-state.on { color:var(--tx); background:var(--sf2); border-color:var(--tx); }
.mc-state.on.mc-state-error { border-color:var(--err); color:var(--err); }
.mc-state.on.mc-state-empty { border-color:var(--warn); color:var(--warn); }
.mc-state.on.mc-state-populated { border-color:var(--ok); color:var(--ok); }
.mc-btn-danger { width:100%; justify-content:center; }
.mc-reveal { display:flex; flex-direction:column; height:100%; }
.mc-json-scroll { flex:1; overflow:auto; border:1px solid var(--bd); border-radius:var(--r-md); padding:10px 12px; background:var(--sf); }
.mc-json-root { font-family:var(--ff-mono); font-size:12.5px; line-height:1.7; }
.mc-caption { margin-top:10px; font-style:italic; color:var(--txm); font-size:12.5px; text-align:center; }
.mc-json-node { display:block; }
.mc-json-row { display:flex; align-items:flex-start; flex-wrap:wrap; }
.mc-json-children { padding-left:18px; border-left:1px solid var(--bd); margin-left:6px; }
.mc-json-toggle { width:14px; height:14px; margin-right:5px; border:1px solid var(--bd); border-radius:3px; background:none; color:var(--txm); font-size:9px; line-height:1; cursor:pointer; flex-shrink:0; }
.mc-json-key { color:var(--ft-blue); }
.mc-json-colon { color:var(--txm); margin:0 4px; }
.mc-json-string { color:var(--ok); }
.mc-json-number { color:var(--warn); }
.mc-json-boolean { color:#a855f7; }
.mc-json-null { color:var(--txm); font-style:italic; }
.mc-json-bracket { color:var(--txm); }
.mc-json-preview { color:var(--txm); font-style:italic; font-size:.9em; margin:0 5px; }
.mc-json-index { color:var(--txm); min-width:22px; margin-right:6px; font-size:.9em; text-align:right; }
.mc-json-comma { color:var(--txm); }
.mc-lint { border:1px solid var(--bd); border-radius:var(--r-md); padding:10px 12px; margin-bottom:14px; background:var(--sf); }
.mc-lint-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.mc-level { font-size:10px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; padding:2px 8px; border-radius:999px; border:1px solid; }
.mc-level-emerging { color:var(--err); border-color:var(--err); }
.mc-level-working { color:var(--warn); border-color:var(--warn); }
.mc-level-strong { color:var(--ok); border-color:var(--ok); }
.mc-lint-row { display:flex; align-items:center; gap:8px; font-size:11.5px; padding:3px 0; }
.mc-lint-mark { width:14px; text-align:center; color:var(--txm); flex-shrink:0; }
.mc-lint-mark.ok { color:var(--ok); }
.mc-lint-label { flex:1; min-width:0; }
.mc-lint-detail { color:var(--txm); font-size:10.5px; white-space:nowrap; }
.mc-error-banner { display:flex; align-items:center; gap:10px; background:rgba(248,113,113,.08); border:1px solid var(--err); border-radius:var(--r-md); padding:8px 12px; margin-bottom:12px; font-size:12px; color:var(--tx); position:relative; z-index:2; }
.mc-error-banner span { flex:1; }
`
