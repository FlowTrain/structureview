# TIMC Light — signal engine

Framework-free quality-signal engine for StructureView, implementing the StructureView
Lite portion of spec **S35** (`docs/specs/S35-timc-light-mvp.md` in the CCQG repo).

It consumes the document the user is viewing and returns quality signals:

- **EARS coverage** (`signals/ears-coverage.js`) — for Markdown spec/requirements docs,
  scores what fraction of requirement lines follow one of the 5 EARS patterns.
- **JSON quality** (`signals/json-quality.js`) — for JSON, a weighted 0–100 composite over
  parseability, null density, key consistency, nesting depth, and envelope shape.
- **Engine** (`engine.js`) — detects document type, dispatches to the right signal,
  aggregates the score, and decides whether to surface the once-per-session upgrade CTA.

Pure ESM, no framework or network dependencies — runs in the Electron renderer, the React
bundle, and Node. Verify with:

```
node src/timc-light/engine.selftest.mjs
```

## Provenance & corrections

Ported from the CCQG implementation (`Clean_Code_Quality_Guardian/src/timc-light/`). Two
defects in the source were corrected so behaviour matches the S35 spec and BDD scenarios:

1. **`json-quality.js`** — the valid-document path set `canResolve = compositeScore < 70`,
   which is inverted. Per S35 §3.3 and the BDD scenarios (score 70 → no CTA; below 70 → CTA),
   a passing score must be resolvable. Corrected to `>= 70`.
2. **`engine.js`** — `shouldShowCTA` was `signals.some(s => !s.canResolve)`. Since the EARS
   signal's `canResolve` is always `false`, every Markdown document triggered the CTA,
   contradicting the BDD scenario where full EARS coverage shows no CTA. Corrected to fire
   only when an unresolved signal also has a finding.

## Tolerant EARS detection

S35's literal formula counts every list item as a requirement and only matches lines
beginning with the bare "The system shall…" template. Run against the real `docs/specs`
corpus, that produced uniform 0% scores with hundreds of false "uncovered requirements",
because those specs use bullets for prose/manifests and phrase requirements with varied
subjects and requirement IDs. `ears-coverage.js` was therefore made tolerant: only list
lines carrying normative language (shall/must/should/will/may) or an EARS trigger
(When/While/If/Where) count as requirements; leading labels (`**AC1** —`, `REQ-001:`) are
stripped; coverage accepts shall/must with any subject; weak/ambiguous lines count as
requirements but are flagged. Against the real specs this yields a sensible 0–100 spread.

## Not yet included

The S35 React UI components (`InlineSignal`, `HealthBar`, `UpgradeCTA`) and the wiring that
displays these signals in the app are part of the React-bundle phase (see project tasks).
This module is the framework-free core those components consume.
