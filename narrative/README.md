# narrative/

Hand-written commentary, spliced verbatim into the generated pages in `content/`.

Alongside `program.yaml`, these are the only hand-edited files in the repository. The generator
includes them as-is — it never parses them, never looks for tables in them, and never extracts
structure from them. That is what keeps SPEC §2 intact: `program.yaml` stays the only place structure
is authored.

## Naming

The filename is the ID of the thing it comments on.

```
narrative/program.md                     → the L0 page
narrative/conventions.md                 → the conventions page
narrative/M4.md                          → milestone M4's page
narrative/M4.3.md                        → package M4.3, under "Package notes" on M4's page
narrative/M4-tasks.md                    → M4's task page
narrative/registers/gates.md             → the gate register
narrative/registers/dependencies.md      → the dependency register
narrative/registers/parallelization.md   → the parallelization register
```

A file naming something that does not exist in `program.yaml` **fails the build**. Prose that
documents nothing is worse than no prose: it still reads as current. A missing file is fine — the
slot is simply empty.

## The one rule

**No structural claims.** No durations, no dependency assertions, no counts, no "longest", no
"first", no "five lanes".

> ✅ "Handover means different things to each party. To a GC it is typically an *event* — a date, a
> signature. To deployment it is an *interval* — a process with duration, punch items, and residual
> access. Same word, different ontological category, and nobody notices until the schedule disagrees
> with itself."
>
> ❌ "Five independent lanes converge on one acceptance walk."
> ❌ "M2 is the longest-duration milestone by a wide margin."
> ❌ "M4.3.3 through M4.3.7 is a serial chain of 11 days."

The bad examples are not wrong today. They are facts about the graph, and the graph changes. Written
here they become a second claim to truth that nothing checks and nobody updates — which is the exact
failure this whole architecture exists to prevent.

**The test:** if a sentence would need editing after someone adds a task, it does not belong here.
Write the insight the number was illustrating, and let the page state the number.

Where a structural fact genuinely needs saying, the generator should compute it. If it does not
compute it yet, that is a change to the generator, not a sentence here.
