/**
 * ParserPort — the contract every format parser implements (ADR-0005).
 *
 * @typedef {Object} ParsedDoc
 * @property {string} type        Parser id ('md', 'json', etc.)
 * @property {*}      value       Parsed structured value (shape per parser)
 * @property {string} raw         Original input text
 *
 * @typedef {Object} OutlineNode
 * @property {string}        label
 * @property {number}        depth
 * @property {OutlineNode[]} [children]
 *
 * @typedef {Object} Meta
 * @property {number} [size]
 * @property {string} [modified]
 *
 * @typedef {Object} ParserPort
 * @property {string}                              id          Stable parser identifier
 * @property {string[]}                            extensions  Lower-case extensions, e.g. ['md']
 * @property {(raw: string) => ParsedDoc}          parse
 * @property {(doc: ParsedDoc) => OutlineNode[]}   outline
 * @property {(doc: ParsedDoc, meta?: Meta) => string} render  HTML string
 */
'use strict';

const REQUIRED_FNS = ['parse', 'outline', 'render'];

function validateParserPort(port) {
  if (!port || typeof port.id !== 'string' || !port.id) {
    throw new Error('ParserPort: id must be a non-empty string');
  }
  if (!Array.isArray(port.extensions) || port.extensions.length === 0) {
    throw new Error(`ParserPort[${port.id}]: extensions must be a non-empty array`);
  }
  for (const fn of REQUIRED_FNS) {
    if (typeof port[fn] !== 'function') {
      throw new Error(`ParserPort[${port.id}]: ${fn} must be a function`);
    }
  }
  return port;
}

module.exports = { validateParserPort };
