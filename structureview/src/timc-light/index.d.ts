// Type declarations for @trainyard/timc-light — consumed by TypeScript apps
// (e.g. the Train Yard web platform's StructureView page).

export type DocumentType = 'markdown-spec' | 'json-response' | 'unknown';
export type Severity = 'info' | 'warning' | 'error';
export type SignalType = 'ears-coverage' | 'json-quality' | 'section-completeness' | 'bdd-coverage';

export interface Finding {
  /** 1-based line number (markdown signals). */
  line?: number;
  /** JSON path to the problem (json-quality). */
  path?: string;
  message: string;
  severity: Severity;
}

export interface SignalResult {
  signalId: string;
  type: SignalType;
  /** 0–100. */
  score: number;
  findings: Finding[];
  /** false = the signal cannot be resolved by TIMC Light and should surface the upgrade CTA. */
  canResolve: boolean;
  /** Signal-specific numeric breakdown (dimensions, present/total, scenarios/wellFormed…). */
  breakdown?: Record<string, number>;
}

export interface EngineOutput {
  documentType: DocumentType;
  signals: SignalResult[];
  /** 0–100 — blend of all signals for the document. */
  aggregateScore: number;
  shouldShowCTA: boolean;
}

export interface JsonQualityBreakdown {
  parseability: number;
  nullDensity: number;
  keyConsistency: number;
  nestingDepth: number;
  envelopeShape: number;
}

/** Detect type and dispatch all applicable signals. */
export function analyse(content: string, mimeHint?: string): EngineOutput;
export function detectDocumentType(content: string, mimeHint?: string): DocumentType;

export function scoreEarsCoverage(markdown: string): SignalResult;
export function classifyRequirement(line: string): string | null;
export function isRequirement(line: string): boolean;

export function scoreJsonQuality(content: string): SignalResult & { breakdown: JsonQualityBreakdown };
export function scoreSectionCompleteness(markdown: string): SignalResult & { breakdown: { present: number; total: number } };
export function scoreBddCoverage(markdown: string): SignalResult & { breakdown: { scenarios: number; wellFormed: number } };
