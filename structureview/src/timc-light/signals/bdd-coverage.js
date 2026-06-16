// TIMC Light — BDD (Gherkin) coverage signal.
// Finds Scenario / Scenario Outline blocks and checks each has Given + When + Then.
// score = well-formed scenarios / total scenarios × 100 (0 with a finding if none exist).

export function scoreBddCoverage(markdown) {
  const lines = markdown.split('\n');
  const scenarios = [];
  let current = null;
  const push = () => {
    if (current) scenarios.push(current);
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim().replace(/^[-*>]\s*/, '');
    const head = t.match(/^(?:Scenario Outline|Scenario|Example)\s*:\s*(.*)$/i);
    if (head) {
      push();
      current = { name: head[1].slice(0, 60) || `line ${i + 1}`, line: i + 1, given: false, when: false, then: false };
    } else if (current) {
      if (/^Given\b/i.test(t)) current.given = true;
      else if (/^When\b/i.test(t)) current.when = true;
      else if (/^Then\b/i.test(t)) current.then = true;
    }
  }
  push();

  const total = scenarios.length;

  if (total === 0) {
    return {
      signalId: 'bdd-coverage',
      type: 'bdd-coverage',
      score: 0,
      findings: [{ message: 'No Gherkin scenarios found (Scenario / Given-When-Then)', severity: 'warning' }],
      canResolve: true,
      breakdown: { scenarios: 0, wellFormed: 0 },
    };
  }

  const findings = [];
  let wellFormed = 0;
  for (const s of scenarios) {
    if (s.given && s.when && s.then) {
      wellFormed++;
    } else {
      const missing = [!s.given && 'Given', !s.when && 'When', !s.then && 'Then'].filter(Boolean).join('/');
      findings.push({ line: s.line, message: `Scenario missing ${missing}: "${s.name}"`, severity: 'warning' });
    }
  }

  return {
    signalId: 'bdd-coverage',
    type: 'bdd-coverage',
    score: (wellFormed / total) * 100,
    findings,
    canResolve: true,
    breakdown: { scenarios: total, wellFormed },
  };
}
