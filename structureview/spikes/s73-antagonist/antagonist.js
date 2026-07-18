'use strict';

const fs = require('fs');
const path = require('path');

// Antagonist spike — main-process LLM caller.
//
// Runs the generator's model call in the main process so the provider endpoint/credentials
// stay out of the renderer (matches the S73 boundary) and so localhost calls dodge CORS.
//
// Spike scope: a single OpenAI-compatible chat endpoint (Ollama / LemonAid / any
// CCQG_GENERIC_ENDPOINT). The full ai.providers + ai.models registry, KeyVault credentialRef
// resolution, managed-identity auth, and node-pty terminals are deferred to the S73
// implementation PRs (Phase A / Phase B).

const DEFAULT_ENDPOINT =
  process.env.CCQG_GENERIC_ENDPOINT || 'http://localhost:11434/v1/chat/completions';
const DEFAULT_MODEL = process.env.CCQG_GENERIC_MODEL || 'llama3.1';

/**
 * Call an OpenAI-compatible chat-completions endpoint.
 * @param {{endpoint?:string, model?:string, messages?:Array, temperature?:number}} opts
 * @returns {Promise<{ok:true, content:string, model:string, endpoint:string} | {ok:false, message:string}>}
 */
async function generate(opts = {}) {
  const url = opts.endpoint || DEFAULT_ENDPOINT;
  const model = opts.model || DEFAULT_MODEL;
  const body = {
    model,
    messages: Array.isArray(opts.messages) ? opts.messages : [],
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2,
    stream: false,
    // llama.cpp extension: reuse the KV cache for a shared prefix. Our governance system prompt
    // is a stable prefix across iterations, so this makes the ~4K opening free after the first
    // call — only the changing spec/feedback tail is re-evaluated. Ignored by providers that
    // don't support it (harmless on local llama.cpp / Lemonade, which is the target here).
    cache_prompt: true,
  };

  const headers = { 'Content-Type': 'application/json' };
  const token = process.env.CCQG_GENERIC_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, message: `HTTP ${res.status} from ${url}: ${text.slice(0, 300)}` };
    }
    const data = await res.json();
    // OpenAI shape first, Ollama native shape as a fallback.
    const content = data?.choices?.[0]?.message?.content ?? data?.message?.content ?? '';
    if (!content) return { ok: false, message: 'Provider returned an empty completion.' };
    return { ok: true, content, model, endpoint: url };
  } catch (err) {
    return { ok: false, message: `${err.message} (endpoint: ${url})` };
  }
}

// Governance the generator runs under (CCQG's "agent runs under a QMS + CoC" model).
// Per AGENTS.md §8 (Delivery by Tool), a local BYOM provider (DeepSeek / Ollama / Lemonade) is
// governed by CLAUDE.md — the self-contained doc carrying both the QMS and the CoC (§6) inline.
// That's the correct source here (the SOUL.md + AGENTS.md split is the Codex / Claude-Code path),
// and it's leaner (~3.9K vs ~6.1K tokens). Override with ANTAGONIST_GOVERNANCE (';'-separated).
// spec-instructions.md is deliberately excluded — at ~9.7K tokens it would blow the 16K window;
// the TIMC Light critic enforces the format instead.
const DEFAULT_GOVERNANCE = process.env.ANTAGONIST_GOVERNANCE
  ? process.env.ANTAGONIST_GOVERNANCE.split(';').map((s) => s.trim()).filter(Boolean)
  : ['C:\\Users\\JamesGifford\\Quality and Testing\\CLAUDE.md'];

/**
 * Read the governance docs and concatenate them for use as a system prompt.
 * @param {string[]} [paths]
 * @returns {{text:string, files:Array<{path:string, ok:boolean, bytes?:number, message?:string}>, approxTokens:number}}
 */
function loadGovernance(paths = DEFAULT_GOVERNANCE) {
  const files = [];
  const parts = [];
  for (const p of paths) {
    try {
      const text = fs.readFileSync(p, 'utf8');
      files.push({ path: p, ok: true, bytes: Buffer.byteLength(text) });
      parts.push(`# ===== ${path.basename(p)} (governance) =====\n\n${text}`);
    } catch (err) {
      files.push({ path: p, ok: false, message: err.message });
    }
  }
  const text = parts.join('\n\n');
  return { text, files, approxTokens: Math.round(Buffer.byteLength(text) / 4) };
}

module.exports = { generate, loadGovernance, DEFAULT_ENDPOINT, DEFAULT_MODEL, DEFAULT_GOVERNANCE };
