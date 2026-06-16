// TIMC Light — JSON structural quality signal
// Ported from CCQG src/timc-light/signals/json-quality.ts per spec S35 §3.3.
//
// FIX vs. the CCQG source: the valid-document path computed
//   canResolve = compositeScore < 70
// which is inverted. Per S35 §3.3 ("canResolve is false if composite score < 70,
// triggering the upgrade CTA") and the BDD scenarios (score exactly 70 → canResolve
// true, no CTA; score below 70 → CTA), a passing score must make the signal resolvable.
// Corrected to: canResolve = compositeScore >= 70.

const WEIGHTS = { parseability: 0.30, nullDensity: 0.25, keyConsistency: 0.20, nestingDepth: 0.15, envelopeShape: 0.10 };

function countPrimitives(value) {
  if (value === null) return { total: 1, nulls: 1 };
  if (Array.isArray(value)) {
    let total = 0, nulls = 0;
    for (const item of value) { const c = countPrimitives(item); total += c.total; nulls += c.nulls; }
    return { total, nulls };
  }
  if (typeof value === 'object') {
    let total = 0, nulls = 0;
    for (const v of Object.values(value)) { const c = countPrimitives(v); total += c.total; nulls += c.nulls; }
    return { total, nulls };
  }
  return { total: 1, nulls: 0 };
}

function maxDepth(value, current = 0) {
  if (value === null || typeof value !== 'object') return current;
  if (Array.isArray(value)) {
    if (value.length === 0) return current + 1;
    return Math.max(...value.map(i => maxDepth(i, current + 1)));
  }
  const keys = Object.keys(value);
  if (keys.length === 0) return current + 1;
  return Math.max(...keys.map(k => maxDepth(value[k], current + 1)));
}

function findFirstArrayOfObjects(parsed) {
  const isObjArr = (v) => Array.isArray(v) && v.length > 0 &&
    v.every(i => i !== null && typeof i === 'object' && !Array.isArray(i));
  if (isObjArr(parsed)) return parsed;
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    for (const val of Object.values(parsed)) if (isObjArr(val)) return val;
  }
  return null;
}

function computeKeyConsistency(arr) {
  if (arr.length === 0) return 100;
  const keyFreq = new Map();
  for (const item of arr) for (const key of Object.keys(item)) keyFreq.set(key, (keyFreq.get(key) ?? 0) + 1);
  const threshold = arr.length * 0.5;
  const modalKeys = new Set();
  for (const [key, count] of keyFreq.entries()) if (count > threshold) modalKeys.add(key);
  if (modalKeys.size === 0) return 100;
  let totalScore = 0;
  for (const item of arr) {
    const itemKeys = new Set(Object.keys(item));
    let common = 0;
    for (const mk of modalKeys) if (itemKeys.has(mk)) common++;
    totalScore += (common / modalKeys.size) * 100;
  }
  return totalScore / arr.length;
}

/** Returns a SignalResult with a 0–100 composite score and a 5-dimension breakdown. */
export function scoreJsonQuality(content) {
  const findings = [];
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      signalId: 'json-quality', type: 'json-quality', score: 0,
      findings: [{ message: 'Invalid JSON', severity: 'error' }], canResolve: true,
      breakdown: { parseability: 0, nullDensity: 0, keyConsistency: 0, nestingDepth: 0, envelopeShape: 0 },
    };
  }

  const parseability = 100;

  const pc = countPrimitives(parsed);
  const nullDensity = pc.total === 0 ? 100 : (1 - pc.nulls / pc.total) * 100;

  const arrOfObjs = findFirstArrayOfObjects(parsed);
  const keyConsistency = arrOfObjs === null ? 100 : computeKeyConsistency(arrOfObjs);

  const depth = maxDepth(parsed, 0);
  const nestingDepth = Math.max(0, Math.min(100, 100 - (depth - 5) * 20));

  let envelopeShape = 0;
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if ('data' in parsed || 'errors' in parsed || 'meta' in parsed) envelopeShape = 100;
  }

  const compositeScore =
    parseability   * WEIGHTS.parseability   +
    nullDensity    * WEIGHTS.nullDensity    +
    keyConsistency * WEIGHTS.keyConsistency +
    nestingDepth   * WEIGHTS.nestingDepth   +
    envelopeShape  * WEIGHTS.envelopeShape;

  const canResolve = compositeScore >= 70; // FIX: CCQG source had `< 70` (inverted)

  if (nullDensity < 60) findings.push({ message: 'High null density detected — response contains too many null values', severity: 'warning' });
  if (keyConsistency < 60) findings.push({ message: 'Inconsistent keys across array items', severity: 'warning' });
  if (nestingDepth < 60) findings.push({ message: 'Nesting depth exceeds recommended maximum of 5', severity: 'warning' });
  if (envelopeShape === 0) findings.push({ message: 'Response lacks standard API envelope (data/errors/meta)', severity: 'info' });

  return {
    signalId: 'json-quality', type: 'json-quality', score: compositeScore, findings, canResolve,
    breakdown: { parseability, nullDensity, keyConsistency, nestingDepth, envelopeShape },
  };
}
