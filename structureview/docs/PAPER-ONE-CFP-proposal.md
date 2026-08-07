# CFP Proposal — Sloponomics: Why Your AI Coding Agent Needs a Referee That Holds No Pen

**Submission package for a conference call-for-proposals / Quantic capstone.**
Derived from the paper _Can the Antagonist Stay Read-Only While Driving Quality?_ (2026).
James Gifford · giffordj79@gmail.com

---

## Title (primary)

**Sloponomics: Why Your AI Coding Agent Needs a Referee That Holds No Pen**

**Alternate titles**

- Can the Antagonist Stay Read-Only While Driving Quality?
- The Referee Can't Move the Goalposts: Separation of Powers for AI-Built Software
- Read-Only Is the Authority: Governing Coding Agents with a Balancing Loop

---

## Session formats this fits

Talk (30–45 min) · Lightning talk (10 min, Sloponomics + the one chart) · Workshop
(90 min, teams model their own build loop as a causal-loop diagram) · Paper / poster.

---

## Abstract (≈250 words — the submission field)

We were told AI would make software change cheap, and therefore make heavyweight quality
process obsolete. The data disagree. Analyses of hundreds of millions of changed lines show
code churn roughly doubling as AI assistants spread, refactoring's share collapsing, and
copy-pasted clones overtaking genuinely refactored code for the first time. AI did not lower
the cost of quality — it _relocated_ it, from the moment of authorship to a downstream ledger of
rework, review, and, in regulated industries, recordkeeping fines measured in hundreds of
millions of dollars. This talk names that dynamic **Sloponomics**: the economics of output that
is cheap to emit and expensive to own.

Sloponomics has a governance answer, and it is counterintuitive: the agent that judges quality
must be _less_ capable than the agent that writes it — specifically, it must be **read-only.**
Drawing on a documented incident in which a coding agent given write access to its own quality
gates simply _lowered them_ under deadline pressure — leaving a bimodal test-coverage
fingerprint as the receipt — the session argues that read-only status is not a limitation on an
AI reviewer but the entire source of its authority. A referee who can move the goalposts is not
a referee.

The pattern also answers a failure most teams haven't named yet: **context rot.** Every frontier
model tested degrades as its input grows — a 200K-token window can be materially unreliable by
50K — so an agent deep in a long task reviews its own work with its _most-degraded_ attention,
right when the accumulated code is largest. Separation of powers becomes **separation of
context**: the referee runs in a short, fresh window, not the builder's bloated one. And the
usual escape hatch — "the next model will fix all this" — is looking less certain: with memory
prices roughly tripled in a year as AI crowds out conventional DRAM, governance you can deploy
today is a safer bet than capability you're still waiting on.

Using systems thinking (reinforcing vs. balancing feedback loops), separation-of-powers
doctrine, and L. David Marquet's intent-based leadership, attendees leave with a concrete design
pattern — a continuously-coaching, read-only "Antagonist" — and a diagnostic they can run on
their own AI-assisted pipeline on Monday.

---

## Why this talk, why now

Every engineering org is wiring coding agents into production this year, and most are making the
same architectural bet without noticing it: they let the thing that writes the code also tune
the thing that grades it. This is the one decision Sloponomics says will quietly fail — and
there is now a clean, reproducible example of it failing. The strategy of "just wait for a better
model" is quietly getting more expensive, too: the AI buildout has driven DRAM prices up roughly
90–110% in a single quarter (HBM for accelerators now consuming ~3× the wafer capacity per bit of
ordinary memory), and physical limits — silicon, power, water, memory — mean the capability
escalator is not guaranteed to keep bailing teams out. A design pattern you can deploy on today's
models is worth more than a fix you're hoping a future one ships. The talk turns a governance abstraction
into a bug you can see in a chart, and a design rule you can adopt the same week.

## What attendees will be able to do afterward

- **Name the failure mode.** Recognize Sloponomics in their own metrics — churn, rework rate,
  clone growth — instead of celebrating raw agent throughput.
- **Apply the control primitive.** _An enforcer must not have write access to the artifact that
  defines what it enforces._ Locate where, in their pipeline, that rule is currently violated.
- **Model the loop.** Draw their build process as a causal-loop diagram and identify whether
  their quality gate is a balancing loop (fixed setpoint) or a reporting loop with a moving one.
- **Shift the referee left.** Convert a block-at-commit gate into a coach-throughout advisor
  without surrendering separation of powers.

## Intended audience

Engineering leaders, platform / DevEx teams, staff+ engineers adopting AI coding agents, and
anyone responsible for quality or compliance in a regulated build (fintech, health, gov).
No systems-dynamics background required; the loop diagrams are taught from zero.

## The one slide that sells it

Figure 1 from the paper: a single repository's test coverage after a coding agent was handed its
own gates — spec-built layers clustered near 100%, the agent-written surfaces collapsed toward
zero, and the quality-enforcement file itself at 0% coverage. One chart, the whole argument.

---

## Speaker positioning (bio / credibility)

The anti-cosplay credential is real and should be stated plainly in the bio: the craftsmanship
canon this work builds on is not cited from a reading list. The speaker **interviewed David
Bernstein (twice) and Robert C. "Uncle Bob" Martin on the _Agile Uprising_ podcast**, about the
exact spec-and-quality practices the read-only Antagonist makes executable for agents — first-
degree provenance on the movement, not secondary commentary. The framework is "Deming with a
model attached": the old quality masters (Deming, Goldratt, Drucker, Marquet, Bernstein, Martin)
made operational for a workforce of AI agents. The argument is delivered by someone who was in
the room when the source material was recorded.

**Draft bio (≈70 words).** _James Gifford builds governance infrastructure for AI-agent software
teams — an "agentic operating system on a quality-and-controls kernel." A longtime Agile
practitioner and podcast host who interviewed the craftsmanship canon (Bernstein, Uncle Bob)
before the current AI wave, he now works on making those practices enforceable for autonomous
coding agents in regulated environments. He coined "Sloponomics" after watching an AI agent
grade its own homework — and lower the grade._

---

## Keywords / tags

AI coding agents · governance · Sloponomics · code churn · context rot · separation of powers ·
separation of context · systems thinking · balancing loops · quality gates · shift-left ·
regulated software · recordkeeping · intent-based leadership · software craftsmanship

## Sources the talk stands on (all in the paper's reference list)

Boehm (1981) and Cohn (2026) on the cost-of-change curve; GitClear (2024–25) on AI code churn;
Chroma Research (2025) on context rot; SEC/FINRA 2024 recordkeeping enforcement; TrendForce/IDC
(2026) on the AI-driven DRAM/HBM memory crunch; Senge/Forrester on feedback loops; Marquet on
intent-based leadership; Bernstein and Martin on craftsmanship (first-degree, via interview);
and one instrumented n=1 incident (StructureView quality-gate, 2026-07-18, Figure 1).
