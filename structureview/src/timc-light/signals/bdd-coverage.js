// TIMC Light — BDD (Gherkin) coverage signal.
//
// Coverage is AC-DENOMINATED: score = (acceptance criteria that have a well-formed scenario) /
// (total acceptance criteria) × 100, and every uncovered AC is flagged by id. This replaces the
// old "well-formed / total scenarios" score, which was success theater — it could read 100
// ("8/8 well-formed") while 7 of 15 ACs had no scenario at all. Well-formedness (Given+When+Then)
// is kept, but only as a SECONDARY quality check on the scenarios that do exist.
//
// AC ↔ scenario matching:
//   - id mode: if any scenario references an AC id (a Gherkin `@AC01` tag, or the id in the
//     Scenario name — the shape the generator emits: `Scenario: AC01 — ...`), match precisely and
//     flag the specific uncovered ids.
//   - count fallback: for authored specs whose scenarios use descriptive names (no ids), the first
//     N ACs (document order) are credited to N well-formed scenarios; the trailing ACs are flagged.
//   - no ACs: nothing to denominate, so fall back to reporting well-formedness of scenarios.

import { extractAcceptanceCriteria } from '../acceptance-criteria.js';

const SIGNAL = { signalId: 'bdd-coverage', type: 'bdd-coverage', canResolve: true };

const SCENARIO_HEAD = /^(?:Scenario Outline|Scenario|Example)\s*:\s*(.*)$/i;

function flush(st) {
  if (st.current) st.scenarios.push(st.current);
}

/** Start a new Feature (mode=null, clears the Background Given) or Background (keeps it). */
function reset(st, mode) {
  flush(st);
  st.current = null;
  st.mode = mode;
  st.tags = [];
  if (mode === null) st.bgGiven = false;
}

function openScenario(st, name, lineNo) {
  flush(st);
  st.current = { name, line: lineNo, given: false, when: false, then: false, bgGiven: st.bgGiven, tags: st.tags };
  st.mode = 'scenario';
  st.tags = [];
}

/** Record a Given/When/Then step against the current scenario (or the Feature Background). */
function markStep(st, t) {
  if (/^Given\b/i.test(t)) {
    if (st.mode === 'background') st.bgGiven = true;
    else if (st.current) st.current.given = true;
  } else if (/^When\b/i.test(t) && st.current) {
    st.current.when = true;
  } else if (/^Then\b/i.test(t) && st.current) {
    st.current.then = true;
  }
}

function consumeLine(st, t, lineNo) {
  if (/^@/.test(t)) st.tags = st.tags.concat(t.match(/@[\w-]+/g) || []);
  else if (/^Feature\s*:/i.test(t)) reset(st, null);
  else if (/^Background\s*:/i.test(t)) reset(st, 'background');
  else if (SCENARIO_HEAD.test(t)) openScenario(st, t.replace(SCENARIO_HEAD, '$1'), lineNo);
  else markStep(st, t);
}

/** Parse Scenario/Example blocks, carrying Gherkin tags and a Feature-level Background Given. */
function parseScenarios(markdown) {
  const st = { scenarios: [], current: null, mode: null, bgGiven: false, tags: [] };
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    consumeLine(st, lines[i].trim().replace(/^[-*>]\s*/, ''), i + 1);
  }
  flush(st);

  // Precision: a real Gherkin scenario has at least one Given/When/Then of its own — this drops
  // prose lines that merely contain "Scenario:"/"Example:".
  return st.scenarios.filter((s) => s.given || s.when || s.then);
}

/** A Feature Background Given satisfies the scenario's Given. */
function isWellFormed(s) {
  return (s.given || s.bgGiven) && s.when && s.then;
}

/** AC ids referenced by a scenario, via its Gherkin tags or its name. */
function referencedAcIds(scenario, acIds) {
  const hay = (scenario.tags.join(' ') + ' ' + scenario.name).toUpperCase();
  return acIds.filter((id) => {
    const needle = id.replace(/\s/g, '');
    const re = new RegExp('(?<![A-Z0-9])' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Z0-9])');
    return re.test(hay.replace(/\s/g, ''));
  });
}

/** Which ACs are covered by a well-formed scenario — id-matched when possible, else by count. */
function coveredAcIds(acs, scenarios) {
  const ids = acs.map((a) => a.id);
  const wellFormed = scenarios.filter(isWellFormed);
  const idMode = wellFormed.some((s) => referencedAcIds(s, ids).length > 0);
  const covered = new Set();
  if (idMode) {
    for (const s of wellFormed) for (const id of referencedAcIds(s, ids)) covered.add(id);
  } else {
    for (let k = 0; k < Math.min(wellFormed.length, ids.length); k++) covered.add(ids[k]);
  }
  return { covered, idMode };
}

/** Secondary check: scenarios that exist but are missing a Given/When/Then step. */
function malformedFindings(scenarios) {
  const findings = [];
  for (const s of scenarios) {
    if (isWellFormed(s)) continue;
    const missing = [!(s.given || s.bgGiven) && 'Given', !s.when && 'When', !s.then && 'Then'].filter(Boolean).join('/');
    findings.push({ line: s.line, message: `Scenario missing ${missing}: "${s.name.slice(0, 60)}"`, severity: 'warning' });
  }
  return findings;
}

function result(score, findings, breakdown) {
  return { ...SIGNAL, score, findings, breakdown };
}

/** No acceptance criteria to denominate against → report well-formedness of scenarios instead. */
function wellFormedOnly(scenarios) {
  const total = scenarios.length;
  const wellFormed = scenarios.filter(isWellFormed).length;
  const base = { acsTotal: 0, acsCovered: 0, missingAcs: [], scenarios: total, wellFormed };
  if (total === 0) {
    return result(0, [{ message: 'No Gherkin scenarios found (Scenario / Given-When-Then)', severity: 'warning' }], base);
  }
  return result((wellFormed / total) * 100, malformedFindings(scenarios), base);
}

export function scoreBddCoverage(markdown) {
  const scenarios = parseScenarios(markdown);
  const acs = extractAcceptanceCriteria(markdown);
  if (acs.length === 0) return wellFormedOnly(scenarios);

  const { covered, idMode } = coveredAcIds(acs, scenarios);
  const missing = acs.filter((a) => !covered.has(a.id));
  const findings = missing.map((a) => ({
    line: a.line,
    message: `Acceptance criterion ${a.id} has no well-formed scenario`,
    severity: 'warning',
  }));

  return result((covered.size / acs.length) * 100, findings.concat(malformedFindings(scenarios)), {
    acsTotal: acs.length,
    acsCovered: covered.size,
    missingAcs: missing.map((a) => a.id),
    matchMode: idMode ? 'id' : 'count',
    scenarios: scenarios.length,
    wellFormed: scenarios.filter(isWellFormed).length,
  });
}
