/**
 * requireAuth(authPort) → Fastify preHandler.
 *
 * Reads Authorization: Bearer <token>, calls authPort.validateSessionToken,
 * attaches req.user or replies 401. SRP: only auth gating.
 */
"use strict";

const BEARER_RE = /^Bearer\s+(.+)$/i;

function extractToken(headerValue) {
  if (!headerValue) return null;
  const m = String(headerValue).match(BEARER_RE);
  return m ? m[1].trim() : null;
}

function requireAuth(authPort) {
  return async (req, reply) => {
    const token = extractToken(req.headers.authorization);
    if (!token) return reply.code(401).send({ error: "missing_token" });
    const user = await authPort.validateSessionToken(token);
    if (!user) return reply.code(401).send({ error: "invalid_token" });
    req.user = user;
  };
}

module.exports = requireAuth;
