# Dual-Terminal / Dual-LLM Quality Antagonist — Technical Design

**Relates to:** S73 §3.5, §3.6, §3.7 · PR 3 + PR 4  
**Status:** Design draft — open questions resolved, ready for implementation spike  
**Reads:** `CLAUDE.md` (§7 quality gates, §9 local endpoints), `.claude/soul.md` (CCQG persona and adversarial mandate)

---

## 1. Mental model

The antagonist surface is a **two-lane quality loop hosted inside StructureView**.
One lane generates; the other tears it apart.

```
┌─────────────────────────────────────────────────────────┐
│                  /structureview — Antagonist workspace   │
│                                                         │
│  ┌──────────────────────┐   artifact   ┌─────────────────┐│
│  │  Generator terminal  │ ──handoff──▶ │ Critic terminal ││
│  │  (xterm.js + PTY)   │              │ (xterm.js + PTY)││
│  └──────────────────────┘              └─────────────────┘│
│                 │                             │           │
│                 └──────────┬──────────────────┘           │
│                            ▼                              │
│              ┌─────────────────────────┐                  │
│              │  Quality verdict panel  │                  │
│              │  TIMC Light + gate pass │                  │
│              └─────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

The two sessions share **one artifact buffer** — a typed `ArtifactHandoff` record.
The critic never reads terminal text; it reads the structured record.
This keeps the critique testable and provider-agnostic.

---

## 2. Resolved open questions

### 2.1 Providers: local-only or mixed?

**Decision: mixed, user-configured via S72 settings.**

| Role      | Default                                    | Override                |
| --------- | ------------------------------------------ | ----------------------- |
| Generator | Local (`CCQG_GENERIC_ENDPOINT` → LemonAid) | Any configured provider |
| Critic    | Stronger cloud model (`backend-client.js`) | Local if user pins it   |

Rationale from `CLAUDE.md §9`: `CCQG_GENERIC_ENDPOINT` is already the hook for local models. LemonAid exposes an OpenAI-compatible `/v1/chat/completions` endpoint, so it fits the provider abstraction with zero protocol work. The critic benefits from a stronger model because its job is adversarial and rubric-bound — running a weaker local model as critic undermines the gate. The user can override both roles in S72 settings. No hardcoded endpoints anywhere in renderer code.

**LemonAid specifics (`AI_Code_Generation_Quality_Comparison_Experiment.md`):**

- Serves via AMD ROCm (RX 9060 XT 16 GB VRAM, 32 GB RAM)
- OpenAI-compatible REST: `/v1/chat/completions`, `/v1/models`
- Best local candidates within VRAM budget: DeepSeek Coder V2 Lite (16B MoE, full VRAM), Qwen 3.5 Coder 32B at Q4_K_M (split to system RAM, ~2–3× latency penalty but far better spec adherence)
- For the generator role (speed matters more): DeepSeek V2 Lite
- For a local critic role: Qwen 3.5 32B (better context retention, slower)

### 2.2 Loop mode: automated or human-in-the-loop?

**Decision: human-in-the-loop first, automated loop as an opt-in setting.**

Default flow:

```
Generate → [user sees artifact + verdict] → Approve / Reject / Regenerate
```

Opt-in automated mode (controlled by S72 `antagonist.autoLoop`):

```
Generate → Critique → [if fail and loop < maxLoops] → Regenerate → …
```

`maxLoops` defaults to 3 (configurable). The loop halts and surfaces the artifact + all critique turns regardless of whether it converged. Rationale: the experiment doc shows models require 1–5 iterations; capping at 3 is a safe default that avoids runaway spend on a broken spec.

The UI exposes both a "Run one turn" button and an "Auto-loop (max N)" toggle. Loop state and all intermediate artifacts are preserved in the handoff history so the user can audit the convergence path.

### 2.3 How tightly does the critic bind to the gates?

**Decision: in-process engine call, not a subprocess.**

The critic calls `@trainyard/timc-light.analyse(artifact)` **in the renderer** (same as the authoring surface), then passes the structured `TIMCResult` into the critic LLM prompt as machine-readable context. The critic LLM adds narrative verdict and remediation actions on top of the TIMC signal.

Calling `npm run quality-gate` as a subprocess is rejected because:

- It would require a PTY call from the renderer — a security violation per REQ-009/REQ-010.
- It couples the UI to repo-local tooling that may not exist in web mode.
- The Electron shell can optionally spawn `npm run quality-gate` from `src/main/index.js` and pipe the result back through the preload bridge as an optional "extended gate" step, but this is not on the hot path.

The critic LLM system prompt includes the TIMC gate thresholds verbatim from `CLAUDE.md §7` (complexity, EARS coverage, BDD coverage, section completeness, composite score). The `.claude/soul.md` adversarial persona prompt is prepended to the critic system prompt to give it the right stance.

### 2.4 Transcript capture and governance (FINRA 4511)

**Decision: emit audit events now, defer retention storage.**

Per S73 §3.7 and §2.2 (out of scope): the UI emits structured `AuditEvent` records for every user-visible action. Retention storage is the governance segment's problem. The antagonist workspace labels every session as "ephemeral" until `transcript.retentionState === 'retained'` is set by the future retention store. No generated artifact is ever silently discarded — it is either committed to the handoff history or explicitly abandoned by the user.

Event schema (TypeScript):

```ts
interface AuditEvent {
  eventId: string; // uuid
  sessionId: string; // antagonist session
  artifactId: string; // handoff record id
  action:
    | 'generated'
    | 'critiqued'
    | 'regenerated'
    | 'accepted'
    | 'exported'
    | 'abandoned'
    | 'provider_failed';
  artifactKind: ArtifactKind;
  providerRole: 'generator' | 'critic';
  providerId: string;
  timestamp: string; // ISO-8601
  timcScore?: number;
  criticVerdict?: 'pass' | 'fail' | 'partial';
}
```

Events are emitted via `window.__antagonistAudit.emit(event)` — a preload-exposed sink. In Electron the main process can pipe these to a local audit log file. In web the backend client POSTs them. In neither case does the renderer store them directly.

### 2.5 Electron vs. web split

**Decision: shared renderer, shell-specific terminal adapter.**

| Concern            | Electron                                         | Web                                                   |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------- |
| PTY spawn          | `node-pty` from `main/index.js`                  | Server-side PTY streamed over authenticated WebSocket |
| File access        | preload IPC                                      | Backend file API                                      |
| Provider secrets   | S72 local config                                 | Backend-client auth bridge                            |
| Terminal component | shared `<AntagonistTerminal>` backed by xterm.js | same component, different stream                      |

The renderer never sees which shell it's on — it talks to `terminalAdapter.write()` and `terminalAdapter.on('data')`. The Electron adapter wraps IPC; the web adapter wraps WebSocket. Both implement the same `ITerminalAdapter` interface.

---

## 3. Data model

### 3.1 ArtifactHandoff

The typed record passed from generator to critic. Generator writes it; critic reads it and writes back `timcResult` + `criticVerdict`.

```ts
type ArtifactKind = 'spec' | 'code' | 'gherkin' | 'diff' | 'transcript';

interface ArtifactHandoff {
  id: string; // uuid, stable across regeneration turns
  turn: number; // 1-indexed, increments on regenerate
  kind: ArtifactKind;
  content: string; // full text of the artifact
  sourcePath?: string; // if the artifact is a file ref
  sourceSessionId: string; // generator session id
  generatedAt: string; // ISO-8601
  timcResult?: TIMCResult; // populated by critic after TIMC analysis
  criticVerdict?: CriticVerdict;
  remediationActions?: RemediationAction[];
  retentionState: 'ephemeral' | 'pending' | 'retained';
}

interface CriticVerdict {
  pass: boolean;
  summary: string;
  gateFailures: GateFailure[];
  iterationRecommendation: 'accept' | 'revise' | 'reject';
}

interface GateFailure {
  gate: string; // e.g. 'EARS_COVERAGE', 'COMPLEXITY', 'BDD_COVERAGE'
  threshold: number;
  actual: number;
  message: string;
}

interface RemediationAction {
  priority: 'must' | 'should' | 'consider';
  description: string;
  targetBlock?: string; // line ref or section name
}
```

### 3.2 Provider role abstraction

```ts
interface ProviderRole {
  role: 'generator' | 'critic';
  providerId: string;
  endpoint: string; // from S72 config, never hardcoded
  modelId: string;
  systemPrompt: string; // role-specific; critic gets CCQG gates + soul.md
  timeoutMs: number; // from S72 config
}

interface ProviderConfig {
  generator: ProviderRole;
  critic: ProviderRole;
}
```

Provider configs are resolved at session start from S72 settings. The `antagonistSession.start(config: ProviderConfig)` call validates both endpoints before spawning terminals so the user gets a clear failure before the loop runs, not mid-session.

---

## 4. Critic system prompt construction

The critic prompt is assembled at session start from three sources:

```
[1] .claude/soul.md  →  adversarial persona ("you are the CCQG antagonist...")
[2] CLAUDE.md §7     →  quality gate thresholds (EARS ≥ N%, complexity ≤ M,
                         BDD coverage ≥ P%, section completeness = 10/10)
[3] Runtime context  →  the TIMCResult JSON for this artifact turn
```

All three are injected into the critic's system prompt so the LLM critique is grounded in the same rubric the IDE gates enforce. The critic is instructed to:

1. Cross-reference every finding in `timcResult.findings` against the artifact.
2. Surface any gate threshold violations as `GateFailure` records.
3. Produce remediation actions with `must / should / consider` priority.
4. Not rewrite the artifact — only describe what is wrong and how to fix it.
5. Return a structured JSON object matching `CriticVerdict` (the critic prompt specifies the exact schema and requires JSON-only output with no markdown fences).

**Self-Spec step (from the experiment doc):** Before critiquing, the critic is asked to re-articulate the active gate thresholds in its own words in a hidden `<reasoning>` block, then proceed to critique. This mirrors the Self-Spec methodology that raises zero-shot gate adherence — the model "proves" it understood the rubric before applying it.

---

## 5. Component tree (renderer)

```
AntagonistWorkspace
  AntagonistToolbar
    ProviderRoleSelector (generator | critic, resolved from S72)
    LoopModeToggle (manual | auto)
    MaxLoopsInput
    SessionStatus (idle | running | awaiting_review | failed)
  AntagonistPanels (split layout)
    GeneratorPanel
      AntagonistTerminal (xterm.js, generator adapter)
      ArtifactPreview (last generated artifact, kind badge)
    CriticPanel
      AntagonistTerminal (xterm.js, critic adapter)
      QualityVerdictPanel
        TIMCScoreBar (EARS | section | BDD | composite)
        GateFailureList
        RemediationList
  ArtifactHandoffHistory (collapsible)
    HandoffTurn (turn N, pass/fail badge, artifact snippet)
  EphemeralTranscriptBanner (shown when retentionState === 'ephemeral')
```

`AntagonistTerminal` is the shared xterm.js wrapper. It receives an `ITerminalAdapter` and renders terminal IO identically across Electron and web. It does not know which shell spawned the PTY.

`QualityVerdictPanel` is the same scoring surface as the authoring TIMC panel, extended with `GateFailure` and `RemediationAction` lists from the critic verdict.

---

## 6. Shell integration (PR 4 scope)

### 6.1 Electron

**Main process (`src/main/index.js`):**

```js
// IPC handler — renderer never touches node-pty directly
ipcMain.handle('antagonist:spawnPTY', async (_, { role, cmd, env }) => {
  const pty = require('node-pty').spawn(cmd, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    env: { ...process.env, ...env }, // provider env vars injected from S72 config
  });
  const id = registerPTY(role, pty);
  pty.onData((data) => mainWindow.webContents.send(`antagonist:ptyData:${id}`, data));
  pty.onExit(({ exitCode }) => mainWindow.webContents.send(`antagonist:ptyExit:${id}`, exitCode));
  return id;
});

ipcMain.handle('antagonist:writePTY', (_, { id, data }) => {
  getPTY(id).write(data);
});
```

**Preload bridge (`src/main/preload.js`):**

```js
contextBridge.exposeInMainWorld('antagonistShell', {
  spawnPTY: (role, cmd, env) => ipcRenderer.invoke('antagonist:spawnPTY', { role, cmd, env }),
  writePTY: (id, data) => ipcRenderer.invoke('antagonist:writePTY', { id, data }),
  onPTYData: (id, cb) => ipcRenderer.on(`antagonist:ptyData:${id}`, (_, d) => cb(d)),
  onPTYExit: (id, cb) => ipcRenderer.on(`antagonist:ptyExit:${id}`, (_, code) => cb(code)),
  emitAuditEvent: (event) => ipcRenderer.send('antagonist:audit', event),
});
```

**Electron terminal adapter:**

```ts
class ElectronTerminalAdapter implements ITerminalAdapter {
  private ptyId: string | null = null;

  async connect(role: 'generator' | 'critic', providerCmd: string, env: Record<string, string>) {
    this.ptyId = await window.antagonistShell.spawnPTY(role, providerCmd, env);
    window.antagonistShell.onPTYData(this.ptyId, (data) =>
      this.dataListeners.forEach((l) => l(data))
    );
    window.antagonistShell.onPTYExit(this.ptyId, (code) =>
      this.exitListeners.forEach((l) => l(code))
    );
  }

  write(data: string) {
    if (this.ptyId) window.antagonistShell.writePTY(this.ptyId, data);
  }
  // ... listener management
}
```

### 6.2 Web (server PTY over WebSocket)

```ts
class WebSocketTerminalAdapter implements ITerminalAdapter {
  private ws: WebSocket | null = null;

  async connect(role: 'generator' | 'critic', sessionToken: string) {
    // backend-client.js handles auth; ws URL comes from S72 config
    this.ws = await backendClient.openTerminalSocket(role, sessionToken);
    this.ws.onmessage = (e) => this.dataListeners.forEach((l) => l(e.data));
    this.ws.onclose = (e) => this.exitListeners.forEach((l) => l(e.code));
  }

  write(data: string) {
    this.ws?.send(data);
  }
}
```

Both adapters implement `ITerminalAdapter`. The `AntagonistTerminal` component receives the adapter and never branches on shell type.

---

## 7. node-pty rebuild note

`node-pty` is a native module. It must be rebuilt for the Electron version in use:

```bash
npm install node-pty --save
npx electron-rebuild -f -w node-pty
```

Add to `package.json`:

```json
{
  "build": {
    "extraFiles": [{ "from": "node_modules/node-pty/build", "to": "resources/node-pty/build" }],
    "asar": true,
    "asarUnpack": ["**/node_modules/node-pty/**"]
  }
}
```

`asarUnpack` is required because native `.node` binaries cannot be loaded from inside an ASAR archive.

For web deployments, `node-pty` lives only on the server. The renderer has no `node-pty` import at all — the WebSocket adapter is the only web-side terminal code.

---

## 8. LemonAid integration checklist

These steps land in the Electron local config (via S72) and are not baked into the renderer:

| Step                   | Config key                     | Notes                                         |
| ---------------------- | ------------------------------ | --------------------------------------------- |
| Set generator endpoint | `provider.generator.endpoint`  | `http://localhost:8000/v1` (LemonAid default) |
| Set generator model    | `provider.generator.modelId`   | `deepseek-coder-v2-lite` for speed            |
| Set critic endpoint    | `provider.critic.endpoint`     | Same LemonAid or cloud URL                    |
| Set critic model       | `provider.critic.modelId`      | `qwen3.5-coder-32b` for quality               |
| Set timeouts           | `provider.generator.timeoutMs` | 90 000 (layer-split models are slow)          |
| Verify health          | —                              | `GET /v1/models` at session start             |

The provider abstraction's `healthCheck()` method pings `/v1/models` before starting a session. If either provider is unreachable the session fails fast with a clear message (not mid-generation).

---

## 9. Acceptance gates (PR 3 + PR 4)

### PR 3 — Antagonist loop

- [ ] Unit: `ArtifactHandoff` validates `kind`, `content`, `sourceSessionId`, `retentionState`.
- [ ] Unit: `ProviderRole` rejects missing `endpoint` or `modelId`.
- [ ] Unit: critic prompt assembly includes all three sources (soul.md persona, CLAUDE.md §7 thresholds, TIMCResult).
- [ ] Unit: `CriticVerdict` schema validated against a fixture handoff.
- [ ] Unit: auto-loop halts at `maxLoops` and preserves all intermediate artifacts.
- [ ] Unit: `AuditEvent` emitted for `generated`, `critiqued`, `accepted`, `provider_failed`.
- [ ] Integration: generator → handoff → critic flow with mocked providers, no real LLM call.
- [ ] `npm run test && npm run lint && npm run quality-gate`

### PR 4 — Terminal shell integration

- [ ] Electron: preload bridge exposed; renderer cannot call `node-pty` directly.
- [ ] Electron: `spawnPTY` IPC handler is main-process-only.
- [ ] Electron: `asarUnpack` covers `node-pty` native binary.
- [ ] Web: WebSocket adapter uses `backendClient.openTerminalSocket`; no direct WebSocket constructor in renderer.
- [ ] Both: `ITerminalAdapter` interface has 100% coverage, both adapters tested with mocks.
- [ ] Manual smoke test: Electron local terminal starts with mocked LemonAid endpoint; output appears in `AntagonistTerminal`.
- [ ] Both: `EphemeralTranscriptBanner` renders when `retentionState === 'ephemeral'` before session start.
- [ ] `npm run test && npm run lint && npm run quality-gate` + Electron smoke test

---

## 10. Outstanding implementation decisions (spike before PR 3)

| Question                                                                                                    | Spike task                                        | Timebox |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------- |
| Does `@trainyard/timc-light.analyse()` accept raw Markdown or require a parsed AST?                         | Check S35 API surface                             | 30 min  |
| Can the critic LLM reliably return JSON-only at low temperature, or does it need an output schema enforcer? | Test with LemonAid and the critic model candidate | 1 hr    |
| Does the session WebSocket auth pattern in `backend-client.js` need extension for PTY sessions?             | Review `backend-client.js` interface              | 30 min  |
| Is `node-pty` v1.x or v2.x compatible with the current Electron version?                                    | `electron-rebuild` dry run                        | 15 min  |

---

## 11. Files touched (S73 §3.8 addendum)

| File                                                         | PR       | Change                                                                            |
| ------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------- |
| `ui/src/pages/StructureView.tsx`                             | PR 3 + 4 | Add `AntagonistWorkspace` route segment                                           |
| `ui/src/components/antagonist/AntagonistWorkspace.tsx`       | PR 3     | New — top-level antagonist component                                              |
| `ui/src/components/antagonist/AntagonistTerminal.tsx`        | PR 4     | New — xterm.js wrapper with adapter interface                                     |
| `ui/src/components/antagonist/QualityVerdictPanel.tsx`       | PR 3     | New — TIMC + critic verdict display                                               |
| `ui/src/components/antagonist/ArtifactHandoffHistory.tsx`    | PR 3     | New — turn history                                                                |
| `ui/src/components/antagonist/EphemeralTranscriptBanner.tsx` | PR 3     | New — governance disclosure                                                       |
| `src/antagonist/handoff.ts`                                  | PR 3     | New — `ArtifactHandoff`, `CriticVerdict`, schemas                                 |
| `src/antagonist/providerRole.ts`                             | PR 3     | New — `ProviderRole`, `ProviderConfig`, health check                              |
| `src/antagonist/criticPrompt.ts`                             | PR 3     | New — assembles critic system prompt from soul.md + CLAUDE.md §7 + TIMCResult     |
| `src/antagonist/auditEvent.ts`                               | PR 3     | New — `AuditEvent` type + emit helper                                             |
| `src/antagonist/terminalAdapter.ts`                          | PR 4     | New — `ITerminalAdapter` interface                                                |
| `src/antagonist/electronTerminalAdapter.ts`                  | PR 4     | New — IPC-backed adapter                                                          |
| `src/antagonist/webSocketTerminalAdapter.ts`                 | PR 4     | New — WebSocket-backed adapter                                                    |
| `src/main/index.js`                                          | PR 4     | Add `antagonist:spawnPTY`, `antagonist:writePTY`, `antagonist:audit` IPC handlers |
| `src/main/preload.js`                                        | PR 4     | Expose `window.antagonistShell` bridge                                            |
| `src/auth/backend-client.js`                                 | PR 3 + 4 | Add `openTerminalSocket(role, token)`, provider health check                      |
| `src/bdd/antagonist.feature`                                 | PR 3     | New — BDD step coverage for handoff, verdict, loop, shell boundary                |
