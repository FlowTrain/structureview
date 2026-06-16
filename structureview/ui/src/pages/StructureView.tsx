import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { analyse } from '@timc/engine.js'
import { SAMPLES } from '../timc-samples.js'

// Score helpers driven by the real TIMC Light engine output.
function statusFor(score: number): 'pass' | 'warn' | 'fail' {
  return score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail'
}

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

// Build a document record from raw content, analysed live by the engine.
function makeDoc(opts: { id: string; name: string; icon: string; content: string; hint: string; size?: string }) {
  const result = analyse(opts.content, opts.hint)
  const score = Math.round(result.aggregateScore)
  return {
    id: opts.id,
    name: opts.name,
    icon: opts.icon,
    // Number of quality findings (uncovered requirements / structural issues) the engine raised.
    issues: result.signals[0]?.findings.length ?? 0,
    size: opts.size ?? '—',
    content: opts.content,
    hint: opts.hint,
    score,
    status: statusFor(score),
    result,
  }
}

// Spec-driven development help. Documents in the wild vary wildly, so the panel always
// offers a way to learn the notation and grab the spec template.
const SPEC_ARTICLE_URL =
  'https://www.jamasoftware.com/requirements-management-guide/writing-requirements/adopting-the-ears-notation-to-improve-requirements-engineering/'

function openExternal(url: string) {
  const sv = (window as any).structview
  if (sv && typeof sv.openExternal === 'function') sv.openExternal(url)
  else window.open(url, '_blank', 'noreferrer')
}

// Download the spec-instructions template bundled with the app (ui/public/spec-instructions.md).
async function downloadSpecInstructions() {
  try {
    const res = await fetch('spec-instructions.md')
    const text = await res.text()
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spec-instructions.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    window.open('spec-instructions.md', '_blank')
  }
}

// Bundled sample documents — shown on launch so the panel is populated before the user
// opens anything. Each is analysed live by the engine (no hardcoded scores).
const SAMPLE_DOCS = [
  { id: 'prd', name: 'PRD-2024-v2.4.md', icon: '📋', size: '2.1 KB' },
  { id: 'arch', name: 'ARCH-SYS-001.md', icon: '🏗', size: '1.4 KB' },
  { id: 'security', name: 'SECURITY-SPEC.md', icon: '🔒', size: '0.9 KB' },
  { id: 'testplan', name: 'TEST-PLAN-Q4.md', icon: '✅', size: '3.2 KB' },
  { id: 'api', name: 'API-GATEWAY.json', icon: '⚡', size: '1.8 KB' },
].map((d) => {
  const sample = SAMPLES[d.id as keyof typeof SAMPLES]
  return makeDoc({ id: d.id, name: d.name, icon: d.icon, content: sample.content, hint: sample.hint, size: d.size })
})

// EARS keywords highlighted in the signal text (matched by content, since the segment
// arrays don't place keywords at a consistent index).
const EARS_KEYWORDS = new Set(['WHEN', 'WHILE', 'IF', 'WHERE', 'THEN', 'SHALL', 'THE'])

const signals = [
  { id: 1, pattern: 'WHEN-THEN', reqId: 'REQ-001', text: ['WHEN', ' user submits authentication form ', 'THEN', ' system ', 'SHALL', ' generate immutable audit log entry'], meta: 'Pattern matched · Verb: SHALL · Quantified', score: 96, status: 'pass' },
  { id: 2, pattern: 'UBIQUITOUS', reqId: 'REQ-002', text: ['The system ', 'SHALL', ' maintain 99.9% uptime SLA across all production regions'], meta: 'Pattern matched · Measurable threshold · SLA', score: 89, status: 'pass' },
  { id: 3, pattern: 'WHERE', reqId: 'REQ-011', text: ['WHERE', ' failure threshold exceeds 5% ', 'THE', ' system ', 'SHALL', ' alert the operations team within 30 seconds'], meta: 'Pattern matched · Threshold: 5% · Timeout: 30s', score: 91, status: 'pass' },
  { id: 4, pattern: 'WHILE', reqId: 'REQ-015', text: ['WHILE', ' system is in maintenance mode ', 'THE', ' system ', 'SHALL', ' queue all incoming requests'], meta: 'Pattern matched · State-based · Queueing', score: 87, status: 'pass' },
  { id: 5, pattern: 'IF-THEN', reqId: 'REQ-023', text: ['IF', ' API rate limit exceeded ', 'THEN', ' system ', 'SHALL', ' return 429 status with retry-after header'], meta: 'Pattern matched · HTTP semantics · RFC compliant', score: 94, status: 'pass' },
  { id: 6, pattern: 'COMPLEX', reqId: 'REQ-041', text: ['System should handle errors gracefully and inform users appropriately'], meta: 'Ambiguous · No pattern match · Missing quantifiers', score: 52, status: 'fail' },
]

export function StructureView() {
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [activeId, setActiveId] = useState(SAMPLE_DOCS[0].id)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'ears' | 'sections' | 'bdd'>('ears')
  const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0]

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    if (id === activeId) {
      const remaining = docs.filter((d) => d.id !== id)
      if (remaining.length) setActiveId(remaining[0].id)
    }
  }

  // Open a single file (File ▸ Open / Ctrl+O / drag-drop) or a whole folder (File ▸ Open
  // Folder) via the preload bridge, analyse each live, and add it to the document list.
  useEffect(() => {
    const sv = (window as any).structview
    if (!sv) return
    const toDoc = (filePath: string, ext: string, content: string, size: number) => {
      const hint = /^json$/i.test(ext) ? 'json' : 'markdown'
      return makeDoc({
        id: filePath,
        name: filePath.split(/[/\\]/).pop() || filePath,
        icon: hint === 'json' ? '⚡' : '📄',
        content,
        hint,
        size: formatSize(size),
      })
    }
    sv.onFileLoaded?.((d: { filePath: string; ext: string; content: string; size: number }) => {
      const doc = toDoc(d.filePath, d.ext, d.content, d.size)
      setDocs((prev) => [doc, ...prev.filter((x) => x.id !== doc.id)])
      setActiveId(doc.id)
    })
    sv.onFolderScanned?.(async ({ files }: { files: string[] }) => {
      const loaded = await Promise.all(
        files.slice(0, 300).map(async (fp) => {
          const ext = (fp.split('.').pop() || '').toLowerCase()
          const res = await sv.readFile(fp)
          return res?.ok ? toDoc(fp, ext, res.content, res.size) : null
        })
      )
      const valid = loaded.filter(Boolean) as ReturnType<typeof makeDoc>[]
      if (!valid.length) return
      setDocs((prev) => {
        const ids = new Set(prev.map((d) => d.id))
        return [...prev, ...valid.filter((d) => !ids.has(d.id))]
      })
      setActiveId(valid[0].id)
    })
    return () => {
      sv.removeAllListeners?.('file-loaded')
      sv.removeAllListeners?.('folder-scanned')
    }
  }, [])

  // Live TIMC Light result for the active document. For markdown the engine returns both
  // an EARS-coverage and a section-completeness signal; the panel toggles between them.
  const timc = activeDoc.result
  const earsSig = timc.signals.find((s: any) => s.type === 'ears-coverage')
  const sectionSig = timc.signals.find((s: any) => s.type === 'section-completeness')
  const bddSig = timc.signals.find((s: any) => s.type === 'bdd-coverage')
  const jsonSig = timc.signals.find((s: any) => s.type === 'json-quality')
  const hasModes = !!(earsSig && sectionSig && bddSig)
  const byMode: Record<string, any> = { ears: earsSig, sections: sectionSig, bdd: bddSig }
  const signal = jsonSig ?? byMode[mode] ?? earsSig ?? timc.signals[0]
  const composite = signal ? signal.score : timc.aggregateScore
  const compositeStatus = statusFor(composite)

  // The breakdown shown depends on which signal is in view.
  const metrics: { label: string; value: number }[] =
    signal?.type === 'json-quality'
      ? [
          { label: 'Parseability', value: Math.round(signal.breakdown.parseability) },
          { label: 'Null density', value: Math.round(signal.breakdown.nullDensity) },
          { label: 'Key consistency', value: Math.round(signal.breakdown.keyConsistency) },
          { label: 'Nesting depth', value: Math.round(signal.breakdown.nestingDepth) },
          { label: 'Envelope shape', value: Math.round(signal.breakdown.envelopeShape) },
        ]
      : signal?.type === 'section-completeness'
        ? [{ label: `Sections present (${signal.breakdown.present}/${signal.breakdown.total})`, value: Math.round(signal.score) }]
        : signal?.type === 'bdd-coverage'
          ? [{ label: `Scenarios well-formed (${signal.breakdown.wellFormed}/${signal.breakdown.scenarios})`, value: Math.round(signal.score) }]
          : [{ label: 'EARS coverage', value: Math.round(signal ? signal.score : composite) }]

  // The upgrade CTA is driven by the resolvable signal (EARS/JSON), independent of view mode.
  const ctaSignal = jsonSig ?? earsSig

  // Cross-file search: filter the document list by name or content, and count how many
  // matches are in the active doc and how many other loaded specs reference the term.
  const q = query.trim().toLowerCase()
  const countMatches = (content: string, term: string) => {
    if (!term) return 0
    const lc = content.toLowerCase()
    let n = 0
    let i = 0
    while ((i = lc.indexOf(term, i)) !== -1) {
      n++
      i += term.length
    }
    return n
  }
  const ranked = docs.map((d) => ({ doc: d, matches: q ? countMatches(d.content, q) : 0 }))
  const visible = q ? ranked.filter((r) => r.matches > 0 || r.doc.name.toLowerCase().includes(q)) : ranked
  const activeMatches = q ? countMatches(activeDoc.content, q) : 0
  const referencingCount = q ? ranked.filter((r) => r.doc.id !== activeId && r.matches > 0).length : 0

  return (
    <div className="app-shell">
      <Sidebar 
        brandTag="StructureView"
        activeNav="overview"
        sections={[
          {
            label: 'Fleet',
            items: [
              { id: 'back', label: 'Back to Roundhouse', icon: 'back', href: '/roundhouse' },
            ]
          },
          {
            label: 'StructureView',
            items: [
              { id: 'overview', label: 'Overview', icon: 'grid', active: true },
              { id: 'docs', label: 'Documents', icon: 'doc', badge: { text: '5', variant: 'blue' } },
              { id: 'ears', label: 'EARS Analysis', icon: 'signal', badge: { text: '247', variant: 'blue' } },
              { id: 'timc', label: 'TIMC Dashboard', icon: 'chart' },
              { id: 'bdd', label: 'BDD Generator', icon: 'search' },
              { id: 'reports', label: 'Reports & Export', icon: 'export' },
            ]
          },
          {
            label: 'CCQG Engine',
            items: [
              { id: 'compliance', label: 'Compliance Matrix', icon: 'shield', href: '/ccqg/compliance' },
              { id: 'cicd', label: 'CI/CD Pipeline', icon: 'export', href: '/ccqg/cicd' },
              { id: 'testplan', label: 'Test Plan', icon: 'doc', href: '/ccqg/test-plan' },
              { id: 'trading', label: 'Trading Domain', icon: 'chart', href: '/ccqg/trading-domain' },
            ]
          },
          {
            label: 'Learnings',
            items: [
              { id: 'memory', label: 'Memory Store', icon: 'book' },
              { id: 'mcp', label: 'MCP Tools', icon: 'chat' },
            ]
          }
        ]}
      />

      <div className="main-content">
        <Topbar 
          breadcrumbs={[
            { label: 'FlowTrain', href: '/' },
            { label: 'Roundhouse', href: '/roundhouse' },
            { label: 'StructureView', active: true }
          ]}
          rightContent={
            <>
              <span className="badge b-ok">
                <span className="dot dot-ok" style={{width:6,height:6,marginRight:2}}></span>
                Operational
              </span>
              <button className="btn btn-secondary btn-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Haul
              </button>
              <div className="avatar">JG</div>
            </>
          }
        />

        <main className="page-body">
          {/* Product header */}
          <div className="sv-product-hd" id="overview">
            <div>
              <div style={{fontFamily:'var(--ff-display)',fontSize:'var(--xl)',fontWeight:800,color:'var(--ft-blue)',letterSpacing:'-0.02em'}}>StructureView</div>
              <div style={{fontSize:'var(--sm)',color:'var(--txm)',marginTop:'var(--s1)'}}>Requirement quality analysis — EARS detection · TIMC scoring · BDD generation</div>
            </div>
            <div className="flex gap-3 items-center ml-auto">
              <span className="badge b-ok">SHIPPED</span>
              <span className="badge b-muted">v1.0.0</span>
              <span className="badge b-blue">EMD SD70ACe</span>
            </div>
          </div>

          {/* Three-panel grid */}
          <div className="sv-grid">
            {/* LEFT: Documents */}
            <div className="sv-panel">
              <div className="sv-panel-hd">
                <span className="sv-panel-title">Documents</span>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => (window as any).structview?.openFileDialog?.()}
                    title="Open a Markdown or JSON file (Ctrl+O)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Open file
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => (window as any).structview?.openFolderDialog?.()}
                    title="Open a folder of Markdown/JSON files (Ctrl+Shift+O)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Open folder
                  </button>
                  <span className="badge b-blue">{docs.length} files</span>
                </div>
              </div>
              <div className="sv-panel-body">
                <div className="active-doc-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Active: <strong>{activeDoc.name}</strong>
                </div>

                {/* Filter files + cross-file content/reference search */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter files or search content…"
                  spellCheck={false}
                  style={{width:'100%',padding:'var(--s2) var(--s3)',marginBottom:'var(--s2)',background:'var(--sf2)',border:'1px solid var(--bd)',borderRadius:'var(--r-md)',color:'var(--tx)',fontSize:'var(--sm)',outline:'none'}}
                />
                {q && (
                  <div className="t-xs text-muted" style={{marginBottom:'var(--s3)'}}>
                    {activeMatches} match{activeMatches === 1 ? '' : 'es'} in {activeDoc.name} · referenced in {referencingCount} other spec{referencingCount === 1 ? '' : 's'}
                  </div>
                )}
                {visible.length === 0 && (
                  <div className="t-xs text-faint" style={{padding:'var(--s3) 0'}}>No files match “{query}”</div>
                )}

                {visible.map(({ doc, matches }) => (
                  <div
                    key={doc.id}
                    className={`doc-item ${activeDoc.id === doc.id ? 'active' : ''}`}
                    onClick={() => setActiveId(doc.id)}
                    tabIndex={0}
                  >
                    <span className="doc-icon">{doc.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-meta">{doc.issues} issues · {doc.size}</div>
                    </div>
                    {q && matches > 0 && (
                      <span className="badge b-blue" style={{fontSize:10}} title={`${matches} content match${matches === 1 ? '' : 'es'}`}>
                        {matches}
                      </span>
                    )}
                    <span className={`score-pill sp-${doc.status === 'pass' ? 'ok' : doc.status === 'warn' ? 'warn' : 'err'}`}>
                      {doc.score}
                    </span>
                    <button
                      type="button"
                      title="Remove from list"
                      aria-label={`Remove ${doc.name}`}
                      onClick={(e) => { e.stopPropagation(); removeDoc(doc.id) }}
                      style={{background:'none',border:'none',color:'var(--txf)',cursor:'pointer',padding:'0 4px',fontSize:14,lineHeight:1}}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="divider"></div>

                {/* Corpus stats */}
                <div className="card-sm" style={{background:'var(--sf2)',borderRadius:'var(--r-md)',marginTop:'var(--s2)'}}>
                  <div className="flex-between mb-3">
                    <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>Corpus</span>
                    <span className="t-xs text-faint">5 files</span>
                  </div>
                  <div className="timc-row">
                    <div className="timc-lbl">Total requirements</div>
                    <div className="timc-val">184</div>
                  </div>
                  <div className="timc-row">
                    <div className="timc-lbl">PASS ({'>'}80)</div>
                    <div className="timc-val text-ok">3</div>
                  </div>
                  <div className="timc-row">
                    <div className="timc-lbl">WARN (60–80)</div>
                    <div className="timc-val text-warn">1</div>
                  </div>
                  <div className="timc-row">
                    <div className="timc-lbl">FAIL ({'<'}60)</div>
                    <div className="timc-val text-err">1</div>
                  </div>
                </div>

                <button className="btn btn-secondary w-full mt-4" style={{justifyContent:'center'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Document
                </button>
              </div>
            </div>

            {/* CENTER: EARS Signal Analysis */}
            <div className="sv-panel">
              <div className="sv-panel-hd">
                <span className="sv-panel-title">EARS Signal Analysis</span>
                <div className="flex gap-2">
                  <span className="badge b-ok">5 patterns</span>
                  <span className="badge b-blue">247 reqs</span>
                </div>
              </div>
              <div className="sv-panel-body">
                <div style={{marginBottom:'var(--s5)'}}>
                  <div style={{fontSize:'var(--xs)',color:'var(--txf)',textTransform:'uppercase',letterSpacing:'.07em',fontWeight:600,marginBottom:'var(--s3)'}}>
                    Analyzing: {activeDoc.name}
                  </div>
                </div>

                {signals.map((sig) => (
                  <div key={sig.id} className={`signal-item sig-${sig.status}`}>
                    <div className="sig-body">
                      <div className="sig-pattern">
                        <span className={`badge ${sig.status === 'pass' ? 'b-ok' : sig.status === 'warn' ? 'b-warn' : 'b-err'}`} style={{fontSize:10}}>
                          {sig.pattern}
                        </span>
                        &nbsp;{sig.reqId}
                      </div>
                      <div className="sig-text">
                        {sig.text.map((part, idx) => 
                          EARS_KEYWORDS.has(part.trim().toUpperCase()) ? (
                            <span key={idx} className="sig-kw">{part}</span>
                          ) : (
                            <span key={idx}>{part}</span>
                          )
                        )}
                      </div>
                      <div className="sig-meta">
                        <span className={`dot dot-${sig.status === 'pass' ? 'ok' : sig.status === 'warn' ? 'warn' : 'err'}`} style={{width:6,height:6}}></span>
                        {sig.meta}
                      </div>
                    </div>
                    <span className={`sig-score ${sig.status}`}>{sig.score}</span>
                  </div>
                ))}

                {/* Pattern summary */}
                <div className="card-sm" style={{background:'var(--sf2)',borderRadius:'var(--r-md)',marginTop:'var(--s5)'}}>
                  <div className="flex-between mb-3">
                    <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>Pattern Coverage</span>
                    <span className="t-xs text-faint">47 requirements</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="dot dot-ok"></span>
                      <span className="t-sm">38 PASS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="dot dot-warn"></span>
                      <span className="t-sm">6 WARN</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="dot dot-err"></span>
                      <span className="t-sm">3 FAIL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: TIMC Panel — driven live by the TIMC Light engine */}
            <div className="sv-panel">
              <div className="sv-panel-hd">
                <span className="sv-panel-title">TIMC Light</span>
                <span className={`badge ${compositeStatus === 'pass' ? 'b-ok' : compositeStatus === 'warn' ? 'b-warn' : 'b-err'}`}>
                  {composite.toFixed(1)}%
                </span>
              </div>
              <div className="sv-panel-body">
                {/* Analysis mode toggle — markdown specs carry both EARS and Section signals */}
                {hasModes && (
                  <div className="flex gap-2" style={{marginBottom:'var(--s4)'}}>
                    {(['ears', 'sections', 'bdd'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{flex:1,justifyContent:'center'}}
                      >
                        {m === 'ears' ? 'EARS' : m === 'sections' ? 'Sections' : 'BDD'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Composite score */}
                <div className="timc-composite">
                  <div style={{fontSize:'var(--xs)',color:'var(--txf)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'var(--s2)'}}>
                    Composite Score
                  </div>
                  <div style={{fontFamily:'var(--ff-display)',fontSize:'var(--2xl)',fontWeight:800,color:'var(--ft-gold)'}}>
                    {composite.toFixed(1)}
                  </div>
                  <div className="t-xs text-muted mt-2">
                    {signal ? `${signal.type} · ${timc.documentType}` : 'No signals'}
                  </div>
                </div>

                {/* Live breakdown */}
                <div className="timc-compact" style={{marginTop:'var(--s5)'}}>
                  {metrics.map((m) => (
                    <TIMCItem key={m.label} label={m.label} value={m.value} />
                  ))}
                </div>

                {/* Findings */}
                {signal && signal.findings.length > 0 && (
                  <div className="timc-compact" style={{marginTop:'var(--s4)'}}>
                    {signal.findings.slice(0, 4).map((f, i) => (
                      <div key={i} className="t-xs text-muted" style={{padding:'var(--s1) 0'}}>
                        <span className={`dot dot-${f.severity === 'error' ? 'err' : f.severity === 'warning' ? 'warn' : 'ok'}`} style={{width:6,height:6,marginRight:6,display:'inline-block'}}></span>
                        {f.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upgrade CTA — driven by the resolvable signal, independent of view mode */}
                {timc.shouldShowCTA && ctaSignal && (
                  <div className="upgrade-cta">
                    <div style={{fontWeight:600,fontSize:'var(--sm)',color:'var(--tx)',marginBottom:'var(--s2)'}}>
                      Upgrade to Quality Guardian
                    </div>
                    <div className="t-xs text-muted mb-3">
                      {ctaSignal.type === 'ears-coverage'
                        ? `Quality Guardian found ${ctaSignal.findings.length} requirement${ctaSignal.findings.length === 1 ? '' : 's'} not in EARS format in this document. It can rewrite them and track coverage across your entire project.`
                        : `This response has a structural quality score of ${Math.round(ctaSignal.score)}/100. Quality Guardian audits response schemas against your OpenAPI spec.`}
                    </div>
                    <Link to="/quality-guardian" className="btn btn-secondary btn-sm w-full" style={{justifyContent:'center'}}>
                      Preview Quality Guardian
                    </Link>
                  </div>
                )}

                {/* Spec-driven development help — always available, for the messy real world */}
                <div className="divider" style={{marginTop:'var(--s4)'}}></div>
                <div style={{fontSize:'var(--xs)',color:'var(--txf)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'var(--s2)'}}>
                  Write better requirements
                </div>
                <div className="flex" style={{flexDirection:'column',gap:'var(--s2)'}}>
                  <a
                    href={SPEC_ARTICLE_URL}
                    onClick={(e) => { e.preventDefault(); openExternal(SPEC_ARTICLE_URL) }}
                    className="t-xs"
                    style={{color:'var(--ft-blue)',textDecoration:'none'}}
                  >
                    → Spec-driven development with EARS notation
                  </a>
                  <button
                    type="button"
                    onClick={downloadSpecInstructions}
                    className="t-xs"
                    style={{background:'none',border:'none',padding:0,color:'var(--ft-blue)',cursor:'pointer',textAlign:'left'}}
                  >
                    ↓ Download spec instructions template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function TIMCItem({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => v >= 90 ? 'var(--ok)' : v >= 80 ? 'var(--ft-blue)' : v >= 70 ? 'var(--warn)' : 'var(--err)'
  
  return (
    <div className="timc-item">
      <div className="timc-item-hd">
        <span className="timc-item-name">{label}</span>
        <span className="timc-item-val" style={{color: getColor(value)}}>{value}%</span>
      </div>
      <div className="hbar" style={{height:4}}>
        <div className="hbar-fill" style={{width:`${value}%`,background:getColor(value)}}></div>
      </div>
    </div>
  )
}
