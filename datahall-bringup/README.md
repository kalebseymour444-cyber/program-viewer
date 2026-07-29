# Data Hall Bring-Up — Layered Program Model
### GB300 NVL72 footprint · meet-me room → clusters live

---

## What this is

A **traversable** program model, not a set of summaries. Three layers, each a view of the same work at a
different grain. Every element at one layer resolves downward into the layer beneath it, and every
element carries its path back up.

| Layer | File | Audience | Grain |
|---|---|---|---|
| **L0 — Program** | [L0-program.md](L0-program.md) | Executive / customer-facing | 8 milestones |
| **L1 — Work packages** | [L1-milestones/](L1-milestones/) | Program & site leads | 6–9 packages per milestone |
| **L2 — Tasks** | [L2-tasks/](L2-tasks/) | Execution teams | Individual tasks, typed and sequenced |

**Cross-cutting registers** ([registers/](registers/)) hold what doesn't belong to a single milestone:
[dependencies](registers/dependencies.md), [gates](registers/gates.md),
[parallelization](registers/parallelization.md).

Start with [conventions.md](conventions.md) — the ID scheme is what makes traversal work.

---

## The design principle

> A **summary** is lossy and terminal — someone compressed the detail and the compression discarded the
> path back. An **abstraction** is lossless and traversable — a view of the underlying material where
> every element resolves downward.

Most program reporting is the first pretending to be the second. That's why *"why is this red?"*
produces a three-day investigation instead of an answer.

**Requirement that follows:** these are views of one dataset, not three documents. Maintained as three
parallel artifacts they are aligned on day one and divergent by week three, and now there are three
claims to truth with no way to adjudicate. If this model is ever implemented in tooling, L0 must be
*generated* from L2 — never authored alongside it.

---

## How to read it

- **Status question** → L0. Every milestone shows state, gate condition, and what it's waiting on.
- **"Why is M2 at risk?"** → open [M2](L1-milestones/M2-network-live.md), find the package that isn't
  clearing, follow it to [L2](L2-tasks/M2-tasks.md).
- **"Who owns this and what's blocked behind it?"** → L2 task row: owner, predecessors, successors.
- **"What can run concurrently?"** → [parallelization register](registers/parallelization.md).

If a question can't be answered by traversing down, that gap is the finding. A number nobody can trace
is a number nobody can be held to.

---

## Scope assumptions

64 × GB300 NVL72 · 4,608 GPUs · ~9 MW compute, ~10 MW hall · 100% liquid cooled · scale-out on
ConnectX-8 800G to InfiniBand or Spectrum-X · ~5,000–6,000 field-terminated links · NVLink scale-up
factory-integrated, **not** field work.

Durations are illustrative for a practiced team on a repeat design. First-of-a-kind runs materially
longer, and the delta is almost entirely first-time discovery of things a playbook would have caught.
