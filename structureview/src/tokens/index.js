/**
 * StructureView design tokens — FlowTrain brand identity.
 *
 * Single source of truth for colours, typography, spacing, radii, and motion.
 * Consumed by:
 *   - The Electron renderer (via toCssVariables() injected as <style>)
 *   - Future SaaS frontend (via JS imports)
 *
 * CCQG: SRP. Tokens only. No layout, no components, no logic.
 * Brand values traced to StructureView Brief, Visual Identity section.
 */
'use strict';

const colors = {
  brand: {
    primary: '#2BAEE4', // FlowTrain Blue — active states
    accent: '#F0C050', // Gold — syntax accents, JSON highlights
    warning: '#D44030', // Steam Red — warnings, alerts
  },
  bg: {
    deep: '#0a0a0f', // load-bearing dark theme background
    card: '#12121a', // panel / card surface
  },
  fg: {
    primary: '#E8E8EE',
    muted: '#8C8C99',
  },
};

const fonts = {
  mono: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const radii = { sm: 4, md: 8, lg: 12 };
const motion = { instant: 0, fast: 120, base: 200, slow: 320 };

function flatten(obj, prefix) {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flatten(value, `${prefix}-${key}`)
      : [[`${prefix}-${key}`, value]]
  );
}

function toCssVariables() {
  const colorLines = flatten(colors, '--sv-color').map(([k, v]) => `  ${k}: ${v};`);
  const fontLines = Object.entries(fonts).map(([k, v]) => `  --sv-font-${k}: ${v};`);
  const spaceLines = Object.entries(spacing).map(([k, v]) => `  --sv-space-${k}: ${v}px;`);
  const radiusLines = Object.entries(radii).map(([k, v]) => `  --sv-radius-${k}: ${v}px;`);
  const motionLines = Object.entries(motion).map(([k, v]) => `  --sv-motion-${k}: ${v}ms;`);
  const lines = [...colorLines, ...fontLines, ...spaceLines, ...radiusLines, ...motionLines];
  return `:root {\n${lines.join('\n')}\n}\n`;
}

module.exports = { colors, fonts, spacing, radii, motion, toCssVariables };
