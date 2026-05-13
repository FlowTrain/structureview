/**
 * ParserRegistry — keyed lookup from file extension to ParserPort.
 * OCP: adding a parser = one register() call. Registry code never changes.
 */
'use strict';

const { validateParserPort } = require('./parser-port');

function normaliseExt(raw) {
  return String(raw).toLowerCase().replace(/^\./, '');
}

function createRegistry() {
  const byId = new Map();
  const byExt = new Map();

  function register(port) {
    validateParserPort(port);
    if (byId.has(port.id)) {
      throw new Error(`ParserPort id "${port.id}" already registered`);
    }
    for (const ext of port.extensions) {
      const key = normaliseExt(ext);
      if (byExt.has(key)) {
        throw new Error(`ParserPort extension "${key}" already claimed by "${byExt.get(key).id}"`);
      }
    }
    byId.set(port.id, port);
    for (const ext of port.extensions) {
      byExt.set(normaliseExt(ext), port);
    }
    return port;
  }

  function resolveByExt(ext) {
    return byExt.get(normaliseExt(ext)) || null;
  }

  function all() {
    return [...byId.values()];
  }

  return { register, resolveByExt, all };
}

module.exports = { createRegistry };
