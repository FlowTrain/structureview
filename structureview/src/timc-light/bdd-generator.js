// TIMC Light — deterministic BDD generator.
//
// Implements the non-LLM portion of the CCQG S39 bdd-scenario-generator skill pipeline:
// parse Job Stories ("When <situation>, I want to <motivation>, so I can <outcome>") and
// map situation→Given, motivation→When, outcome→Then; when there are none, fall back to
// acceptance criteria. Richer phrasing / edge-case reasoning / step definitions are where
// the LLM skill adds value — this scaffold is the structural starting point it would refine.

function clean(s) {
  return s.replace(/\s+/g, ' ').replace(/[*_`>]/g, '').trim();
}

function asRole(situation) {
  const s = clean(situation)
    .replace(/^I am\s+/i, '')
    .replace(/^I\s+/i, '');
  return s.length > 60 ? 'user' : s;
}

function extractACs(markdown) {
  const lines = markdown.split('\n');
  const acs = [];
  // 1) Explicitly labelled criteria anywhere (AC01, REQ-3, ...)
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s*(?:\[[ x]\]\s*)?\*{0,2}(AC\s?\d+|REQ-?\d+)\*{0,2}\s*[—:.\-]*\s*(.+)$/i);
    if (m) acs.push({ id: m[1].replace(/\s/g, ''), text: clean(m[2]) });
  }
  if (acs.length) return acs;
  // 2) Fallback: bullets under an "Acceptance Criteria" heading
  let inSection = false;
  let n = 0;
  for (const line of lines) {
    if (/^#{1,4}\s/.test(line)) {
      inSection = /acceptance criteria/i.test(line);
    } else if (inSection && /^\s*[-*]\s+\S/.test(line)) {
      n++;
      acs.push({ id: `AC${String(n).padStart(2, '0')}`, text: clean(line.replace(/^\s*[-*]\s+/, '')) });
    }
  }
  return acs.slice(0, 15);
}

/**
 * @returns {{ jobStories: object[], acceptanceCriteria: object[], gherkin: string }}
 */
export function generateBdd(markdown) {
  const flat = markdown.replace(/[>*_"`]/g, '').replace(/\s+/g, ' ');
  const jobStories = [];
  const re = /when\s+(.+?)[\s,—–-]+i want to\s+(.+?)[\s,—–-]+so (?:i can|that i can|that)\s+(.+?)[.]/gi;
  let m;
  while ((m = re.exec(flat)) !== null) {
    jobStories.push({ situation: clean(m[1]), motivation: clean(m[2]), outcome: clean(m[3]) });
  }

  const acceptanceCriteria = jobStories.length === 0 ? extractACs(markdown) : [];

  const blocks = jobStories.length
    ? jobStories.map((js, i) => {
        const ac = `AC${String(i + 1).padStart(2, '0')}`;
        return `  Scenario: ${ac} — ${js.motivation.slice(0, 60)}\n    Given ${js.situation}\n    When I ${js.motivation}\n    Then I can ${js.outcome}`;
      })
    : acceptanceCriteria.map(
        (c) => `  Scenario: ${c.id} — ${c.text.slice(0, 60)}\n    Given the system is ready\n    When the ${c.id} behaviour is exercised\n    Then ${c.text.slice(0, 90)}`
      );

  const title = (markdown.match(/^#\s+(.+)$/m)?.[1] || 'Generated specification').trim();
  const lead = jobStories[0];

  const gherkin = `Feature: ${clean(title)}
${lead ? `  As a ${asRole(lead.situation)}\n  I want to ${lead.motivation}\n  So that I can ${lead.outcome}\n` : ''}
  Background:
    Given the system is initialised

${blocks.join('\n\n')}

  Scenario Outline: ${lead ? lead.motivation.slice(0, 40) : 'behaviour'} with edge case <edge_case>
    Given the system is in state <state>
    When I provide <input>
    Then the result is <expected_outcome>

    Examples:
      | edge_case    | state   | input         | expected_outcome |
      | null input   | ready   | null          | validation_error |
      | boundary max | ready   | MAX_VALUE     | accepted         |
      | unauthorised | ready   | invalid_token | auth_error       |
      | duplicate    | pending | repeated      | idempotent_ok    |
`;

  return { jobStories, acceptanceCriteria, gherkin };
}
