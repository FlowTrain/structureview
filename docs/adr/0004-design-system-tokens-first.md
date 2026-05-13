# ADR-0004 — Design system structure: tokens-first, component-thin

- **Status:** Accepted
- **Date:** 2026-05-12
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

The brief specifies a strong, opinionated visual identity — locomotive
chrome, FlowTrain Blue (#2BAEE4), Gold (#F0C050), Steam Red (#D44030),
dark theme (#0a0a0f / #12121a), JetBrains Mono for technical labels,
Georgia for prose, the "DISPATCHED · EMD SD70ACe" status bar, etc.

This identity must hold across:

1. Existing Electron renderer (vanilla JS + CSS)
2. VS Code extension webview (separate webview context)
3. Future SaaS frontend (likely React/Vite)

If each surface re-derives the palette, drift is inevitable.

## Options considered

| Option                                         | Pros                                                                | Cons                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Tokens-first JS module + CSS custom properties | Single source of truth; trivially shareable across stacks; testable | Requires discipline — every colour must come from tokens                |
| Tailwind config                                | Familiar; fast iteration                                            | Couples to Tailwind across all surfaces; weak fit for Electron renderer |
| CSS-in-JS (styled-components / emotion)        | Co-located styles                                                   | React-only; doesn't fit Electron renderer or VS Code webview            |
| Figma → Style Dictionary                       | Designer-first                                                      | Toolchain weight; team is currently one engineer                        |

## Decision

**Tokens-first.** `src/tokens/index.js` is the only place brand values
exist. It exports:

- The token object (importable from JS/TS code)
- `toCssVariables()` — emits a `:root { --sv-* }` block consumable by
  every CSS surface

Components are thin wrappers that read tokens via CSS variables. No
component embeds a hex value, font name, or spacing literal.

The component library (Phase 1 Task #5) consists of primitives only:
`Button`, `Tab`, `OutlineNode`, `FileChip`, `StatusBar`, `RailStripe`,
`Callout`. Each is independently testable, ≤ 40 LOC.

## Consequences

- **Positive:** Adding the SaaS frontend later is mechanical — import
  tokens, render CSS variables, done.
- **Positive:** Brand drift is a lint-able offence (banned literals in
  non-token files).
- **Negative:** Component-level overrides become harder (intentional).
- **Negative:** Designers cannot edit Figma and have it auto-flow.
  Mitigation: Style Dictionary added in Phase 4 once team grows.

## Revisit triggers

- Multiple designers join (consider Style Dictionary)
- React frontend ships and styled-components becomes attractive
