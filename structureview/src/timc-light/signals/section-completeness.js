// TIMC Light — spec section-completeness signal.
// Checks a spec document against the 10 canonical required sections defined in
// spec-instructions.md §3 (Objective, Scope, Technical Design, BDD Scenarios, Test
// Strategy, PR Breakdown, Dependencies, Acceptance Criteria, Decision Log, Delivery
// Surface & Integration). Evidence is a matching heading; score = present / 10 × 100.

const REQUIRED_SECTIONS = [
  { label: 'Objective', re: /objective/i },
  { label: 'Scope', re: /\bscope\b/i },
  { label: 'Technical Design', re: /technical design|\bdesign\b/i },
  { label: 'BDD Scenarios', re: /\bbdd\b|gherkin|scenarios/i },
  { label: 'Test Strategy', re: /test strategy|test plan|testing/i },
  { label: 'PR Breakdown', re: /pr breakdown|pull request|\bPRs?\b/i },
  { label: 'Dependencies', re: /dependenc/i },
  { label: 'Acceptance Criteria', re: /acceptance criteria/i },
  { label: 'Decision Log', re: /decision log/i },
  { label: 'Delivery Surface & Integration', re: /delivery surface|integration handoff/i },
];

export function scoreSectionCompleteness(markdown) {
  // Only headings count as evidence that a section exists.
  const headings = markdown.split('\n').filter((l) => /^#{1,4}\s/.test(l.trim()));
  const haystack = headings.join('\n');

  const findings = [];
  const sections = [];
  let present = 0;
  for (const section of REQUIRED_SECTIONS) {
    const ok = section.re.test(haystack);
    sections.push({ label: section.label, present: ok });
    if (ok) {
      present++;
    } else {
      findings.push({ message: `Missing required section: ${section.label}`, severity: 'warning' });
    }
  }

  const total = REQUIRED_SECTIONS.length;
  return {
    signalId: 'section-completeness',
    type: 'section-completeness',
    score: (present / total) * 100,
    findings,
    canResolve: true, // informational — does not trigger the upgrade CTA
    breakdown: { present, total },
    sections,
  };
}
