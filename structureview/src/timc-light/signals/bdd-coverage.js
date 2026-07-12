// TIMC Light — BDD (Gherkin) coverage signal.
// Finds Scenario / Scenario Outline blocks and checks each has Given + When + Then.
// score = well-formed scenarios / total scenarios × 100 (0 with a finding if none exist).

export function scoreBddCoverage(markdown) {
  const lines = markdown.split('\n');
  const scenarios = [];
  let current = null;
  let mode = null; // 'background' | 'scenario'
  let bgGiven = false; // does the current Feature's Background declare a Given?
  const push = () => {
    if (current) scenarios.push(current);
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim().replace(/^[-*>]\s*/, '');

    // A Background Given is shared by every scenario in the Feature; reset it per Feature.
    if (/^Feature\s*:/i.test(t)) {
      push();
      current = null;
      mode = null;
      bgGiven = false;
      continue;
    }
    if (/^Background\s*:/i.test(t)) {
      push();
      current = null;
      mode = 'background';
      continue;
    }

    const head = t.match(/^(?:Scenario Outline|Scenario|Example)\s*:\s*(.*)$/i);
    if (head) {
      push();
      current = { name: head[1].slice(0, 60) || `line ${i + 1}`, line: i + 1, given: false, when: false, then: false, bgGiven };
      mode = 'scenario';
      continue;
    }

    if (/^Given\b/i.test(t)) {
      if (mode === 'background') bgGiven = true;
      else if (current) current.given = true;
    } else if (/^When\b/i.test(t)) {
      if (current) current.when = true;
    } else if (/^Then\b/i.test(t)) {
      if (current) current.then = true;
    }
  }
  push();

  // Precision: ignore prose lines that merely contain 'Scenario:'/'Example:' —
  // a real Gherkin scenario has at least one Given/When/Then step of its own.
  const real = scenarios.filter((s) => s.given || s.when || s.then);
  const total = real.length;

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
  for (const s of real) {
    const hasGiven = s.given || s.bgGiven; // a Feature Background Given satisfies the scenario
    if (hasGiven && s.when && s.then) {
      wellFormed++;
    } else {
      const missing = [!hasGiven && 'Given', !s.when && 'When', !s.then && 'Then'].filter(Boolean).join('/');
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
