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

*The derivation rule itself is deliberately not decided here — see Q24. Phase 1 only needs to know that
the field is absent from the authored schema.*

---

## Still open — blocking phase 3

**Q24 — What rule derives a rollup gate?** Consequence of D7, and it is not the obvious one.

`any descendant task.gate` **marks all 8 milestones as gates**, because every milestone contains at
least one gate task. The legacy L0 marks only M1, M2, M4, M8. A flag that is true for everything
carries no information — precisely the "gates become decorative" anti-pattern `gates.md` warns about.

Candidate rule: **a rollup is a gate when its terminal task is a gate** — i.e. the *exit* is gated,
which matches `conventions.md` ("no successor begins until the criterion is evidenced"). Checked
against the legacy data it reproduces 7 of 8:

| | terminal task | gate? | legacy L0 |
|---|---|---|---|
| M1 | M1.5.3, M1.6.3 | yes | 🚨 ✓ |
| M2 | M2.8.4 | yes | 🚨 ✓ |
| M3 | M3.6.5 | no | — ✓ |
| M4 | M4.7.3 | yes | 🚨 ✓ |
| M5 | M5.6.4 | no | — ✓ |
| M6 | M6.8.4 | no | — ✓ |
| M7 | **M7.9.2** | **yes** | **—** ✗ |
| M8 | M8.8.4 | yes | 🚨 ✓ |

The M7 mismatch is arguably a legacy authoring error rather than a flaw in the rule: `gates.md` states
M7.9.2 "Monitoring live **before** validation begins" blocks all of M8, which is a gated exit by any
reasonable reading. Same class of finding as Q10–Q14 — the derived view disagreeing with the authored
one, which is the point of the exercise.

Needs a decision before phase 3. Not blocking phase 1.

---

## Content loss under the specified generator

**Q6 — There is nowhere in the schema for the prose.** Every legacy file carries substantial
non-tabular content: "Seam notes", "Exit criteria", "Parallel lanes" commentary, ASCII lane diagrams,
the definition-of-done contract, and `conventions.md` in full. The schema has only `note` on a task.
Regenerating `content/` from `program.yaml` as specified produces documents materially poorer than the
ones being replaced. Needs narrative fields at program/milestone/package level, or an explicit decision
to discard. This is the largest gap between §3 and what exists.

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

**Q10 — M4 has no dependency on M1.** The legacy L0 table and the M4 L1 file both state "Depends on:
M1". No task in `M4-tasks.md` references any M1 task. Derived, M4 is a **root node**. Either an edge is
missing (M4.1.x should depend on M1.1.x design freeze) or the authored claim was never true.

**Q11 — M7 has no direct dependency on M2.** L0 and the M7 L1 file both state "Depends on: M6, **M2**",
and the gate register says M2.8.4 "Blocks M7". No M7 task lists an M2 task as a predecessor. The actual
path is M2.7.4 → M5.4.3 → M7.2.1, i.e. M2 reaches M7 *through M5*.

**Q12 — Consequently, derived M5 depends on M2**, via M5.4.3 ← M2.7.4. The authored L0 says M5 depends
on M3 and M4 only. If Q11 is fixed by adding M2.8.4 → M7.x, this may resolve on its own.

**Q13 — The stated critical path may not survive computation.** L0 asserts `M1 → M2 → M7 → M8`. With
Q10/Q11 unresolved and durations unresolved (Q1), the computed longest path will likely differ. Expect
the generated L0 to disagree with the legacy L0 — that disagreement is the point of the exercise, but
someone has to ratify the corrected version.

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

**Q17 — `datahall-bringup/` is flat.** Every link inside it points into `L1-milestones/`, `L2-tasks/`,
and `registers/` subdirectories that do not exist. The links are already broken. The importer cannot
rely on directory structure to classify files — it must go by filename.

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
