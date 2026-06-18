// Standalone TIMC Light verification — run with: node src/timc-light/engine.selftest.mjs
// Framework-free (no jest). Covers the S35 §4 BDD intent plus the tolerant-EARS behaviour.
import { analyse, detectDocumentType } from './engine.js';
import { classifyRequirement, scoreEarsCoverage, isRequirement } from './signals/ears-coverage.js';
import { scoreJsonQuality } from './signals/json-quality.js';
import { scoreSectionCompleteness } from './signals/section-completeness.js';
import { scoreBddCoverage } from './signals/bdd-coverage.js';
import { generateBdd } from './bdd-generator.js';

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

// Section completeness
const allSections = '# S99\n## 1. Objective\n## 2. Scope\n## 3. Technical Design\n## 4. BDD Scenarios\n## 5. Test Strategy\n## 6. PR Breakdown\n## 7. Dependencies\n## 8. Acceptance Criteria\n## 9. Decision Log\n## 10. Delivery Surface & Integration';
ok('all sections = 100', scoreSectionCompleteness(allSections).score === 100);
ok('all sections no findings', scoreSectionCompleteness(allSections).findings.length === 0);
const someSections = scoreSectionCompleteness('# S99\n## Objective\n## Scope\n## Acceptance Criteria');
ok('partial sections between 0 and 100', someSections.score > 0 && someSections.score < 100);
ok('partial sections → 7 findings', someSections.findings.length === 7 && someSections.findings.every((f) => f.severity === 'warning'));
ok('section canResolve true (no CTA)', someSections.canResolve === true);
ok('section breakdown present/total', someSections.breakdown.present === 3 && someSections.breakdown.total === 10);
const mdoc = analyse(allSections + '\n- The system shall log\n\nScenario: happy\n  Given x\n  When y\n  Then z');
ok('markdown returns ears+sections+bdd', mdoc.signals.length === 3 && ['ears-coverage', 'section-completeness', 'bdd-coverage'].every((t) => mdoc.signals.some((s) => s.type === t)));
ok('markdown aggregate blends to 100', Math.round(mdoc.aggregateScore) === 100);

// BDD coverage
ok('bdd well-formed = 100', scoreBddCoverage('Scenario: a\n  Given x\n  When y\n  Then z').score === 100);
const bmiss = scoreBddCoverage('Scenario: a\n  Given x\n  When y');
ok('bdd missing Then → 0 with finding', bmiss.score === 0 && bmiss.findings[0].message.includes('Then'));
ok('bdd none → 0 with finding', scoreBddCoverage('# prose').score === 0 && scoreBddCoverage('# x').findings.length === 1);
ok('bdd breakdown counts scenarios', scoreBddCoverage('Scenario: a\n Given x\n When y\n Then z\nScenario: b\n When q\n Then r').breakdown.scenarios === 2);

// BDD coverage precision — prose "Scenario:/Example:" lines without Given/When/Then are ignored
ok('bdd precision: prose scenarios ignored', scoreBddCoverage('- Example: ["a","b"]\n- Scenario: foo bar').breakdown.scenarios === 0);

// Section completeness — per-section present/missing list
const secList = scoreSectionCompleteness('## Objective\n## Scope');
ok('sections list length 10', secList.sections.length === 10);
ok('sections present flag', secList.sections.find((s) => s.label === 'Objective').present === true);

// BDD generator — job story → scenario, AC fallback, empty
const gen1 = generateBdd('# Demo\n\nWhen I review a spec, I want to check quality, so I can fix gaps.');
ok('generator: job story parsed', gen1.jobStories.length === 1 && /Scenario: AC01/.test(gen1.gherkin));
const gen2 = generateBdd('## Acceptance Criteria\n- The system shall log events\n- The system shall alert on failure');
ok('generator: AC fallback', gen2.jobStories.length === 0 && gen2.acceptanceCriteria.length === 2);
ok('generator: gherkin always returned', typeof generateBdd('# Empty doc').gherkin === 'string');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
