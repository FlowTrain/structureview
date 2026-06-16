// TIMC Light — EARS coverage signal (tolerant)
//
// Ported from CCQG per spec S35 §3.2, then made tolerant of how real specs are written.
// S35's literal formula counts every list item as a requirement and requires lines to
// begin with the bare template ("The system shall…"). Run against the real docs/specs
// corpus that produced uniform 0% scores with hundreds of false "uncovered requirements",
// because the specs use bullets for prose/manifests and phrase requirements with varied
// subjects and requirement IDs.
//
// The "slight wiggle":
//   • Only list lines carrying normative language (shall/must/should/will/may) or an EARS
//     trigger word (When/While/If/Where) count as requirements — prose bullets do not.
//   • A leading requirement label ("**AC1** —", "REQ-001:", "NFR-03.") is stripped.
//   • EARS coverage accepts shall OR must with any subject ("the engine", "consumers",
//     "every test file"), not just "the system shall".
//   • Weak/ambiguous requirements (should/will/may, or a trigger word without a strong
//     modal) count as requirements but are flagged as not-EARS — that is the useful signal.

const STRONG = /\b(?:shall|must)\b/i;
const NORMATIVE = /\b(?:shall|must|should|will|may)\b/i;

function stripListMarker(line) {
  return line.replace(/^\s*(?:[-*]|\d+[.)]) */, '');
}

// Strip a leading requirement label like "**AC1** —", "REQ-001:", "NFR-03.", "FR1 -".
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

/**
 * Returns the matched EARS pattern key, or null for a requirement that is not in EARS form
 * (weak modal, or a trigger word that never reaches a strong shall/must).
 */
export function classifyRequirement(line) {
  const s = normalize(line);
  if (/^if\b.+/i.test(s) && STRONG.test(s)) return 'unwanted';
  if (/^when\b.+/i.test(s) && STRONG.test(s)) return 'eventDriven';
  if (/^while\b.+/i.test(s) && STRONG.test(s)) return 'stateDriven';
  if (/^where\b.+/i.test(s) && STRONG.test(s)) return 'optional';
  if (STRONG.test(s)) return 'ubiquitous';
  return null;
}

/**
 * Scores EARS coverage over the requirement lines in a Markdown document.
 * score = (EARS-covered requirements / total requirements) × 100.
 * canResolve is always false — TIMC Light can identify but not rewrite requirements (S35 §3.2).
 */
export function scoreEarsCoverage(markdown) {
  if (markdown.trim() === '') {
    return { signalId: 'ears-coverage', type: 'ears-coverage', score: 100, findings: [], canResolve: false };
  }

  const lines = markdown.split('\n');
  const findings = [];
  let total = 0;
  let covered = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!isListItem(trimmed) || !isRequirement(trimmed)) continue;
    total++;
    if (classifyRequirement(trimmed) !== null) {
      covered++;
    } else {
      findings.push({
        line: i + 1,
        message: `Requirement not in EARS format: "${normalize(trimmed).slice(0, 60)}"`,
        severity: 'warning',
      });
    }
  }

  if (total === 0) {
    return { signalId: 'ears-coverage', type: 'ears-coverage', score: 100, findings: [], canResolve: false };
  }

  return { signalId: 'ears-coverage', type: 'ears-coverage', score: (covered / total) * 100, findings, canResolve: false };
}
