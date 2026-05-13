# ADR-0005 — Multi-format parser architecture: port + adapter (DIP)

- **Status:** Accepted
- **Date:** 2026-05-12
- **Authors:** Claude (CCQG) on behalf of James Gifford

## Context

Brief v1.0 specifies multi-format support: Markdown, JSON, XML, YAML,
TOML. v1.1 adds CSV and JSONL. Each format has:

- A parser (text → structured value)
- A renderer (structured value → HTML)
- A TIMC Light analyser (structured value → signals)

If each format hard-wires its own pipeline, adding the next format
re-derives the integration. This breaks Practice 5 (DRY) and Practice
8 (Implement the Design Last — the design _emerges_, not by accident).

## Options considered

| Option                                         | Pros                                                                                          | Cons                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| Port + Adapter (DIP)                           | Adding a format = implementing the port once; TIMC Light analysers couple to the same surface | Slight upfront ceremony                |
| Big switch / dispatcher                        | Simple at 2 formats                                                                           | Quadratic complexity at 6+; breaks OCP |
| One file per format with shared utility module | Pragmatic                                                                                     | Drift between formats inevitable       |

## Decision

Define a `ParserPort` interface every format implements:

```
interface ParserPort {
  readonly id: 'md' | 'json' | 'xml' | 'yaml' | 'toml' | 'csv' | 'jsonl';
  readonly extensions: string[];   // ['md', 'markdown']
  parse(raw: string): ParsedDoc;
  outline(doc: ParsedDoc): OutlineNode[];   // for Outline view mode
  render(doc: ParsedDoc, meta?: Meta): string;  // HTML
}
```

A `ParserRegistry` resolves extensions → ParserPort instances at boot.

Each format lives in `src/parsers/<id>.js`. Adding YAML is one file,
one ParserPort implementation, one set of Gherkin specs.

TIMC Light analysers (ADR pending) likewise depend on a separate
`SignalAnalyserPort` keyed by parser id — they consume `ParsedDoc`,
not raw text.

## Consequences

- **Positive:** Closed for modification (registry/dispatch unchanged),
  open for extension (new ParserPort). Textbook OCP.
- **Positive:** Each parser is independently testable in isolation.
- **Positive:** TIMC Light analysers can compose with any parser.
- **Negative:** Tiny upfront ceremony — boot must register every parser.
  Mitigation: registry resolves from a directory glob.
- **Negative:** Outline shape forces consistency across formats. May
  feel forced for some (e.g., TOML tables). Mitigation: `OutlineNode`
  is permissive (no required `children`).

## Revisit triggers

- A format needs streaming parse (large file support) — extend the port
  with `parseStream()`
- A format requires a non-trivial side channel (e.g., schema fetch) —
  consider a second port for I/O
