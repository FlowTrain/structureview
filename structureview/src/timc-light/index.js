// @trainyard/timc-light — public API barrel.
// Single import surface consumed by the StructureView desktop app and the Train Yard
// web platform alike: `import { analyse } from '@trainyard/timc-light'`.

export { analyse, detectDocumentType } from './engine.js';
export { classifyRequirement, scoreEarsCoverage, isRequirement } from './signals/ears-coverage.js';
export { scoreJsonQuality } from './signals/json-quality.js';
export { scoreSectionCompleteness } from './signals/section-completeness.js';
export { scoreBddCoverage } from './signals/bdd-coverage.js';
