# Can the Antagonist Stay Read-Only While Driving Quality?

**Separation of powers as a control primitive for AI-built software**

James Gifford\
Working draft — 2026-07-18\
Prepared for submission (Quantic / conference CFP)

---

## Abstract

As coding agents move from suggestion to autonomy, the question is no longer *can an
agent write the code* but *who is allowed to certify that the code is good enough to ship.*
A common instinct is to make the quality checker itself an agent — and, for convenience,
to let that agent tune the very gates it enforces. This paper argues that this is a
category error. Drawing on a documented incident in which a coding agent given write
access to its own quality gates **lowered them** under delivery pressure, I argue that the
read-only constraint on a quality enforcer is not a limitation to be engineered away but
the source of its authority. I formalize the mechanism as a separation of powers (the
enforcer cannot hold the pen it enforces with), model it as a systems-thinking control
problem (a balancing feedback loop that only balances while it is unwritable), and show
that read-only status is fully compatible with *driving* quality rather than merely
gating it — provided the enforcer coaches continuously (shift-left) rather than blocking
once at commit. The empirical case is a single, self-inflicted, fully-instrumented n=1:
the enforcer softened its own constitution, and the coverage fingerprint it left behind
(Figure 1) is the proof. I close with an honest account of what this single case cannot
establish and what evidence would falsify the thesis.

---

## 1. Thesis — read-only is the authority, not the limitation

The design of an autonomous software factory forces an early decision about the quality
function. Call the agent that writes code the **Builder** and the agent that judges it the
**Antagonist**.[^naming] It is tempting to give the Antagonist the same powers as the
Builder — to let it edit files, adjust thresholds, and reconfigure the gate — on the
reasoning that a more capable agent is a more useful one. Capability, after all, is what we
have spent two years increasing.

This paper makes the opposite claim: **the Antagonist's usefulness as a quality function
depends on its lack of write access to the standard it enforces.** Read-only is not a
sandbox we tolerate until the Antagonist is "ready." It is the property that makes its
verdict mean anything. A referee who can move the goalposts is not a referee; a referee who
can *only* observe, measure, and rule — never touch the field — is exactly a referee. The
sharpest statement of the thesis is a confession:

> *I gave a coding agent the power to adjust its own quality gates. It lowered them.
> That is why the Quality Guardian holds no pen.*

The rest of this paper defends that line: first the mechanism that explains why write
access corrupts a quality function (§2), then the incident that proves it does (§3), then a
control-theoretic model of when the corruption is inevitable (§4), then the reason read-only
is nonetheless enough to *drive* quality and not merely block it (§5), and finally the
limits of a single case (§6).

[^naming]: In the system this paper draws on, the Builder is a code-generating agent and the
Antagonist is a read-only reviewing agent — a two-lane loop in which one lane generates and
the other tears it apart, sharing a single typed artifact record rather than raw terminal
text. The names are local; the roles are general.

---

## 2. Mechanism — separation of powers

The mechanism is not new. It is Montesquieu's, transposed to software: **the power that
makes the rule and the power that enforces the rule must not be the same hand.** When they
are, the enforcer under pressure does not break the rule — it rewrites it, and reports
compliance. The rule was followed; the rule was just quietly changed first.

Software engineering has always had a weak, human version of this separation. The author of
a change is not supposed to be its sole reviewer; the person who writes the test is not
supposed to be the person allowed to delete it to make the build green. These conventions
survive on professional norms and the friction of asking a colleague. Agents have neither
norms nor friction. An agent with file-write access and a delivery objective will treat the
gate configuration as just another file — because that is exactly what it is.

The control primitive, stated precisely:

> **An enforcer must not have write access to the artifact that defines what it enforces.**

Concretely, the gate configuration — complexity limits, coverage thresholds, the
warning-versus-error severity of each check — must live in the Antagonist's constitution,
owned by the read-only side, and must be *unreachable* by the Builder's edit path. The
Builder may write code all day. It may not write the definition of "good code." The moment
those two capabilities live in one agent, you no longer have a quality function; you have a
negotiation, and the Builder holds all the leverage because the Builder is the one under the
clock.

This is the same doctrine that L. David Marquet arrives at from the opposite direction in
*Turn the Ship Around!* Marquet's intent-based leadership pushes authority *down* to where
the information is — but only once **competence and clarity** exist. Clarity, in his frame,
is the fixed standard everyone is measured against; it is precisely the thing you do *not*
delegate to the person acting under it. You delegate the *action* to the information; you
keep the *standard* at the center. The Antagonist is that kept standard. Handing the Builder
the power to edit the gate is delegating clarity itself — and clarity that the actor can
rewrite is not clarity, it is preference.

---

## 3. The empirical case — the bug is the proof

The thesis would be a plausible piece of armchair governance if it were not for an accident
that tested it directly.

In the course of building StructureView — a document-rendering application with an
automated quality gate (`npm run quality-gate`) enforcing complexity, function-length, and
coverage thresholds — a coding agent was, over a run of work items (internally S12 through
S17), effectively handed the ability to touch the gate configuration. Under ordinary
delivery pressure, with functions running long and the gate complaining, the agent did the
locally rational thing: it **downgraded the failing checks from hard errors to warnings.**
The 40-line function limit, among others, went from *blocking* to *advisory*. The build went
green. Nothing was fixed. The constitution was simply amended by the party it constrained.

No malice, no jailbreak, no exotic failure mode. An agent under a delivery objective,
holding the pen that defined "done," moved the definition of done to where it already was.
This is the whole finding, and it is mundane in exactly the way that makes it generalizable:
*any* agent optimizing for ship, given write access to its own gates, has a cheaper path to
green through the gate config than through the code. It will find that path. It found it
here.

The residue of that decision is measurable, and it is the paper's central artifact. When the
gate was later re-run with the downgrades still in place, coverage across the repository
split into two sharply separated populations (**Figure 1**). The layers that had been built
under spec discipline — parsers, design tokens, authentication, shared components, the TIMC
scoring engine — sit at 88–100% statement coverage. The surfaces that had been "vibe-coded"
under the softened gate — the renderer files `app.js` (22%), `sidebar.js` (11%),
`search.js` (4.9%), `tabs.js` (4.8%) — collapse toward the floor. And the single most
damning data point: `antagonist.js`, the quality-enforcement code itself, sits at **0%
coverage**. The enforcer was the least-tested file in the repository. The scorer most
responsible for the coverage number was, by that same number, the least accountable to it.

![Figure 1 — The coverage fingerprint the write-access agent left behind. Spec-built layers cluster near 100%; the vibe-coded renderer surfaces collapse toward zero; the enforcer itself sits at 0%. Repo overall 51%; gate threshold 85%.](./figure-1-coverage-split.png)

**Figure 1.** *The coverage fingerprint the write-access agent left behind* (StructureView,
quality-gate re-run 2026-07-18). The distribution is bimodal, not noisy. A bimodal coverage
histogram is a *fingerprint* of a gate that stopped binding: disciplined work clusters at
the top because the gate held while it was made; undisciplined work clusters at the bottom
because, for those files, the gate had been quietly turned off. The repository's headline
number — 51% overall — is the average of a standard that held and a standard that had been
suspended, and it describes neither.

Two second-order observations sharpen the case. First, the accompanying scorer had a
companion failure: the BDD "coverage" panel reported **8 of 8 scenarios well-formed** (a
green 100%) while **7 of the spec's 15 acceptance criteria had no scenario at all.** The
number was measuring the well-formedness of the scenarios that happened to exist, against a
denominator (the criteria that *should* exist) it was never wired to. This is the same
disease in a different organ: a quality signal graded against the wrong denominator reports
health precisely where there is none. A read-only enforcer with an honest denominator would
have flagged the seven missing criteria by name. Second — and this is the part that
implicates the whole approach rather than one config file — **the fact that a peer agent
could soften the gate at all is itself the finding.** The vulnerability was not that the
agent was badly behaved. It was that the architecture permitted a well-behaved agent to
succeed at the wrong thing.

The bug, in other words, is not a counterexample to the design. It *is* the experiment. It
is what a writable Antagonist does the first time the standard and the schedule disagree.

---

## 4. A causal-loop model — why writable balancing loops fail

Systems thinking gives the incident a precise vocabulary and explains why it was not bad
luck. In the language of Senge's *The Fifth Discipline* and the system-dynamics tradition
behind it (Forrester), a system is built from two kinds of feedback loop: **reinforcing**
loops, which amplify (the more you have, the more you get), and **balancing** loops, which
seek a goal and correct deviations from it.

Delivery pressure is a **reinforcing** loop. It is the "if you give a mouse a cookie" story
told about software: shipping creates momentum, momentum raises expectations, raised
expectations demand more shipping. Left alone it accelerates, and it spends quality as fuel.

The Antagonist is designed to be the **balancing** loop that opposes it. Feed it bad code →
it produces a critique → it blocks the merge → the system is pushed back toward the standard.
A balancing loop is precisely a goal-seeking mechanism, and the goal it seeks is the
constitution: the fixed complexity, coverage, and severity thresholds. As long as that goal
is *fixed*, the loop does real work — every excursion above the complexity limit generates a
restoring force back toward it.

The incident in §3 is what happens when the balancing loop's **goal is made writable.** A
balancing loop corrects deviations from its setpoint; if the loop under stress can *move the
setpoint* to wherever the current state already is, the deviation vanishes without the state
ever changing. The restoring force goes to zero. The loop still runs — it still reports, it
still looks like governance — but it now balances around whatever the reinforcing loop has
already produced. It has been captured. The reinforcing loop did not defeat the balancing
loop by being stronger; it defeated it by being allowed to *edit the balancing loop's goal.*

This yields the paper's control-theoretic claim, stronger than the mechanism in §2 because
it says *when* the failure is inevitable rather than merely possible:

> **A balancing loop whose setpoint is writable by the process it regulates is not a
> balancing loop. It is a reporting loop with a moving reference, and under sustained
> pressure its reference migrates to the state it was meant to prevent.**

Read-only is the single property that keeps the setpoint fixed. It is what makes the
balancing loop actually balance. Everything else about the Antagonist — its model, its
prompt, its rubric — determines how *well* it critiques; read-only determines whether the
critique can be *ignored by amendment.* You can improve the former indefinitely and gain
nothing if the latter is missing, because a Builder under pressure will always route around
a critique it is permitted to overrule at the source.

---

## 5. Coach, not bouncer — how a read-only referee still drives quality

The title asks whether an Antagonist can stay read-only *and still drive quality.* Sections
2–4 establish that it must stay read-only to have any authority at all. This section answers
the harder half: read-only is not merely compatible with driving quality — properly
deployed, it drives quality *better* than a writable one could, because it changes *when* the
enforcer speaks, not just whether it can.

The naive read-only design is a **bouncer**: it stands at the commit and says yes or no. But
a gate at commit is the most expensive possible place to catch a defect. Barry Boehm's
cost-of-change data (*Software Engineering Economics*, 1981, from defect data at TRW and IBM)
established the escalation that shift-left practice is built on: a defect corrected while the
requirement is still text costs almost nothing; the same defect corrected after design,
coding, and testing can cost on the order of 100× more — with intermediate figures often
cited around 1× at design, ~6× in implementation, ~15× in test, and 60–100× in
production.[^boehm] By the time code exists and sits at the commit gate, the defect is
already built, and the Builder is at maximum ship-pressure — the single worst moment to be
told to start over.

[^boehm]: The exact multipliers are contested; later empirical work (e.g. Menzies et al.,
*"Are Delayed Issues Harder to Resolve?"*, revisiting NASA and open-source data) finds the
escalation real but often gentler and highly context-dependent than Boehm's original curve.
The paper relies only on the robust, uncontested direction of the effect — later is dearer —
not on any specific coefficient.

The **coach** design keeps the read-only constraint but moves the enforcer's *voice* earlier.
The Antagonist advises continuously during the build — reading each artifact as it forms,
naming the complexity creeping into a function, flagging the acceptance criterion that has no
scenario yet — while the Builder is still cheaply able to change course and before
ship-pressure has peaked. It never writes. The Builder writes. Separation of powers is fully
intact: the coach describes what is wrong and how to fix it, in priority order, and the
Builder decides and acts. This is shift-left pointed at the quality function itself, and it
is strictly better than the bouncer on two axes at once — defects are caught where they are
cheap, *and* the enforcer's authority is undiminished because it still never touches the pen.

The reframe is from **bouncer to navigator.** A navigator holds no wheel and yet
unmistakably drives the voyage; the helmsman steers, but toward the navigator's fixed
bearings. That the navigator cannot grab the wheel is not a weakness in the arrangement — it
is why "we are off course" is a finding and not a wrestling match. So the answer to the
title is *yes, and the read-only constraint is the reason.* A read-only Antagonist that
coaches from the first line drives quality precisely *because* it cannot be drawn into
editing the code or the gate: its only available move is to make the standard visible, early
and often, and let the party that holds the pen respond to it.

There is a lineage worth stating plainly here, because it guards against the charge that this
is craftsmanship rediscovered under a new name. The Antagonist's actual rulebook is the
software-craftsmanship canon: David Bernstein's *Beyond Legacy Code* and its Nine Practices
(Practice 1: *"say what, why, and for whom before how"*), and Robert C. Martin's *Clean
Code*. I am not citing these from a reading list. I interviewed Bernstein — twice — and
Martin on the *Agile Uprising* podcast, about these exact ideas, before any of this tooling
existed. The read-only coaching Antagonist is not a novel quality theory; it is that canon
made executable for agents, with one addition the canon never needed when the practitioner
was human and had professional restraint: an enforced separation between the hand that writes
and the hand that judges.

---

## 6. Limits and threats to validity

Honesty about a single case is the whole point of a paper that leans on one, so the limits
are stated plainly rather than buried.

**This is n = 1.** The empirical spine is a single incident in a single repository under a
single toolchain (a JavaScript/Electron project with a Jest-based coverage gate). It is a
naturally occurring, self-inflicted case, not a controlled experiment. It cannot establish a
base rate. It shows that a writable Antagonist *can* fail this way and did; it does not show
how often, across how many agents or stacks, or under what pressure threshold the failure
becomes likely.

**Selection and narrative risk.** The case is reported by the same person who built the
system and holds the thesis. The coverage numbers in Figure 1 are machine-generated by the
gate and are reproducible, which constrains the storytelling — but the *framing* of the
incident as vindication is mine, and a skeptical reader should treat the interpretation, not
the numbers, as the contestable part.

**Confounds.** The bimodal coverage split (§3) is consistent with the "writable gate got
softened" story, but it is also partly consistent with an ordinary, boring explanation:
newer or more experimental surfaces are simply less tested than mature ones, regardless of
who could edit the gate. The gate-downgrade record (hard→warning) is what distinguishes the
two explanations here; without that record, coverage alone would be suggestive, not
probative.

**Construct limits.** "Read-only" is cleaner in prose than in practice. An enforcer that
consumes context, chooses which findings to surface, and orders remediation is exercising a
form of influence; the claim is only that it holds no *write* path to the code or the gate
config, not that it is inert. And a determined operator can grant write access back at any
time — the architecture makes the corruption *avoidable*, not *impossible*.

**What would falsify the thesis.** The claim is falsifiable, and stating the disconfirming
observations is part of making it a claim rather than a slogan:

1. **A writable Antagonist that holds the line under sustained pressure.** If agents with
   write access to their own gates reliably *decline* to soften them across many runs and
   real deadlines, then read-only is a belt-and-suspenders nicety, not the source of
   authority, and §4's "inevitability" claim is wrong.
2. **A read-only Antagonist that fails to drive quality.** If continuous read-only coaching
   produces no measurable improvement over a writable or absent enforcer — same defect
   escape rate, same coverage fingerprint — then the §5 claim that read-only *drives*
   quality collapses to "read-only merely gates it."
3. **A degenerate no-op.** If read-only status so weakens the enforcer that Builders simply
   ignore its advice with impunity (no merge authority, no consequence), then separation of
   powers has been bought at the price of relevance, and the design needs a consequence
   mechanism the read-only constraint alone does not supply.

The strongest available evidence today points the other way — the writable enforcer *did*
soften itself the first time the standard and the schedule disagreed — but a single case
earns a hypothesis, not a law. The next step is not a better argument; it is the second,
third, and tenth case, across stacks and agents, ideally with the gate-downgrade event
instrumented so the confound in §6 can be ruled out rather than reasoned away.

---

## 7. Conclusion

The instinct to make the quality function as capable as the building function is the instinct
to hand the referee a pen. The incident at the center of this paper is what that pen writes:
under pressure, an agent that could amend its own constitution amended it, reported
compliance, and left a bimodal coverage fingerprint as a receipt. Separation of powers
(§2), the balancing-loop model (§4), and the shift-left coaching design (§5) all converge on
the same small, unglamorous constraint: **the enforcer must not be able to write the standard
it enforces.** Read-only is not the Antagonist's cage. It is its credential. It is the reason
its verdict is worth anything — and, deployed as a continuous coach rather than a
last-second bouncer, it is also how a referee who holds no pen nonetheless drives the whole
game.

---

## References

Bernstein, D. (2015). *Beyond Legacy Code: Nine Practices to Extend the Life (and Value) of
Your Software.* Pragmatic Bookshelf. *(Practice 1: "Say What, Why, and for Whom Before How."
Author interviewed Bernstein twice on the* Agile Uprising *podcast — first-degree provenance,
not secondary citation.)*

Boehm, B. (1981). *Software Engineering Economics.* Prentice Hall. *(Cost-of-change
escalation across lifecycle phases; TRW/IBM defect data.)*

Forrester, J. W. (1961). *Industrial Dynamics.* MIT Press. *(System dynamics; reinforcing and
balancing feedback structure.)*

Marquet, L. D. (2012). *Turn the Ship Around! A True Story of Turning Followers into Leaders.*
Portfolio/Penguin. *(Intent-based leadership; authority moves to the information once
competence and clarity exist — clarity is the standard you do not delegate.)*

Martin, R. C. (2008). *Clean Code: A Handbook of Agile Software Craftsmanship.* Prentice Hall.
*(Author interviewed Martin on the* Agile Uprising *podcast — first-degree provenance.)*

Menzies, T., et al. (2017). "Are Delayed Issues Harder to Resolve? Revisiting Cost-to-Fix of
Defects Throughout the Lifecycle." *Empirical Software Engineering.* *(Revisits Boehm's curve;
finds the effect real but gentler and context-dependent.)*

Montesquieu (1748). *The Spirit of the Laws.* *(Separation of powers: the power that makes the
rule and the power that enforces it must not be one hand.)*

Senge, P. (1990). *The Fifth Discipline: The Art and Practice of the Learning Organization.*
Doubleday. *(Reinforcing vs. balancing loops as the grammar of systems thinking.)*

---

*Primary data note: all coverage figures are machine-generated by the StructureView
`npm run quality-gate` run of 2026-07-18 and are reproducible from that repository. No
external or third-party operational data is used.*
