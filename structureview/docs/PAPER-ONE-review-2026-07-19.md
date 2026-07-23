# Paper One — review punch-list (2026-07-19)

> Review of `PAPER-ONE-antagonist-read-only.md` before submission (Quantic / CFP). Strong draft.
> This is the revision checklist, ordered by what would hurt most if left.

## MUST-FIX before submission

1. **~~Verify every external statistic~~ — DONE 2026-07-19 (WebSearch verification pass).** Results:
   - **SEC $392.75M / 26 firms (2024)** — ✅ exact (SEC, Aug 14 2024, off-channel recordkeeping;
     individual penalties $400K–$50M).
   - **Cohn (2026)** — ✅ correct; "The Cost of Change Curve Is Outdated," Mountain Goat, Mar 3 2026;
     argues Agile **and AI** flattened the curve — paper's characterization (contesting the AI claim)
     is accurate.
   - **Chroma Context Rot, 18 models** — ✅ (GPT-4.1, Claude Opus 4, Gemini 2.5, all degrade). ~50K/200K
     specific left hedged as schematic (Figure 2) — acceptable.
   - **GitClear** — ✅ 5.7% churn (2024), refactoring 25%→<10%, clones 8.3%→12.3%, copy-paste overtook
     moved in 2024, 211M lines — all confirmed.
   - **TWO CORRECTIONS APPLIED to the paper §5:** baseline churn is **3.1% (2020)**, not 3.3%; and the
     **"7.1% (2025)" was UNCONFIRMED and has been removed** (latest verified figure is 5.7%/2024;
     "3.1%→5.7%" still supports "roughly doubling"). If 7.1% is real (GitClear 2026 "Maintainability
     Gap" report), it can be re-added *with* that cite.
   - Not separately re-verified (low-risk, book/gov citations): SEC $88M/11-firm wave, FINRA BTIG $600K,
     NASA Stecklein, Menzies 2017 — spot-check before final submission but not blocking.

2. **Close (or honestly concede) the confound.** §6 admits the bimodal coverage split is "also partly
   consistent" with "newer surfaces are just less tested," and names the **hard→warning gate downgrade
   record** as the discriminator. That record must be a **real committed artifact** (a git diff of the
   eslint/gate config going error→warn during S12–S17), cited and reproducible. If it exists → cite it,
   confound ruled out. If it doesn't → §6's honest wording ("suggestive, not probative") stands and the
   empirical claim is weaker than the prose implies. **Confirm the artifact exists.**

3. **Fix one overstatement.** §5: "I interviewed Bernstein — twice — and Martin … *about these exact
   ideas*." The interviews were about craftsmanship / legacy code, not the read-only-Antagonist concept
   (which is new). Change to "…about the craftsmanship practices this rests on." Keeps the (strong,
   true) first-degree-provenance claim without a challengeable overreach.

## CONSIDER (owner judgment)

4. **Scope: is this one paper or two?** It now carries the tight thesis + **Sloponomics** + separation-
   of-context (§4.1) + the Boehm/Cohn cost-curve economics + the frontier-ceiling close. Separation-of-
   context genuinely extends the thesis. **Sloponomics is arguably its own paper** (an economics-of-AI-
   output piece). The tight version (read-only + separation-of-context, n=1 proof) is more submittable;
   the big version is more the author. Decide before submission which venue gets which.
5. **"Sloponomics" — audience check.** Memorable and on-brand for a practitioner/business audience
   (Quantic). For a software-engineering academic CFP it may read as glib. Keep for the former; consider
   demoting to a footnote coinage for the latter.

## KEEP — do not let revision weaken these

- **§6 (Limits & falsification)** — the integrity anchor. The four disconfirming criteria are what make
  it a claim not a slogan. Don't trim.
- **First-degree provenance** (Bernstein ×2, Martin) — stated in §5 and References. Correct and strong.
- **No day-job data** — primary-data note is explicit; all figures are StructureView's own or public
  enforcement numbers. Verified clean.
- **Figures exist + reproducible** — `figure-1-coverage-split.png`, `figure-2-context-rot.png`, backed
  by `coverage-split-figure1.md` (513/997 → fixed). Real, not decorative.
- **Anti-cosplay handling of Boehm/Cohn** — refuses to lead with 100×, credits Cohn, contests only the
  AI-flattening claim. The smartest move in the paper; it's the thesis's ethos demonstrated.

## Verdict

Submittable after MUST-FIX 1–3. The argument is sound, the provenance is unimpeachable, and the limits
section is what a reviewer will respect most. The only real exposure is unverified stats — fix that and
it's the credential it was meant to be.
