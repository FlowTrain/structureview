// TIMC Light — signal engine
// Ported from CCQG src/timc-light/engine.ts per spec S35 §3.1.
// Pure ESM, no framework deps: runs in the Electron renderer, the React bundle, and Node.
//
// FIX vs. the CCQG source: shouldShowCTA was `signals.some(s => !s.canResolve)`.
// Because the EARS signal's canResolve is always false (S35 §3.2), that made every
// Markdown document trigger the CTA — including fully EARS-covered docs, which the BDD
// scenario "full health bar when all requirements are EARS-covered" says must NOT show a
// CTA. Corrected so the CTA fires only when an unresolved signal has an actual finding.

import { scoreEarsCoverage } from './signals/ears-coverage.js';
import { scoreJsonQuality } from './signals/json-quality.js';

/** @returns {'markdown-spec'|'json-response'|'unknown'} */
export function detectDocumentType(content, mimeHint) {
  if (mimeHint !== undefined) {
    if (mimeHint === 'application/json' || mimeHint === 'json') return 'json-response';
    if (mimeHint === 'text/markdown' || mimeHint === 'markdown' || mimeHint === 'md') return 'markdown-spec';
  }
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json-response';
  if (/## /.test(content) || /- \[ \]/.test(content)) return 'markdown-spec';
  return 'unknown';
}

/**
 * Analyse a document and return TIMC Light signals.
 * @returns {{documentType:string, signals:object[], aggregateScore:number, shouldShowCTA:boolean}}
 */
export function analyse(content, mimeHint) {
  const documentType = detectDocumentType(content, mimeHint);

  if (documentType === 'unknown') {
    return { documentType, signals: [], aggregateScore: 100, shouldShowCTA: false };
  }

  let signals = [];
  if (documentType === 'json-response') {
    const r = scoreJsonQuality(content);
    signals = [{ signalId: r.signalId, type: r.type, score: r.score, findings: r.findings, canResolve: r.canResolve, breakdown: r.breakdown }];
  } else if (documentType === 'markdown-spec') {
    signals = [scoreEarsCoverage(content)];
  }

  const aggregateScore = signals.length === 0
    ? 100
    : signals.reduce((sum, s) => sum + s.score, 0) / signals.length;

  const shouldShowCTA = signals.some(s => !s.canResolve && s.findings.length > 0);

  return { documentType, signals, aggregateScore, shouldShowCTA };
}
