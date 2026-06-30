import { useState, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import { Link } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { analyse } from '@timc/engine.js'
import { generateBdd } from '@timc/bdd-generator.js'
import { SAMPLES } from '../timc-samples.js'

// Score helpers driven by the real TIMC Light engine output.
function statusFor(score: number): 'pass' | 'warn' | 'fail' {
  return score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail'
}

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Syntax-highlight fenced code blocks in the rendered document (highlight.js).
const docRenderer = new marked.Renderer()
docRenderer.code = (code: string, lang?: string) => {
  const language = lang && hljs.getLanguage(lang) ? lang : null
  let body: string
  try {
    body = language ? hljs.highlight(code, { language }).value : hljs.highlightAuto(code).value
  } catch {
    body = escapeHtml(code)
  }
  return `<pre><code class="hljs">${body}</code></pre>`
}
marked.use({ renderer: docRenderer })

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

export function StructureView() {
  const [docs, setDocs] = useState(SAMPLE_DOCS)
  const [activeId, setActiveId] = useState(SAMPLE_DOCS[0].id)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'overview' | 'document' | 'ears' | 'sections' | 'bdd'>('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [genFor, setGenFor] = useState<{ id: string; gherkin: string; stories: number; acs: number } | null>(null)
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
      try {
        const doc = toDoc(d.filePath, d.ext, d.content, d.size)
        setDocs((prev) => [doc, ...prev.filter((x) => x.id !== doc.id)])
        setActiveId(doc.id)
      } catch (err) {
        console.error('[onFileLoaded] failed:', err)
      }
    })
    sv.onFolderScanned?.(async ({ files }: { files: string[] }) => {
      console.log('[onFolderScanned] scanned files:', files?.length ?? 0)
      const loaded = await Promise.all(
        (files || []).slice(0, 300).map(async (fp) => {
          try {
            const ext = (fp.split('.').pop() || '').toLowerCase()
            const res = await sv.readFile(fp)
            return res?.ok ? toDoc(fp, ext, res.content, res.size) : null
          } catch (err) {
            console.error('[onFolderScanned] failed for', fp, err)
            return null
          }
        })
      )
      const valid = loaded.filter(Boolean) as ReturnType<typeof makeDoc>[]
      console.log('[onFolderScanned] loaded docs:', valid.length)
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

  // Render the active document for reading: markdown → HTML, JSON → pretty-printed.
  const renderedDoc = useMemo(() => {
    if (!activeDoc) return ''
    const content = activeDoc.content || ''
    if (activeDoc.hint === 'json') {
      try {
        return `<pre class="doc-json">${escapeHtml(JSON.stringify(JSON.parse(content), null, 2))}</pre>`
      } catch {
        return `<pre class="doc-json">${escapeHtml(content)}</pre>`
      }
    }
    try {
      return marked.parse(content) as string
    } catch {
      return `<pre>${escapeHtml(content)}</pre>`
    }
  }, [activeDoc])

  // Empty state — guard before any activeDoc-dependent computation (e.g. all files removed).
  if (docs.length === 0) {
    const sv2 = (window as any).structview
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--ff-display)',fontSize:'var(--xl)',fontWeight:800,color:'var(--ft-blue)'}}>StructureView</div>
          <div className="t-sm text-muted" style={{margin:'12px 0 16px'}}>No documents open</div>
          <div className="flex gap-3" style={{justifyContent:'center'}}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => sv2?.openFileDialog?.()}>Open file</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => sv2?.openFolderDialog?.()}>Open folder</button>
          </div>
        </div>
      </div>
    )
  }

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
  const overallView = mode === 'overview' || mode === 'document'
  const composite = overallView && !jsonSig ? timc.aggregateScore : signal ? signal.score : timc.aggregateScore
  const compositeStatus = statusFor(composite)

  // EARS per-requirement analysis (for the EARS view + its pattern-coverage summary).
  const earsReqs: any[] = earsSig?.requirements ?? []
  const earsPass = earsReqs.filter((r) => r.status === 'pass').length
  const earsWarn = earsReqs.filter((r) => r.status === 'warn').length
  const earsFail = earsReqs.filter((r) => r.status === 'fail').length
  const earsAvg = earsReqs.length ? Math.round(earsReqs.reduce((s, r) => s + r.score, 0) / earsReqs.length) : 0

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
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        brandTag="StructureView"
        activeNav={mode === 'document' ? 'docs' : mode}
        onSelect={(id) => {
          const map: Record<string, 'overview' | 'document' | 'ears' | 'sections' | 'bdd'> = {
            overview: 'overview',
            docs: 'document',
            ears: 'ears',
            sections: 'sections',
            bdd: 'bdd',
          }
          if (map[id]) setMode(map[id])
        }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        sections={[
          {
            label: 'Fleet',
            items: [
              { id: 'back', label: 'Back to Roundhouse', icon: 'back', href: '/roundhouse' },
            ]
          },
          {
            // StructureView-only nav. Other products' items (TIMC Dashboard, CCQG Engine,
            // Learnings, Reports/Export) live in their own contextual sidebars — see
            // docs/screen-home-map.md.
            label: 'StructureView',
            items: [
              { id: 'overview', label: 'Overview', icon: 'grid', active: true },
              { id: 'docs', label: 'Documents', icon: 'doc' },
              { id: 'ears', label: 'EARS Analysis', icon: 'signal' },
              { id: 'sections', label: 'Sections', icon: 'book' },
              { id: 'bdd', label: 'BDD Generator', icon: 'search' },
              { id: 'author', label: 'Spec Author', icon: 'edit', href: '/author' },
            ]
          },
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
                <span className="badge b-blue">{docs.length} files</span>
              </div>
              <div className="sv-panel-body">
                {/* Open actions — full-width row so labels never clip in the narrow panel */}
                <div className="flex gap-2" style={{marginBottom:'var(--s3)'}}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{flex:1,justifyContent:'center'}}
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
                    style={{flex:1,justifyContent:'center'}}
                    onClick={() => (window as any).structview?.openFolderDialog?.()}
                    title="Open a folder of Markdown/JSON files (Ctrl+Shift+O)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Open folder
                  </button>
                </div>
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

            {/* CENTER: Document reader + live analysis views (Document / EARS / Sections / BDD) */}
            <div className="sv-panel">
              <div className="sv-panel-hd">
                <div className="flex gap-2 items-center">
                  {(['document', ...(hasModes ? (['ears', 'sections', 'bdd'] as const) : [])] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMode(t)}
                      className={`btn btn-sm ${mode === t ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {t === 'document' ? 'Document' : t === 'ears' ? 'EARS' : t === 'sections' ? 'Sections' : 'BDD'}
                    </button>
                  ))}
                </div>
                <span className="badge b-muted">{activeDoc.name}</span>
              </div>

              {mode === 'overview' ? (
                <div className="sv-panel-body">
                  <div style={{maxWidth:600}}>
                    <div style={{fontFamily:'var(--ff-display)',fontSize:'var(--xl)',fontWeight:800,color:'var(--ft-blue)'}}>StructureView</div>
                    <p className="t-sm text-muted" style={{margin:'var(--s2) 0 var(--s4)'}}>
                      A clean reader and quality lens for Markdown specs and JSON. Open a file or folder,
                      read it in <strong>Document</strong>, and check its quality live:
                    </p>
                    <div className="t-sm" style={{lineHeight:2}}>
                      <div><span className="dot dot-ok" style={{width:7,height:7,marginRight:8,display:'inline-block'}}></span><strong>EARS</strong> — are requirements written in EARS notation?</div>
                      <div><span className="dot dot-ok" style={{width:7,height:7,marginRight:8,display:'inline-block'}}></span><strong>Sections</strong> — does the spec contain all 10 required sections?</div>
                      <div><span className="dot dot-ok" style={{width:7,height:7,marginRight:8,display:'inline-block'}}></span><strong>BDD</strong> — are Gherkin scenarios well-formed? Generate scaffolds from job stories.</div>
                    </div>
                    <div className="flex gap-3" style={{marginTop:'var(--s5)'}}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => (window as any).structview?.openFileDialog?.()}>Open file</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => (window as any).structview?.openFolderDialog?.()}>Open folder</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode('document')}>Read current document</button>
                    </div>
                  </div>
                </div>
              ) : mode === 'document' ? (
                <div
                  className="sv-panel-body doc-reader"
                  onClick={(e) => {
                    const a = (e.target as HTMLElement).closest('a')
                    if (a && a.getAttribute('href')) {
                      e.preventDefault()
                      ;(window as any).structview?.openExternal?.(a.getAttribute('href'))
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedDoc }}
                />
              ) : (
                <div className="sv-panel-body">
                  {/* EARS analysis — per requirement */}
                  {mode === 'ears' && (
                    <>
                      <div className="flex-between mb-3">
                        <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>EARS Signal Analysis</span>
                        <span className="badge b-blue">{earsReqs.length} requirements</span>
                      </div>
                      {earsReqs.length === 0 && (
                        <div className="t-xs text-faint" style={{padding:'var(--s3) 0'}}>No requirement lines detected in this document.</div>
                      )}
                      {earsReqs.map((q, i) => (
                        <div key={i} className={`signal-item sig-${q.status}`}>
                          <div className="sig-body">
                            <div className="sig-pattern">
                              <span className={`badge ${q.status === 'pass' ? 'b-ok' : q.status === 'warn' ? 'b-warn' : 'b-err'}`} style={{fontSize:10}}>{q.pattern}</span>
                              &nbsp;<span className="t-xs text-faint">line {q.line}</span>
                            </div>
                            <div className="sig-text">{q.text}</div>
                          </div>
                          <span className="sig-score" style={{color: q.status === 'pass' ? 'var(--ok)' : q.status === 'warn' ? 'var(--warn)' : 'var(--err)'}}>{q.score}</span>
                        </div>
                      ))}
                      {earsReqs.length > 0 && (
                        <div className="card-sm" style={{background:'var(--sf2)',borderRadius:'var(--r-md)',marginTop:'var(--s4)'}}>
                          <div className="flex gap-4 items-center">
                            <span className="t-sm" style={{color:'var(--ok)'}}>{earsPass} PASS</span>
                            <span className="t-sm" style={{color:'var(--warn)'}}>{earsWarn} WARN</span>
                            <span className="t-sm" style={{color:'var(--err)'}}>{earsFail} FAIL</span>
                            <span className="t-sm ml-auto text-muted">Avg {earsAvg}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Section completeness — present / missing */}
                  {mode === 'sections' && sectionSig && (
                    <>
                      <div className="flex-between mb-3">
                        <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>Section Completeness</span>
                        <span className="badge b-blue">{sectionSig.breakdown.present}/{sectionSig.breakdown.total} present</span>
                      </div>
                      {(sectionSig.sections || []).map((sec: any, i: number) => (
                        <div key={i} className="t-sm flex items-center gap-2" style={{padding:'var(--s2) 0',borderBottom:'1px solid var(--bd)'}}>
                          <span className={`dot ${sec.present ? 'dot-ok' : 'dot-warn'}`} style={{width:8,height:8,flexShrink:0}}></span>
                          <span style={{color: sec.present ? 'var(--tx)' : 'var(--txm)'}}>{sec.label}</span>
                          <span className="ml-auto t-xs" style={{color: sec.present ? 'var(--ok)' : 'var(--warn)'}}>{sec.present ? 'present' : 'missing'}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* BDD — scenarios */}
                  {mode === 'bdd' && bddSig && (
                    <>
                      <div className="flex-between mb-3">
                        <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>BDD Coverage</span>
                        <span className="badge b-blue">{bddSig.breakdown.wellFormed}/{bddSig.breakdown.scenarios} well-formed</span>
                      </div>
                      {bddSig.findings.length === 0 && bddSig.breakdown.scenarios > 0 && (
                        <div className="t-sm" style={{color:'var(--ok)',padding:'var(--s2) 0'}}>All scenarios have Given / When / Then.</div>
                      )}
                      {bddSig.findings.map((f: any, i: number) => (
                        <div key={i} className="t-sm" style={{padding:'var(--s2) 0',borderBottom:'1px solid var(--bd)'}}>
                          <span className="dot dot-warn" style={{width:6,height:6,marginRight:8,display:'inline-block'}}></span>
                          {f.message}
                        </div>
                      ))}

                      {/* BDD Generator — scaffold Gherkin from the spec's job stories (CCQG S39 skill pipeline) */}
                      <div className="divider" style={{marginTop:'var(--s4)'}}></div>
                      <div className="flex-between mb-3">
                        <span className="t-xs text-muted fw-600" style={{textTransform:'uppercase',letterSpacing:'.06em'}}>BDD Generator</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const g = generateBdd(activeDoc.content)
                            setGenFor({ id: activeId, gherkin: g.gherkin, stories: g.jobStories.length, acs: g.acceptanceCriteria.length })
                          }}
                        >
                          Generate scenarios
                        </button>
                      </div>
                      {genFor?.id === activeId && (
                        <>
                          <div className="t-xs text-muted mb-2">
                            {genFor.stories > 0
                              ? `${genFor.stories} job stor${genFor.stories === 1 ? 'y' : 'ies'} → scenarios`
                              : genFor.acs > 0
                                ? `${genFor.acs} acceptance criteria → scenarios`
                                : 'No job stories or acceptance criteria found — add a Job Story: “When …, I want to …, so I can …”'}
                            {' · refine with Quality Guardian '}
                            <button
                              type="button"
                              onClick={() => (navigator as any).clipboard?.writeText(genFor.gherkin)}
                              style={{marginLeft:'var(--s2)',background:'none',border:'none',color:'var(--ft-blue)',cursor:'pointer'}}
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="doc-json" style={{whiteSpace:'pre-wrap'}}>{genFor.gherkin}</pre>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
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
                {/* Composite score */}
                <div className="timc-composite">
                  <div style={{fontSize:'var(--xs)',color:'var(--txf)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'var(--s2)'}}>
                    Composite Score
                  </div>
                  <div style={{fontFamily:'var(--ff-display)',fontSize:'var(--2xl)',fontWeight:800,color: compositeStatus === 'pass' ? 'var(--ok)' : compositeStatus === 'warn' ? 'var(--warn)' : 'var(--err)'}}>
                    {composite.toFixed(1)}
                  </div>
                  <div className="t-xs text-muted mt-2">
                    {overallView ? `overall · ${timc.documentType}` : signal ? `${signal.type} · ${timc.documentType}` : 'No signals'}
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
                      {mode === 'bdd'
                        ? `Quality Guardian's BDD Generator expands your job stories into full Gherkin — edge cases, Examples tables, and TypeScript step definitions — reviewed against your quality gates.`
                        : mode === 'sections'
                          ? `Quality Guardian enforces spec completeness across your whole project and blocks PRs that drop required sections.`
                          : ctaSignal.type === 'ears-coverage'
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
