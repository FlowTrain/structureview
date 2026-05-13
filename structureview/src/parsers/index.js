/**
 * parsers/index — boot a registry pre-populated with v1.0 parsers.
 *
 * Adding a new format: import its port, call registry.register(port).
 * Per ADR-0005 (OCP) the rest of the codebase never changes.
 */
'use strict';

const { createRegistry } = require('./registry');
const jsonPort = require('./json-port');
const markdownPort = require('./markdown-port');

const registry = createRegistry();
registry.register(markdownPort);
registry.register(jsonPort);

module.exports = registry;
