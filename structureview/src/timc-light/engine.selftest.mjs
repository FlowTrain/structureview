// Standalone TIMC Light verification — run with: node src/timc-light/engine.selftest.mjs
// Framework-free (no jest). Covers the S35 §4 BDD intent plus the tolerant-EARS behaviour.
import { analyse, detectDocumentType } from './engine.js';
import { classifyRequirement, scoreEarsCoverage, isRequirement } from './signals/ears-coverage.js';
import { scoreJsonQuality } from './signals/json-quality.js';

let pass = 0, fail = 0;
const approx = (a, b) => Math.abs(a - b) < 1e-9;
function ok(name, cond) { if (cond) pass++; else { fail++; console.log('  FAIL:', name); } }

// EARS classify — tolerant: shall/must, varied subjects, stripped labels
ok('ubiquitous shall', classifyRequirement('- The system shall log') === 'ubiquitous');
ok('ubiquitous must, varied subject', classifyRequirement('- Every test file must contain a Covers comment') === 'ubiquitous');
ok('eventDriven', classifyRequirement('- When user submits, the system shall validate') === 'eventDriven');
ok('stateDriven', classifyRequirement('- While idle, the gateway must poll') === 'stateDriven');
ok('unwanted', classifyRequirement('- If invalid, then the system shall reject') === 'unwanted');
ok('optional', classifyRequirement('- Where premium, consumers shall export') === 'optional');
ok('weak should → null', classifyRequirement('- The system should handle errors') === null);
ok('plain prose → null', classifyRequirement('- A file manifest of outputs') === null);
ok('case-insensitive', classifyRequirement('- THE SYSTEM SHALL boot') === 'ubiquitous');
ok('strip AC label', classifyRequirement('- **AC2** — the engine shall detect types') === 'ubiquitous');

// isRequirement — only normative/trigger lines count (the wiggle)
ok('prose not a requirement', isRequirement('- See the table below') === false);
ok('should is a requirement', isRequirement('- Data should be cached') === true);
ok('when-trigger is a requirement', isRequirement('- When X happens, do Y') === true);

// EARS scoring
ok('all covered = 100', scoreEarsCoverage('- The system shall a\n- When x, the system shall b').score === 100);
ok('all weak = 0', scoreEarsCoverage('- Data should cache\n- Users may export').score === 0);
ok('prose-only doc = 100 (no requirements)', scoreEarsCoverage('- a manifest\n- a note\n- a link').score === 100);
const mixed = scoreEarsCoverage('- The system shall a\n- Data should cache\n- While y, the system shall c\n- Users may export');
ok('mixed = 50', mixed.score === 50);
ok('mixed → 2 warnings', mixed.findings.length === 2 && mixed.findings.every(f => f.severity === 'warning'));
ok('empty = 100', scoreEarsCoverage('').score === 100);
ok('no list items = 100', scoreEarsCoverage('# Title\n\nProse paragraph.').score === 100);

// JSON quality
ok('invalid json score 0', scoreJsonQuality('not json {{{').score === 0);
ok('invalid json canResolve true', scoreJsonQuality('not json {{{').canResolve === true);
const ideal = JSON.stringify({ data: [{ id: 1, name: 'A', status: 'x' }, { id: 2, name: 'B', status: 'y' }, { id: 3, name: 'C', status: 'z' }], meta: { total: 3 } });
ok('ideal json score 100', scoreJsonQuality(ideal).score === 100);
ok('nesting depth 8 → 40', scoreJsonQuality(JSON.stringify({ l1: { l2: { l3: { l4: { l5: { l6: { l7: { l8: 'v' } } } } } } } })).breakdown.nestingDepth === 40);

// Document type detection
ok('detect json {', detectDocumentType('{"a":1}') === 'json-response');
ok('detect markdown ##', detectDocumentType('## Heading\n- item') === 'markdown-spec');
ok('mimeHint override', detectDocumentType('plain text', 'json') === 'json-response');
ok('unknown fallback', detectDocumentType('just some prose') === 'unknown');

// Engine / BDD intent
const o1 = analyse('## Reqs\n- The system shall A\n- Data should cache\n- While y, the system shall C\n- Users may export');
ok('BDD md type', o1.documentType === 'markdown-spec');
ok('BDD score 50', o1.signals[0].score === 50);
ok('BDD 2 findings', o1.signals[0].findings.length === 2);
ok('BDD partial → CTA', o1.shouldShowCTA === true);
const full = analyse('## R\n- The system shall A\n- While y, the system shall B');
ok('BDD full → no CTA', full.signals[0].score === 100 && full.shouldShowCTA === false);
const below = analyse('{"a":null,"b":null,"c":null,"d":null,"e":null}');
ok('BDD json below 70 → CTA', below.signals[0].score < 70 && below.shouldShowCTA === true);
const sj70 = scoreJsonQuality('{"a":null,"b":null,"c":null,"d":null,"e":1}');
ok('BDD score exactly 70', approx(sj70.score, 70) && sj70.canResolve === true);
ok('BDD score 70 no CTA', analyse('{"a":null,"b":null,"c":null,"d":null,"e":1}').shouldShowCTA === false);
const ou = analyse('plain prose with no structure');
ok('BDD unknown → 100, no signals, no CTA', ou.documentType === 'unknown' && ou.aggregateScore === 100 && ou.signals.length === 0 && ou.shouldShowCTA === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
