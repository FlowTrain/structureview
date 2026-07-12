// Antagonist — S73 spike (dual-LLM quality antagonist).
//
// One model GENERATES a spec; the TIMC Light engine acts as the CRITIC, scoring it against
// EARS / Sections / BDD and producing remediation. Human-in-the-loop: you trigger generate,
// read the verdict, and click "Regenerate with feedback" to feed the critic's findings back
// into the generator. The loop should visibly climb toward the 90 bar across iterations.
//
// Spike scope: the generator is a single OpenAI-compatible endpoint called via the main
// process (window.structview.antagonist). No real terminals (node-pty/xterm) and no
// ai.providers/ai.models registry yet — those are S73 Phase A/B. The critic is the real
// shipped engine, so the evaluation half is production-grade today.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyse } from '@timc/engine.js'

type GenResult = { ok: true; content: string; model: string; endpoint: string } | { ok: false; message: string }

interface GovFile {
  path: string
  ok: boolean
  bytes?: number
  message?: string
}
interface Bridge {
  generate: (opts: { endpoint?: string; model?: string; messages: { role: string; content: string }[] }) => Promise<GenResult>
  defaults: () => Promise<{ endpoint: string; model: string }>
  governance: (paths?: string[]) => Promise<{ text: string; files: GovFile[]; approxTokens: number }>
}

const bridge: Bridge | undefined = (window as any).structview?.antagonist

// Distilled format rules (~200 tokens) — targets exactly the two critic signals the generator
// keeps missing (EARS section + Background Gherkin). The full spec-instructions.md (~9.7K tokens)
// is deliberately NOT here; it would blow the local model's 16K window. This is prepended to the
// governance docs (SOUL.md + AGENTS.md) loaded from disk to form the full system prompt.
const FORMAT_GUIDE =
  'TASK FORMAT — when asked to write a CCQG spec, output ONLY a Markdown spec with these H2 ' +
  'headings in order: "## 1. Objective", "## 2. Scope", "## 3. Technical Design", ' +
  '"## 4. BDD Scenarios", "## 5. Test Strategy", "## 6. PR Breakdown", "## 7. Dependencies", ' +
  '"## 8. Acceptance Criteria", "## 9. Decision Log", "## 10. Delivery Surface & Integration". ' +
  'Put EVERY functional requirement under a "### Functional Requirements (EARS)" subsection of ' +
  'section 3, using the word "shall" (never "should" or "will"): "The system shall X." / ' +
  '"When T, the system shall X." / "While S, the system shall X." / "If C, then the system shall ' +
  'X." / "Where F, the system shall X." Do NOT put requirements in the NFR, Test Strategy, ' +
  'Acceptance Criteria, or Dependencies sections. In section 4 include a ```gherkin block with a ' +
  'Feature, a Background containing a Given, and Scenarios that each have When and Then. Output ' +
  'only the Markdown spec, no preamble.'

function Bar({ label, score }: { label: string; score: number }) {
  const colour = score >= 90 ? 'var(--ok)' : score >= 70 ? 'var(--warn)' : 'var(--err)'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--txm)', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: colour, fontWeight: 600 }}>{Math.round(score)}</span>
      </div>
      <div style={{ height: 6, background: 'var(--sf2)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', background: colour }} />
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'var(--sf2)',
  border: '1px solid var(--bd)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--tx)',
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: 'var(--ff-mono)',
} as const

export function Antagonist() {
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState(
    'Write a CCQG spec for a feature that lets users export a TIMC Light report as a PDF.'
  )
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iteration, setIteration] = useState(0)
  const [systemPrompt, setSystemPrompt] = useState(FORMAT_GUIDE)
  const [gov, setGov] = useState<{ files: GovFile[]; approxTokens: number } | null>(null)
  const [showSys, setShowSys] = useState(false)

  useEffect(() => {
    bridge?.defaults().then((d) => {
      setEndpoint((e) => e || d.endpoint)
      setModel((m) => m || d.model)
    })
    // Load the governance docs (SOUL.md CoC + AGENTS.md QMS) and put them in the system prompt —
    // the generator "runs under" the QMS + CoC, per the CCQG model.
    bridge?.governance().then((g) => {
      setGov({ files: g.files, approxTokens: g.approxTokens })
      if (g.text.trim()) setSystemPrompt(`${FORMAT_GUIDE}\n\n${g.text}`)
    })
  }, [])

  // System-prompt context budget (local model window is 16K; leave room for spec + generation).
  const sysTokens = Math.round(systemPrompt.length / 4)
  const sysTight = sysTokens > 7000

  // The critic: the real, shipped TIMC Light engine.
  const verdict = useMemo(() => (output.trim() ? analyse(output, 'markdown') : null), [output])
  const composite = verdict ? Math.round(verdict.aggregateScore) : 0
  const byType = (t: string) => verdict?.signals.find((s: any) => s.type === t)
  const findings: { signal: string; message: string }[] = verdict
    ? verdict.signals.flatMap((s: any) => (s.findings || []).map((f: any) => ({ signal: s.type, message: f.message })))
    : []
  const pass = composite >= 90

  const run = async (withFeedback: boolean) => {
    if (!bridge) {
      setError('The antagonist needs the desktop app (provider call runs in the main process).')
      return
    }
    setBusy(true)
    setError(null)
    const messages = [{ role: 'system', content: systemPrompt }]
    let user = prompt
    if (withFeedback && findings.length > 0) {
      const remediation = findings.map((f) => `- [${f.signal}] ${f.message}`).join('\n')
      user += `\n\nThe previous draft scored ${composite}/100. Fix these issues and return the full corrected spec:\n${remediation}`
    }
    messages.push({ role: 'user', content: user })
    const res = await bridge.generate({ endpoint, model, messages })
    if (res.ok) {
      setOutput(res.content)
      setIteration((n) => n + 1)
    } else {
      setError(res.message)
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'var(--ff-display)' }}>
      {/* Header / config */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/" style={{ ...inputStyle, textDecoration: 'none', fontFamily: 'var(--ff-display)' }} title="Back to StructureView">
          ← StructureView
        </Link>
        <strong style={{ fontSize: 14 }}>Quality Antagonist</strong>
        <span style={{ fontSize: 11, color: 'var(--txm)' }}>generator → critic (TIMC Light) · HITL · iteration {iteration}</span>
        <input style={{ ...inputStyle, marginLeft: 'auto', width: 320 }} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="endpoint" title="Provider endpoint" />
        <input style={{ ...inputStyle, width: 140 }} value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" title="Model" />
      </div>

      {/* Governance system prompt — the generator runs under SOUL.md (CoC) + AGENTS.md (QMS). */}
      <div style={{ padding: '6px 20px', borderBottom: '1px solid var(--bd)', fontSize: 11, color: 'var(--txm)' }}>
        <button
          onClick={() => setShowSys((s) => !s)}
          style={{ background: 'none', border: 'none', color: 'var(--txm)', cursor: 'pointer', fontSize: 11, padding: 0, fontFamily: 'var(--ff-display)' }}
        >
          {showSys ? '▾' : '▸'} System prompt — governed by{' '}
          {gov
            ? gov.files.filter((f) => f.ok).map((f) => f.path.split(/[\\/]/).pop()).join(' + ') || 'built-in format guide only'
            : 'loading…'}{' '}
          · ~{sysTokens} tok
          <span style={{ color: sysTight ? 'var(--warn)' : 'var(--ok)' }}>{sysTight ? ' ⚠ tight vs 16K window' : ' ✓ fits'}</span>
        </button>
        {gov && gov.files.some((f) => !f.ok) && (
          <span style={{ color: 'var(--warn)', marginLeft: 8 }}>
            not found: {gov.files.filter((f) => !f.ok).map((f) => f.path.split(/[\\/]/).pop()).join(', ')} — using format guide only
          </span>
        )}
        {showSys && (
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            spellCheck={false}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', minHeight: 160, marginTop: 6, fontSize: 11, lineHeight: 1.5 }}
          />
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Generator */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--bd)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bd)', fontSize: 12, color: 'var(--txm)' }}>GENERATOR</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, flex: 1 }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'var(--ff-display)', minHeight: 64, resize: 'vertical' }}
              placeholder="What should the generator produce?"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => run(false)} disabled={busy} style={{ ...inputStyle, fontFamily: 'var(--ff-display)', cursor: busy ? 'default' : 'pointer', background: 'var(--primary)', color: '#001018', border: 'none', fontWeight: 600, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Generating…' : 'Generate'}
              </button>
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--err)', fontFamily: 'var(--ff-mono)', whiteSpace: 'pre-wrap' }}>{error}</div>}
            <pre style={{ flex: 1, overflow: 'auto', margin: 0, background: 'var(--sf2)', border: '1px solid var(--bd)', borderRadius: 'var(--r-sm)', padding: 12, fontFamily: 'var(--ff-mono)', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {output || '— generated spec appears here —'}
            </pre>
          </div>
        </div>

        {/* Critic */}
        <aside style={{ width: 320, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--bd)', fontSize: 12, color: 'var(--txm)' }}>CRITIC · TIMC Light</div>
          <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
            {!verdict ? (
              <div style={{ fontSize: 12, color: 'var(--txm)' }}>No artifact yet. Generate a spec to get a verdict.</div>
            ) : (
              <>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--txm)' }}>Verdict</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, color: pass ? 'var(--ok)' : composite >= 70 ? 'var(--warn)' : 'var(--err)', lineHeight: 1 }}>{composite}</span>
                  <span style={{ fontSize: 12, color: pass ? 'var(--ok)' : 'var(--warn)', fontWeight: 600 }}>{pass ? 'PASS' : 'NEEDS WORK'}</span>
                </div>
                {byType('ears-coverage') && <Bar label="EARS" score={byType('ears-coverage').score} />}
                {byType('section-completeness') && <Bar label="Sections" score={byType('section-completeness').score} />}
                {byType('bdd-coverage') && <Bar label="BDD" score={byType('bdd-coverage').score} />}

                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--txm)', margin: '16px 0 6px' }}>
                  Remediation ({findings.length})
                </div>
                {findings.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--ok)' }}>No findings — clears the bar.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {findings.slice(0, 20).map((f, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: 'var(--txm)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--err)' }}>•</span> {f.message}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => run(true)}
                  disabled={busy || findings.length === 0}
                  style={{ ...inputStyle, fontFamily: 'var(--ff-display)', marginTop: 16, width: '100%', cursor: busy || findings.length === 0 ? 'default' : 'pointer', opacity: busy || findings.length === 0 ? 0.5 : 1 }}
                >
                  {busy ? 'Regenerating…' : 'Regenerate with feedback'}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
