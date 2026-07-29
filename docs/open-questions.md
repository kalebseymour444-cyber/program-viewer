# Open questions

Ambiguities and contradictions found reading `SPEC.md` against `datahall-bringup/`. Add rather than
resolve silently; record the decision and the date when one is made.

---

## Decided — 2026-07-28

These override SPEC §3 where they differ. The spec is the older document.

**D1 — Duration is a range, in days.** `duration: {min, max}` replaces §3's `duration: 3`. Both
integers, `min <= max`; a fixed duration is `{min: n, max: n}`. Resolves Q1. Working days per §3 —
not restated in the decision, so §3 stands. Note this is at odds with how the legacy content reads
`20–90d` for permitting (almost certainly calendar days); see Q19, still open.

**D2 — `owners: RoleId[]`.** Replaces §3's single `owner`. Non-empty. Resolves Q2. Matches the content
(`CX + PM`, `ICT + NET-R`, …) and `conventions.md`, which defines HYB as needing two owners present
simultaneously. Consequence: resource contention (§3) is contention on *any shared* owner, and a HYB
task contends on both of its roles.

**D3 — Derived values computed at both ends of the range.** Earliest start, earliest finish, float, and
critical path are each computed twice — optimistic from `min`, pessimistic from `max`. UI defaults to
pessimistic. **The critical path is not merely longer under `max`, it can be a different path**, so the
graph layer returns two distinct path sets, not one path with two lengths. Nothing in the app may
display an optimistic figure without labelling it as such (§3: never round toward optimism).

**D4 — `duration` is optional; absent means zero-length.** Resolves Q2's blank-duration half. An absent
duration contributes 0 to path length but the task keeps its edges. **Renders as `—`, never as `0d`** —
a continuous activity like the M8.5 break/fix loop must not read as instantaneous. Applies to
M4.1.1, M4.5.1, M6.2.1, M6.2.3, M6.2.4, M8.4.2, M8.4.3, M8.5.1–M8.5.6.

**D5 — External anchors use `external: true` with no predecessors.** Resolves Q3. M4.1.1 and M4.5.1
become graph roots; `construction` survives as prose in `note`. No new node type. Revisit only if the
five externally-controlled items in `dependencies.md` turn out to need identity of their own.

**D6 — `status_since` is conditionally required.** Required when `status` is `AT_RISK` or `BLOCKED`,
optional otherwise. Enforced in the schema via a refinement, so aging cannot be hidden by omitting the
field. Resolves Q4.

**D7 — Gate is authored on tasks only; derived for packages and milestones.** Resolves Q5. `gate`,
`criterion`, and `evidence` stay on the task — the leaf is where a gate is actually evidenced. `gate` is
**removed from the milestone schema** (§3 authored it) and never added to packages. This closes the §2
tension: a gate flag on a rollup was a second claim to truth about the same fact.

*The derivation rule itself is deliberately not decided here — see Q24, resolved by D8 below.*

**D8 — There is no rollup gate, derived or authored.** Resolves Q24, 2026-07-28. `gate` exists only on
tasks. Packages and milestones expose a derived **gate count** and the list of gate tasks beneath them;
no boolean.

Decided this way because **no structural rule reproduces the legacy marking**, which was measured
against the imported data rather than assumed:

| candidate rule | agrees with legacy L0 | marks as gate |
|---|---|---|
| any terminal task is a gate | 5/8 | M1 M2 M3 M4 M5 M7 M8 |
| any boundary task is a gate | 2/8 | M2 M3 M4 M5 M6 M7 |
| all boundary tasks are gates | 3/8 | M2 M3 M7 |
| any descendant task is a gate | 4/8 | all eight |

Legacy marks M1, M2, M4, M8. The terminal rule — the most defensible one, since `conventions.md` defines
a gate as something no successor passes — wrongly marks M3 (`M3.5.2` label reconciliation), M5
(`M5.4.3` OOB proven) and M7 (`M7.9.2` monitoring live). Each of those genuinely is a gate task with no
successor inside its milestone; the milestone still was not marked.

The conclusion is that the 🚨 on a legacy milestone is an **editorial judgment** about contractual
significance, not a property of the graph. Since it is not derivable, authoring it would not have
violated §2 — but a hand-maintained editorial flag is exactly the kind of field that quietly stops
being true, and a gate count carries the same information without anyone having to maintain it.

The legacy marking is not lost: `docs/import-review.md` records all four milestones and fifteen
packages that carried it.

**D9 — Rollup status severity, worst first: `BLOCKED` > `AT_RISK` > `IN_PROGRESS` > `NOT_STARTED` >
`COMPLETE`.** A package or milestone takes the worst status among its tasks (SPEC §3 — never average,
never round toward optimism). One blocked task blocks the milestone. A milestone with work underway
reads `IN_PROGRESS` even when some tasks are untouched; one with nothing started reads `NOT_STARTED`;
`COMPLETE` requires every task complete.

---

## Resolved — was blocking phase 3

**Q24 — What rule derives a rollup gate?** **Resolved by D8: none.** The analysis below is kept because
it is the evidence for that decision. Consequence of D7, and not the obvious one.

`any descendant task.gate` **marks all 8 milestones as gates**, because every milestone contains at
least one gate task. The legacy L0 marks only M1, M2, M4, M8. A flag that is true for everything
carries no information — precisely the "gates become decorative" anti-pattern `gates.md` warns about.

Candidate rule: **a rollup is a gate when its terminal task is a gate** — i.e. the *exit* is gated,
which matches `conventions.md` ("no successor begins until the criterion is evidenced").

An earlier draft of this entry claimed that rule reproduced 7 of 8 milestones. **It does not — it
reproduces 5 of 8.** That estimate was made by eye, taking the last task by ID as the milestone's
terminal. Computed properly against `program.yaml`, a terminal task is any task with no successor
*inside* its own milestone, and most milestones have several:

| | terminal tasks (* = gate) | terminal rule | legacy L0 |
|---|---|---|---|
| M1 | M1.1.5, M1.4.3, M1.5.3\*, M1.6.3\* | gate | 🚨 ✓ |
| M2 | M2.2.1, M2.2.6\*, M2.4.4, M2.8.4\* | gate | 🚨 ✓ |
| M3 | M3.1.4, M3.2.3, **M3.5.2\***, M3.6.5 | gate | — ✗ |
| M4 | M4.6.3, M4.7.3\* | gate | 🚨 ✓ |
| M5 | M5.2.2, **M5.4.3\***, M5.6.4 | gate | — ✗ |
| M6 | M6.1.2, M6.4.2, M6.5.3, M6.6.3, M6.7.3, M6.7.4, M6.8.4 | — | — ✓ |
| M7 | M7.1.3, M7.2.3, M7.4.3, M7.5.4, M7.6.2, M7.8.2, **M7.9.2\*** | gate | — ✗ |
| M8 | M8.1.5, M8.2.4, M8.6.3, M8.8.4\* | gate | 🚨 ✓ |

M3, M5 and M7 each end on a gate task that has no successor inside the milestone, yet none was marked.
That is not a near-miss to be explained away — it is evidence that the legacy 🚨 tracks something the
graph does not encode. See D8.

---

## Content loss under the specified generator

**Q6 — There is nowhere in the schema for the prose.** **Resolved 2026-07-28 by D10 and D11.** Every
legacy file carries substantial non-tabular content: "Seam notes", "Exit criteria", "Parallel lanes"
commentary, ASCII lane diagrams, the definition-of-done contract, and `conventions.md` in full. The
schema has only `note` on a task.

The question turned out to conflate two different kinds of content. Much of what reads as prose is a
**restatement of structure the graph now computes**, and is therefore subject to §2 like any other
derived value. M4's exit criteria are the clearest case — all four bullets restate gate criteria
already authored on M4's tasks:

| M4 exit criterion (authored prose) | already authored at |
|---|---|
| Fluid chemistry verified against spec, not just "filled" | `M4.3.4` criterion |
| Flow rate and delta-T verified under simulated load | `M4.3.7` criterion |
| Leak detection functionally triggered, not merely installed | `M4.4.2` criterion |
| Written handover criteria signed by construction **and** deployment | `M4.7.3` criterion |

The same applies to the "Parallel lanes" sections (lane structure is computable), and to every L1
header line stating duration and dependencies.

What remains once the derivable parts are removed is smaller and genuinely non-derivable: milestone
thesis blockquotes, seam notes, and register commentary.

**D10 — Non-derivable prose lives in `narrative/`, as sidecar markdown partials.** Resolves the first
half of Q6.

- `narrative/<id>.md` holds commentary for that entity — `narrative/M4.md`, `narrative/M4.3.md`.
  Registers get `narrative/registers/<name>.md`.
- The generator **includes them verbatim** at defined slots. It must never parse them for structure.
  They are prose inputs carrying no data, so §2's single machine-readable source of truth is intact:
  `program.yaml` remains the only place structure is authored.
- A missing partial is fine — the slot is simply empty. A partial naming an entity that does not exist
  is a **build error**, the same as any other dangling reference.

**The discipline that makes this safe: a narrative partial must contain no structural claim.** No
durations, no dependency assertions, no counts. "Handover is an *event* to a GC and an *interval* to
deployment" is safe forever. "Five independent lanes converge on one acceptance walk" is not — it is a
fact about the graph, it will silently stop being true, and it must be generated instead.

This matters immediately, because the legacy prose is full of such claims — "M2 is the longest-duration
milestone by a wide margin", "M4.3.3 through M4.3.7 is a serial chain with no compression available",
"~8 months". Migrating the commentary into `narrative/` is therefore not a copy-paste: each structural
claim has to be either dropped in favour of a generated one, or rewritten as the insight it was
illustrating.

**D11 — Milestone and package exit criteria are derived from the gate criteria beneath them.**
Resolves the second half of Q6. The generated "Exit criteria" section lists every gate task in the
rollup with its `criterion` and `evidence`. Nothing is authored, so nothing can drift.

**Q26 — M1's OFCI/CFCI exit criterion has no gate.** Found while checking D11. Three of M1's four
authored exit criteria map to gate tasks (`M1.2.3`, `M1.5.3`, `M1.6.3`); the fourth — "OFCI/CFCI
boundary written, with the delay-risk allocation stated" — maps to `M1.3.2`, which is not marked as a
gate. Under D11 that criterion simply disappears from the generated output. Either `M1.3.2` should be
a gate, or it was never really an exit criterion. Same class as Q10–Q12: the derivation exposing an
inconsistency in the authored data.

**Q7 — The dependency register changes meaning.** SPEC §4 generates
`content/registers/dependencies.md` as "cross-milestone edges only, sorted by span length descending".
The legacy register is not that — it is a curated risk document about *latent reach* (e.g. "M1.2.2
patching matrix → M8.3.4 rail variance, ~8 months"), and **most of its rows are not precedence edges at
all**. There is no edge from M1.2.2 to M8.3.4 in the task data. The generated file will be a different
document. Does the schema need a second, non-precedence "risk linkage" edge type?

**Q8 — Soft vs hard edges.** The legacy L0 mermaid draws `M4 -.pathway.-> M3` and
`M8.5 -.concurrent.-> M8.3` as dotted, semantically distinct from solid edges. The schema has one edge
kind. Drop the distinction or add an edge type?

**Q9 — `conventions.md` has no home.** Type meanings, status meanings, role descriptions, and gate
semantics live there and are referenced by every other file. §4's generated file list omits it. Is it
generated from the schema/roles registry, hand-written outside `content/`, or dropped?

---

## The derived graph will contradict the authored one

These are real defects in the legacy data that the rollup will expose. Each needs a human decision —
add the missing edge, or accept that the authored L0 was wrong.

> **RESOLVED 2026-07-28 by D12 — four edges added to `program.yaml`.** Found by reading, confirmed
> mechanically by the importer's reconciliation pass, then resolved by hand once phase 3 could show
> what each candidate edge did to the schedule. The entries below are kept as the record of what was
> wrong and how it was found.

**D12 — Four missing edges added, resolving Q10 and Q11.**

*Q10 — M4 had no dependency on M1.* Three edges, each supported by the task names themselves:

| edge | why |
|---|---|
| `M1.1.2 → M4.1.3` | containment cannot be installed without the floor plan that specifies it |
| `M1.1.3 → M4.2.1` | busway cannot be installed without the power layout defining its runs |
| `M1.1.4 → M4.3.1` | the CDU cannot be set without the fluid layout defining its placement |

Schedule effect: **none** — the project stayed at 211 days at the time, and M4 was not on the critical
path either way. This was a correctness fix. It stops M4 rendering as a root node that may begin on day
zero, which is what the L1 page was showing.

*Q11 — M7 had no dependency on M2.* One edge: **`M2.8.4 → M7.7.1`**, WAN acceptance to image build.

Out-of-band is a console path, not a data path. Pulling an OS, driver and CUDA/NCCL/DOCA stack for the
fleet needs the production WAN, so provisioning cannot precede WAN acceptance. Three anchors were
evaluated against the computed schedule before choosing:

| candidate | project | critical path |
|---|---|---|
| `M2.8.4 → M7.7.1` image build | 247d | `M1 → M2 → M7 → M8` |
| `M2.8.4 → M7.9.2` alert routing | 239d | `M1 → M2 → M7 → M8` |
| `M2.8.4 → M8.8.4` customer access | 212d | `M1 → M2 → M8` |

`M7.7.1` was chosen: it is the earliest point where the production path is genuinely required, and it
reproduces the critical path L0 asserted all along.

**What this fixed.** The programme no longer finishes before the WAN is accepted. Under the old data
M8 completed on day 163 while M2 ran to 211 — the model asserting that clusters went live 48 days
before the WAN was signed off. M8 is now the terminal milestone at day 247, and the computed critical
path is `M1 → M2 → M7 → M8`, exactly as the legacy L0 always claimed.

The 36-day increase is not the WAN getting slower. It is provisioning no longer being permitted to
overlap with the WAN build, which is the entire point of the edge.

*Q12 — M5 depends on M2* remains true and is now unremarkable: M2 legitimately feeds forward rather
than dangling.

The two integration tests that pinned these defects failed the moment the edges were added, which was
their purpose. They now pin the fix instead.

**Q10 — M4 has no dependency on M1.** The legacy L0 table and the M4 L1 file both state "Depends on:
M1". No task in `M4-tasks.md` references any M1 task. Derived, M4 is a **root node**. Either an edge is
missing (M4.1.x should depend on M1.1.x design freeze) or the authored claim was never true.

**Q11 — M7 has no direct dependency on M2.** L0 and the M7 L1 file both state "Depends on: M6, **M2**",
and the gate register says M2.8.4 "Blocks M7". No M7 task lists an M2 task as a predecessor. The actual
path is M2.7.4 → M5.4.3 → M7.2.1, i.e. M2 reaches M7 *through M5*.

**Q12 — Consequently, derived M5 depends on M2**, via M5.4.3 ← M2.7.4. The authored L0 says M5 depends
on M3 and M4 only. If Q11 is fixed by adding M2.8.4 → M7.x, this may resolve on its own.

**Q13 — The stated critical path may not survive computation.** L0 asserts `M1 → M2 → M7 → M8`.

**Computed 2026-07-28 (phase 3).** It survives in the pessimistic scenario and does not in the
optimistic one — and the pessimistic path is *truncated* by the missing edge from Q11:

| scenario | project | critical path by milestone |
|---|---|---|
| optimistic (`duration.min`) | 105 days | `M1 → M3 → M5 → M7 → M8` — 40 tasks |
| pessimistic (`duration.max`) | 211 days | `M1 → M2` — 19 tasks, ending at `M2.8.4` WAN acceptance |

Two things follow.

**The legacy claim is nearly right, and the gap is exactly Q11.** Under pessimistic durations the
critical path does run M1 → M2, confirming that WAN is the pole that kills the date. It stops at
`M2.8.4` rather than continuing to M7 and M8 *only because no M7 task lists an M2 predecessor*. Add
the `M2.8.4 → M7.x` edge and the computed path becomes `M1 → M2 → M7 → M8`, precisely as L0 states.

**The missing edge produces a visibly absurd schedule, which is useful.** With M2 dangling, M8 finishes
on day 163 while M2 finishes on day 211 — the model currently says clusters go live 48 days *before*
the WAN is accepted. That is the exact failure `L0-program.md` warns about in prose: "A data hall that
is energized, racked, cabled, and validated but has one WAN path is not deliverable." The graph says it
numerically. **This is the strongest argument for resolving Q11 by adding the edge rather than by
deleting the claim.**

The optimistic path running through the construction lane (M3 → M5 → M6 → M7) also matches the legacy
narrative that "the construction path is what gets reported on because it's visible" — it genuinely is
critical, but only when nothing runs long.

**Q25 — A milestone's earliest start can be dragged to day 0 by one unconstrained task.** Found while
checking the phase 3 rollups. M7 rolls up as starting on day 0 because `M7.3.1` ("Known-good firmware
matrix published & version-pinned") has no predecessors, even though every other task in M7 waits on
M5 and M6. The rollup is arithmetically correct — earliest start is the minimum over member tasks — but
it reads as though M7 begins immediately.

Either `M7.3.1` is genuinely startable on day one (plausible: publishing a firmware matrix is desk
work) and the rollup is honest, or it is missing a predecessor. Same class as Q10–Q12. Affects the
timeline view (phase 8) more than anything else.

**Q14 — M8.5 "gates exit" but has no edge saying so.** `M8-tasks.md` states "M8.5 is not a phase, it is
a loop running under everything else. **It gates exit, it does not follow.**" M8.6.1 depends only on
M8.4.3. Nothing in M8.6 depends on any M8.5 task, so the claim is unrepresented in the graph.

**Q15 — Compound IDs in the gate register.** `gates.md` lists `M7.3.2/3` and `M8.3.3/4` as single
rows, and its "Blocks" column mixes task IDs, package IDs, milestone IDs, and prose (`revenue`, `all
cabling`). The importer must split these; the "Blocks" text is authored and must be **discarded** in
favour of computed successors.

**Q16 — Legacy L1 "Feeds" columns are authored rollups** and conflict with §2. They should be ignored by
the importer and derived instead — but they are worth diffing against the derived result, since
disagreements are how Q10–Q14 were found.

---

## Structural / operational

**Q17 — `datahall-bringup/` is flat.** ~~Every link inside it points into `L1-milestones/`, `L2-tasks/`,
and `registers/` subdirectories that do not exist.~~ **Resolved 2026-07-28** — the importer classifies
by filename (`M{n}-tasks.md` vs `M{n}-*.md`) and never resolves an internal link. The broken links
matter only for reading the legacy files in place, and those files stop being authoritative once
`program.yaml` is reviewed.

**Q18 — Roles referenced but not registered.** `conventions.md` registers 14 roles.
`dependencies.md` references "Sourcing" as a party. Register it or drop it.

**Q19 — Timeline needs a calendar.** §5 wants swimlanes from computed earliest start/finish, but there
is no program start date, no working-day calendar, and no holiday set in the schema. Are earliest
start/finish day-offsets from zero, or real dates? If real, `program.yaml` needs a start date and a
calendar definition.

**Q20 — Resource contention has no capacity.** §3 wants "tasks sharing an owner with overlapping
windows". With 14 roles across ~203 tasks and no crew-count or capacity field, nearly everything
overlaps and the output is noise. Does a role need a `capacity`?

**Q21 — Repetition has no representation.** `M6-tasks.md` notes "Tasks M6.2–M6.8 repeat per rack;
durations below are for the full hall." No schema field expresses quantity or repetition. Fine to
ignore for v1, but the durations are then hall-level aggregates, which is worth stating in the data.

**Q22 — Deployment prerequisites are absent.** Not a git repo, no `package.json`, no remote. §7 needs
the Vite `base` set to the repo name and Pages enabled. Need the repo name and GitHub org/user.

**Q23 — Do the phase-1 sample milestones become `program.yaml`?** §8 phase 1 asks for "three
hand-written sample milestones"; phase 2 generates a first-draft `program.yaml` from the legacy
markdown. Proposal: phase 1 samples are **test fixtures** under `schema/__fixtures__/`, and
`program.yaml` is not created until phase 2.
