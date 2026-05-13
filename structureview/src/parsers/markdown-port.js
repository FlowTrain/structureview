/**
 * Markdown ParserPort — ADR-0005 conformant.
 *
 * Delegates parsing + rendering to `marked` (already in dependencies).
 * Outline is built from heading tokens: depth = heading.depth - 1, so
 * H1 → depth 0, H2 → depth 1, etc.  Flat list — heading nesting is
 * conveyed by depth, not by children (so a heading-only TOC renders
 * naturally without forcing strict hierarchy assumptions).
 */
'use strict';

const { lexer, parse: markedParse } = require('marked');

function parse(raw) {
  return { type: 'md', value: lexer(raw || ''), raw };
}

function outline(doc) {
  if (!doc || !Array.isArray(doc.value)) return [];
  return doc.value
    .filter((t) => t.type === 'heading')
    .map((t) => ({ label: t.text, depth: t.depth - 1 }));
}

function render(doc) {
  return markedParse(doc.raw || '');
}

module.exports = {
  id: 'md',
  extensions: ['md', 'markdown'],
  parse,
  outline,
  render,
};
