# CLAUDE.md

Working agreement for agents on this repo. Read `SPEC.md` in full before writing code — this file is the
short form, not a replacement.

---

## The rule that overrides everything else

**`program.yaml` is the single machine-readable source of truth. Everything else is generated.**

```
program.yaml  ──generate──▶  content/*.md        (build artifact — human-readable)
              └─generate──▶  public/program.json (build artifact — app input)
```

- Files in `content/` and `public/program.json` are **outputs**. Never hand-edit them. If output is
  wrong, fix `scripts/generate.ts`.
- **Never write a markdown parser to recover structure.** The one exception is `scripts/import-markdown.ts`,
  a throwaway one-time migration helper (§8 phase 2). If you find yourself reaching for a parser anywhere
  else, the architecture has been inverted — stop and say so.
- Rollups are *derived*, never authored alongside detail. Three hand-maintained levels are aligned on day
  one and divergent by week three, with no way to adjudicate which is true.
- **If a design decision would violate this, say so and stop.** Do not work around it.

### The one rule for `narrative/`

Prose partials are included verbatim and never parsed, so they do not violate the rule above — but only
while they stay commentary. **A narrative partial must contain no structural claim:** no durations, no
dependency assertions, no counts.

> "Handover is an *event* to a GC and an *interval* to deployment" — safe forever.
> "Five independent lanes converge on one acceptance walk" — **not safe.** That is a fact about the
> graph. It will silently stop being true. Generate it.

If a sentence would need editing after someone adds a task, it does not belong in `narrative/`.

---

## How to work here

- **Ask before assuming.** Where the spec is ambiguous, ask. Do not guess and proceed. Open questions
  are tracked in `docs/open-questions.md` — add to it rather than silently deciding.
- **Show the plan before large changes**, and always before phases 3 (graph computation) and 7 (chain
  highlighting).
- **Ship each phase working before starting the next.** Do not build ahead of the current phase.
- **One phase per branch. Small commits, descriptive messages.**
- **Run the tests.** Graph computation that is wrong looks entirely plausible while being incorrect, and
  everything downstream renders it. A green build is not evidence; a passing test suite is.
- **Nothing domain-specific is hardcoded.** No data-center vocabulary in `src/` or `scripts/`. A
  different `program.yaml` must produce a working site. Types, roles, and statuses come from the data.

---

## Layout

```
/program.yaml                ← the ONLY hand-edited data file
/schema/program.schema.ts    ← Zod schema + validation
/graph/                      ← derived computation. Shared by the generator AND the app,
                               so it sits outside src/. Addition to SPEC §6's layout.
/scripts/generate.ts         ← YAML → JSON + markdown
/scripts/import-markdown.ts  ← one-time migration helper (throwaway)
/narrative/                  ← hand-written prose partials, included verbatim by the
                               generator. Commentary only — see the rule below.
/content/                    ← GENERATED. Never edit.
/public/program.json         ← GENERATED. Never edit.
/src/                        ← React app
/datahall-bringup/           ← legacy hand-written source. Read-only reference; input to the importer only.
```

`datahall-bringup/` is the pre-migration artifact. It is **not** a build input after phase 2 and must
never be read at runtime or by the generator.

---

## Data model (see SPEC §3 for the authoritative schema)

Three levels, IDs carry their own path: `M4` milestone → `M4.3` package → `M4.3.3` task.
**IDs are permanent.** Retired, never reused — renumbering breaks every reference that pointed at it.

**Authored** (in `program.yaml`): program metadata, roles registry, milestones, packages, and tasks.
Durations, predecessors, gate criteria, evidence, and status live **only on tasks**.

**Decisions that override SPEC §3** — the spec is the older document. Full rationale in
`docs/open-questions.md`.

- `duration: {min, max}` in days, **optional**. Absent = zero-length; renders as `—`, never `0d`.
- `owners: RoleId[]`, non-empty — not §3's single `owner`. HYB tasks genuinely have two.
- `status_since` required when status is `AT_RISK` or `BLOCKED`, optional otherwise. Enforced in the
  schema, so aging cannot be hidden by omitting the field.
- `external: true` with no predecessors models a task gated by something outside the program.
- **Every derived schedule value is computed twice** — optimistic from `min`, pessimistic from `max`.
  The critical path can be a *different path* at each end, not the same path with two lengths, so the
  graph layer returns two path sets. UI defaults to pessimistic; an optimistic figure must never be
  displayed unlabelled.

**Derived — compute these, never store them:**

- Milestone and package dependencies (roll up from task predecessors)
- Milestone and package duration, earliest start, earliest finish
- Critical path, float per task
- Milestone/package status (worst-case rollup)
- Days-in-state (from `status_since`)
- Upstream/downstream closure for any node
- Cross-milestone edges, resource contention

If you catch yourself adding a field that could be computed, it belongs in the graph layer instead.

---

## Status rules — implement exactly, no interpretation

- `AT_RISK` **never** renders as healthy. A mitigation plan does not restore green. `AT_RISK` and
  `IN_PROGRESS` are distinct states and must be visually distinct.
- **Never green for `AT_RISK`** under any circumstance, in any view.
- Days-in-state is **always displayed** for `AT_RISK` and `BLOCKED`. Never hide aging.
- Milestone/package status = **worst** status among descendants. Never average, never round toward
  optimism.

The point of the whole model is that it can deliver bad news. Any rendering choice that softens a
status is a bug, not a style preference.

---

## Build must fail loudly

Fail the build — not warn, not skip — on:

- Schema violation
- Any dependency cycle
- A predecessor, owner, approver, milestone, or package reference that does not resolve
- A package with no milestone, or a task with no package

---

## Commands

Keep this list accurate as phases land.

| Command | Status | Does |
|---|---|---|
| `npm run validate` | ✅ phase 1 | Validate `program.yaml` — schema, references, **and cycles**. Takes a path argument. |
| `npm test` | ✅ phase 1 | Vitest. Graph computation above all, once it exists. |
| `npm run typecheck` | ✅ phase 1 | `tsc --noEmit` |
| `npm run generate` | ✅ phase 4 | `program.yaml` + `narrative/` → `public/program.json` + `content/**` |
| `npm run dev` | ✅ phase 5 | Vite dev server |
| `npm run build` | ✅ phase 5 | Validate → generate → production build |

`scripts/import-markdown.ts` is a **one-time** migration helper that has already run. It is the only
markdown parser this repository is allowed to contain, and it exists to end markdown-as-source, not to
sustain it. Do not re-run it — that would overwrite hand-reviewed edits to `program.yaml` with a fresh
draft of the legacy content.

Acceptance target: a clean clone works with `npm install && npm run generate && npm run build`.

---

## Stack

Vite · React · TypeScript · Tailwind · React Flow · React Router (**hash** routing, for Pages).
Zod for schema. Vitest for tests. No backend, no database, no auth. `program.json` is loaded once at
startup. Set Vite `base` to the repo name.

---

## Design direction

Dense, technical, legible — flight-ops console or oscilloscope, not a SaaS marketing page. Monospace for
IDs. Type badges (PHY/DIG/DOC/HYB) as small colored chips. Gates visually unmistakable. Dark mode
default. No decorative animation; transitions only where they aid comprehension of a state change.

**Build the feature that matters first.** Select any node → full upstream and downstream chains
highlighted, everything else dimmed, chain listed alongside the graph with the longest-span dependency
called out. That is the point of the application. Nothing cosmetic goes in ahead of it.

---

## Out of scope for v1 — do not build

In-browser editing · auth / multi-user / real-time · backend / database / API · resource leveling or
schedule optimization · MS Project or Primavera import · comments or discussion threads.

Edits happen in `program.yaml` via pull request. Because the site is static, every status change is a
commit — versioned definitions and sign-off as code review, for free. Lean into it.

---

## Build order (SPEC §8) — current position

- [x] 1. Schema + validation — `schema/`, 70 tests, `npm run validate`
- [x] 2. Import helper (throwaway) — `program.yaml` drafted; **see `docs/import-review.md`**
- [x] 3. Graph computation — `graph/`, 167 tests. Cycles now fail `npm run validate`.
- [x] 4. Generator — `scripts/generate.ts` + `scripts/render/`, 22 files, 58 tests
- [x] 5. App shell + deploy to Pages — `src/`, L0 view, hash routing, CI workflow
- [x] 6. Drill-down L0 → L1 → L2 — L1/L2 routes, breadcrumbs, deep links, sortable/filterable
      task table, 8 tests. Every level renders the shipped rollup; no ID slicing.
- [ ] 7. Graph view + chain highlighting — **show the plan first**
- [ ] 8. Timeline view
- [ ] 9. Search, filters, keyboard nav, polish

Update this checklist as phases complete.
