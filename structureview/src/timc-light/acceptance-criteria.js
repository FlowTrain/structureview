// TIMC Light — shared acceptance-criteria extractor.
//
// One source of truth for "what are this spec's acceptance criteria", used by BOTH the BDD
// generator (which turns ACs into scenarios) and the BDD coverage signal (which denominates
// coverage by ACs). They MUST agree: the success-theater bug this module fixes was a coverage
// number graded against a different denominator than the generator reported ("8/8 well-formed"
// vs "15 acceptance criteria → scenarios"). Sharing the extractor makes that drift impossible.
//
// Extraction rules (in priority order):
//   1. Explicitly labelled criteria anywhere in the doc — `AC1`, `AC 02`, `REQ-3`,
//      optionally as a checkbox (`- [ ] **AC1** — ...`). Their own id is preserved.
//   2. Fallback: bullets (incl. `- [ ]` checkboxes) under an "Acceptance Criteria" heading,
//      auto-numbered `AC01`, `AC02`, ... and capped at 15 (matches the generator's cap).

const LABELLED = /^\s*[-*]\s*(?:\[[ xX]\]\s*)?\*{0,2}(AC\s?\d+|REQ-?\d+)\*{0,2}\s*[—:.)-]*\s*(.+)$/i;

function clean(s) {
  return s
    .replace(/^\s*[-*]\s+/, '')
    .replace(/^\[[ xX]\]\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[*_`>]/g, '')
    .trim();
}

/** Pass 1 — every explicitly labelled AC/REQ line, in document order. */
function labelledCriteria(lines) {
  const acs = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(LABELLED);
    if (m) acs.push({ id: m[1].replace(/\s/g, '').toUpperCase(), text: clean(m[2]), line: i + 1 });
  }
  return acs;
}

/** Pass 2 — bullets under an "Acceptance Criteria" heading, auto-numbered, capped at 15. */
function headingCriteria(lines) {
  const acs = [];
  let inSection = false;
  for (let i = 0; i < lines.length && acs.length < 15; i++) {
    if (/^#{1,4}\s/.test(lines[i])) {
      inSection = /acceptance criteria/i.test(lines[i]);
    } else if (inSection && /^\s*[-*]\s+\S/.test(lines[i])) {
      acs.push({ id: `AC${String(acs.length + 1).padStart(2, '0')}`, text: clean(lines[i]), line: i + 1 });
    }
  }
  return acs;
}

/**
 * @returns {{ id: string, text: string, line: number }[]} the spec's acceptance criteria.
 */
export function extractAcceptanceCriteria(markdown) {
  const lines = markdown.split('\n');
  const labelled = labelledCriteria(lines);
  return labelled.length ? labelled : headingCriteria(lines);
}
