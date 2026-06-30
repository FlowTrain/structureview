// SpecAuthor — PR 1 spike for S73 (in-tool spec authoring).
//
// A WYSIWYG editor (TipTap / ProseMirror) that round-trips Markdown and runs the live
// @trainyard/timc-light analysers on every change, so EARS / Sections / BDD climb toward the
// bar as you write. This is the "exploration → formal process" jump, in the tool itself.
//
// Spike scope (de-risks the editor decision in S73 §9 Decision Log — TipTap vs
// @atlaskit/editor-core): proves TipTap + tiptap-markdown bundles under Vite and that
// editor.storage.markdown.getMarkdown() feeds analyse() cleanly. ADF round-trip, Confluence
// sync, and template enforcement are deliberately out of scope here (later PRs).

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { analyse } from '@timc/engine.js'

// CCQG 10-section template (spec-instructions.md §3) with an EARS block and a Gherkin block,
// so a freshly-scaffolded doc already exercises every analyser. Authors fill it in.
const CCQG_TEMPLATE = `# SXX: <Title>

## 1. Objective

Job Story — when <situation>, I want to <motivation>, so that <expected outcome>.

## 2. Scope

In scope: <...>. Out of scope: <...>.

## 3. Technical Design

<Architecture, data flow, key modules.>

## 4. BDD Scenarios

\`\`\`gherkin
Scenario: <behaviour>
  Given <precondition>
  When <action>
  Then <observable outcome>
\`\`\`

## 5. Test Strategy

<Unit / integration / coverage target.>

## 6. PR Breakdown

- PR 1 — <...>
- PR 2 — <...>

## 7. Dependencies

<Upstream specs, packages, services.>

## 8. Acceptance Criteria

- <Measurable criterion.>

## 9. Decision Log

- Decision: <decision> · Options: <a / b> · Choice: <x> · Rationale: <why>

## 10. Delivery Surface & Integration

<Gate 5 surface: named screen, contract test, or §10.2 handoff.>

## Functional Requirements (EARS)

- REQ-001: The system shall <ubiquitous requirement>.
- REQ-002: When <trigger>, the system shall <event-driven response>.
- REQ-003: While <state>, the system shall <continuous behaviour>.
`

function Bar({ label, score }: { label: string; score: number }) {
  const colour = score >= 90 ? 'var(--ok)' : score >= 70 ? 'var(--warn)' : 'var(--err)'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--txm)', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: colour, fontWeight: 600 }}>{Math.round(score)}</span>
      </div>
      <div style={{ height: 6, background: 'var(--sf2)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', background: colour }} />
      </div>
    </div>
  )
}

// Drafts auto-save to this device (localStorage). Not the repo file — use Download .md for
// that. Bump the key suffix if the template/format changes incompatibly.
const STORAGE_KEY = 'specAuthor.draft.v1'

export function SpecAuthor() {
  const initial =
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || CCQG_TEMPLATE
  const [md, setMd] = useState(initial)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const persist = (next: string) => {
    setMd(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
      setSavedAt(new Date().toLocaleTimeString())
    } catch {
      // localStorage unavailable (e.g. private mode) — editing still works, just no autosave.
    }
  }

  const editor = useEditor({
    extensions: [StarterKit, Markdown.configure({ html: false, breaks: false })],
    content: initial,
    onUpdate: ({ editor }) => persist(editor.storage.markdown.getMarkdown()),
  })

  const result = useMemo(() => (md.trim() ? analyse(md, 'markdown') : null), [md])
  const composite = result ? Math.round(result.aggregateScore) : 0
  const byType = (t: string) => result?.signals.find((s: any) => s.type === t)
  const ears = byType('ears-coverage')
  const sections = byType('section-completeness')
  const bdd = byType('bdd-coverage')
  const compColour = composite >= 90 ? 'var(--ok)' : composite >= 70 ? 'var(--warn)' : 'var(--err)'

  // emitUpdate=true so the score panel + autosave refresh (setContent is silent by default).
  const insertTemplate = () => editor?.chain().focus().setContent(CCQG_TEMPLATE, true).run()

  // Download the current Markdown so a finished spec drops straight into docs/.
  // First non-empty heading (# / ##) seeds the filename; falls back to "spec".
  const downloadMd = () => {
    const heading = md.split('\n').find((l) => /^#{1,2}\s/.test(l.trim()))
    const slug =
      (heading?.replace(/^#{1,2}\s+/, '').trim() || 'spec')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'spec'
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const btnStyle = {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--bd)',
    background: 'var(--sf2)',
    color: 'var(--tx)',
    cursor: 'pointer',
  } as const

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--tx)', fontFamily: 'var(--ff-display)' }}>
      {/* Document typography, scoped to the editor so it doesn't inherit the app's large
          display/nav heading sizes. Reads like a spec, not chrome. */}
      <style>{`
        .spec-author-editor .ProseMirror { max-width: 720px; margin: 0 auto; outline: none;
          font-family: 'Inter', system-ui, sans-serif; color: var(--tx); }
        .spec-author-editor .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 .6em; }
        .spec-author-editor .ProseMirror h2 { font-size: 1.15rem; font-weight: 600; margin: 1.4em 0 .5em;
          padding-top: .4em; border-top: 1px solid var(--bd); }
        .spec-author-editor .ProseMirror h3 { font-size: 1rem; font-weight: 600; margin: 1.1em 0 .4em; }
        .spec-author-editor .ProseMirror p,
        .spec-author-editor .ProseMirror li { font-size: .9rem; line-height: 1.65; }
        .spec-author-editor .ProseMirror ul,
        .spec-author-editor .ProseMirror ol { padding-left: 1.4em; }
        .spec-author-editor .ProseMirror pre { background: var(--sf2); border: 1px solid var(--bd);
          border-radius: var(--r-sm); padding: 12px 14px; overflow: auto; }
        .spec-author-editor .ProseMirror pre,
        .spec-author-editor .ProseMirror code { font-family: var(--ff-mono); font-size: .82rem; }
        .spec-author-editor .ProseMirror > :first-child { margin-top: 0; }
      `}</style>
      {/* Editor pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ ...btnStyle, textDecoration: 'none' }} title="Back to StructureView">
            ← StructureView
          </Link>
          <strong style={{ fontSize: 14 }}>Spec Author</strong>
          <span style={{ fontSize: 11, color: 'var(--txm)' }}>
            {savedAt ? `Auto-saved to this device · ${savedAt}` : 'Auto-saves to this device'}
          </span>
          <button onClick={insertTemplate} style={{ ...btnStyle, marginLeft: 'auto' }}>
            Insert CCQG template
          </button>
          <button onClick={downloadMd} style={btnStyle} title="Download as Markdown">
            Download .md
          </button>
        </div>
        <div className="spec-author-editor" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Live score pane */}
      <aside style={{ width: 280, borderLeft: '1px solid var(--bd)', padding: 20, overflow: 'auto' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--txm)', marginBottom: 8 }}>
          Composite
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: compColour, lineHeight: 1, marginBottom: 4 }}>{composite}</div>
        <div style={{ fontSize: 11, color: 'var(--txm)', marginBottom: 20 }}>
          bar = 90 · {composite >= 90 ? 'clears it' : 'below bar'}
        </div>

        {ears && <Bar label={`EARS (${ears.requirements?.length ?? 0} reqs)`} score={ears.score} />}
        {sections && <Bar label={`Sections (${sections.breakdown?.present ?? 0}/${sections.breakdown?.total ?? 10})`} score={sections.score} />}
        {bdd && <Bar label={`BDD (${bdd.breakdown?.wellFormed ?? 0} scenarios)`} score={bdd.score} />}

        {sections?.sections && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--txm)', marginBottom: 8 }}>
              Sections
            </div>
            {sections.sections.map((s: any) => (
              <div key={s.label} style={{ fontSize: 12, display: 'flex', gap: 8, padding: '2px 0', color: s.present ? 'var(--tx)' : 'var(--txm)' }}>
                <span style={{ color: s.present ? 'var(--ok)' : 'var(--err)' }}>{s.present ? '✓' : '○'}</span>
                {s.label}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
