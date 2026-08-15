// TIMC Light — EARS coverage signal (tolerant), with per-requirement detail.
//
// Tolerant of real spec style: only list lines carrying normative language
// (shall/must/should/will/may) or an EARS trigger (When/While/If/Where) count as
// requirements; leading labels (`**AC1** —`, `REQ-001:`) are stripped; coverage accepts
// shall/must with any subject. Each requirement is also returned with a per-line detail
// (pattern label + pass/warn/fail status + score) so the UI can render the EARS analysis.

const STRONG = /\b(?:shall|must)\b/i;
const NORMATIVE = /\b(?:shall|must|should|will|may)\b/i;

const PATTERN_LABEL = {
  ubiquitous: 'UBIQUITOUS',
  eventDriven: 'EVENT-DRIVEN',
  stateDriven: 'WHILE-DO',
  unwanted: 'IF-THEN',
  optional: 'WHERE',
};

// Vague language that makes an otherwise-matched requirement ambiguous (→ warn).
const VAGUE = /\b(?:relevant|appropriate|appropriately|as needed|as required|etc|reasonable|user-friendly|robust|efficient|efficiently|gracefully|properly|adequate|adequately|several|some|many)\b/i;

// Sections that do NOT hold functional requirements. Bullets under these headings must never
// be scored as EARS requirements — otherwise a MORE complete spec (with NFRs, tests, acceptance
// criteria, dependencies) scores LOWER, which is backwards. `non-functional` guards the NFR
// subsection; `functional requirements` / `ears` headings are the ones we DO scan.
const EXCLUDED_HEADING =
  /\b(?:scope|objective|bdd|gherkin|scenario|scenarios|example\s*map|test\s*strategy|test\s*plan|testing|pr\s*breakdown|pull\s*request|dependenc\w*|acceptance\s*criteria|decision\s*log|delivery\s*surface|integration|formatting|non-?functional)\b/i;

// Example-Map labels ("Happy path:", "Edge case:", "Failure case:", "Rule:") are prose, not
// requirements, even though they carry trigger words like "when"/"if".
const NONREQ_LABEL = /^(?:happy\s*path|edge\s*case|failure\s*case|rule)\b/i;

function headingLevel(trimmedLine) {
  const m = /^(#{1,6})\s/.exec(trimmedLine);
  return m ? m[1].length : 0;
}

function stripListMarker(line) {
  return line.replace(/^\s*(?:[-*]|\d+[.)]) */, '');
}

function stripReqLabel(s) {
  return s
    .replace(/^\*{0,2}(?:REQ|AC|NFR|FR|US)[-\s.]?\d+[\w.-]*\*{0,2}\s*[—:.)-]*\s*/i, '')
    .replace(/^\*{0,2}\s*/, '');
}

function normalize(line) {
  return stripReqLabel(stripListMarker(line.trim()));
}

function isListItem(trimmedLine) {
  return /^(?:[-*]|\d+[.)]) /.test(trimmedLine);
}

/** A list line is a requirement only if it carries normative or trigger language. */
export function isRequirement(line) {
  const s = normalize(line);
  return NORMATIVE.test(s) || /^(?:when|while|if|where)\b/i.test(s);
}

/** Returns the matched EARS pattern key, or null for a non-EARS requirement. */
export function classifyRequirement(line) {
  const s = normalize(line);
  if (/^if\b.+/i.test(s) && STRONG.test(s)) return 'unwanted';
  if (/^when\b.+/i.test(s) && STRONG.test(s)) return 'eventDriven';
  if (/^while\b.+/i.test(s) && STRONG.test(s)) return 'stateDriven';
  if (/^where\b.+/i.test(s) && STRONG.test(s)) return 'optional';
  if (STRONG.test(s)) return 'ubiquitous';
  return null;
}

/** Per-requirement detail for the EARS analysis view. */
function requirementDetail(line, lineNo) {
  const text = normalize(line);
  const pattern = classifyRequirement(line);
  const vague = VAGUE.test(text);
  let status;
  let score;
  if (pattern && !vague) {
    status = 'pass';
    score = 92;
  } else if (pattern && vague) {
    status = 'warn';
    score = 70;
  } else {
    status = 'fail';
    score = 38;
  }
  return {
    line: lineNo,
    text: text.slice(0, 160),
    pattern: pattern ? PATTERN_LABEL[pattern] : 'NOT DETECTED',
    status,
    score,
  };
}

function nonEarsFinding(trimmed, line) {
  return { line, message: `Requirement not in EARS format: "${normalize(trimmed).slice(0, 60)}"`, severity: 'warning' };
}

/** Maintain the heading-nesting stack, marking sections that don't hold requirements. */
function updateHeadingStack(stack, level, trimmed) {
  while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
  stack.push({ level, excluded: EXCLUDED_HEADING.test(trimmed) });
}

/** A list line is scored only if it's a requirement outside an excluded section, not a checkbox
 *  acceptance-criterion, and not an example-map label. */
function isScorableRequirement(trimmed, stack) {
  if (!isListItem(trimmed) || !isRequirement(trimmed)) return false;
  if (stack.some((f) => f.excluded)) return false; // inside an excluded section
  if (/^[-*]\s*\[[ xX]\]/.test(trimmed)) return false; // acceptance-criteria checkbox
  if (NONREQ_LABEL.test(normalize(trimmed))) return false; // example-map label
  return true;
}

/**
 * Scores EARS coverage over the requirement lines in a Markdown document.
 * score = (EARS-covered requirements / total requirements) × 100.
 */
export function scoreEarsCoverage(markdown) {
  if (markdown.trim() === '') {
    return { signalId: 'ears-coverage', type: 'ears-coverage', score: 100, findings: [], canResolve: false, requirements: [] };
  }

  const lines = markdown.split('\n');
  const findings = [];
  const requirements = [];
  let total = 0;
  let covered = 0;

  let inFence = false;
  const stack = []; // heading nesting: { level, excluded }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Never scan inside fenced code blocks (gherkin, bash, commit messages, etc.).
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Track heading nesting so we can exclude whole non-requirement sections (incl. the
    // NFR subsection nested under Technical Design).
    const level = headingLevel(trimmed);
    if (level > 0) {
      updateHeadingStack(stack, level, trimmed);
      continue;
    }

    if (!isScorableRequirement(trimmed, stack)) continue;

    total++;
    requirements.push(requirementDetail(trimmed, i + 1));
    if (classifyRequirement(trimmed) !== null) covered++;
    else findings.push(nonEarsFinding(trimmed, i + 1));
  }

  if (total === 0) {
    return { signalId: 'ears-coverage', type: 'ears-coverage', score: 100, findings: [], canResolve: false, requirements: [] };
  }

  return { signalId: 'ears-coverage', type: 'ears-coverage', score: (covered / total) * 100, findings, canResolve: false, requirements };
}
