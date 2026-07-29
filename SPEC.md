# SPEC — Layered Program Viewer

*A build specification written to be handed directly to a coding agent. Read the whole thing before
writing any code.*

---

## 1. What you are building

A static web application that renders a **layered program model** — a project structure documented at
three levels of abstraction, where every element at one level resolves downward into the level beneath
it. Published free on GitHub Pages.

The existing content is a data hall deployment program: 8 milestones (L0), ~55 work packages (L1), and
~200 tasks (L2), with typed dependencies, gates, owners, and durations. The app must be
**domain-agnostic** — nothing about data centers may be hardcoded.

---

## 2. The one architectural rule

**A single machine-readable source of truth. Everything else is generated.**

The markdown files in `content/` are *build artifacts*, not inputs. Never parse markdown tables to
recover structure. Never let a human edit generated markdown.

```
program.yaml  ──generate──▶  content/*.md        (readable in GitHub / Obsidian)
              └─generate──▶  public/program.json (consumed by the app)
```

**Why this is non-negotiable:** if the three levels are maintained as three hand-written documents, they
are aligned on day one and divergent within weeks — three claims to truth with no way to adjudicate.
The rollup must be *derived*, never authored alongside the detail. If you find yourself writing a
markdown parser, stop: you have inverted the architecture.

---

## 3. Data schema

Author in YAML. Validate with Zod (or equivalent) at build time; fail the build loudly on violation.

```yaml
program:
  id: datahall-bringup
  name: Data Hall Bring-Up
  description: Meet-me room to clusters live

roles:                      # owner registry
  - { id: PM,    name: Program Management }
  - { id: ICT,   name: Structured Cabling Contractor }
  - { id: NET-R, name: Remote Network Engineering }

milestones:                 # L0
  - id: M4
    name: White Space Accepted
    approver: CX
    gate: true

packages:                   # L1
  - id: M4.3
    milestone: M4
    name: Cooling loop commissioning
    type: PHY
    owner: MECH

tasks:                      # L2 — the only place durations and predecessors live
  - id: M4.3.3
    package: M4.3
    name: Loop flush — particulate to spec
    type: PHY               # PHY | DIG | DOC | HYB
    owner: MECH
    duration: 3             # working days
    predecessors: [M4.3.2]
    gate: true
    criterion: Particulate to spec
    evidence: Fluid sample analysis
    status: NOT_STARTED     # NOT_STARTED | IN_PROGRESS | AT_RISK | BLOCKED | COMPLETE
    status_since: 2026-07-28
    note: Serial chain — no compression available
    external: false         # true = externally controlled (permits, carriers, vendors)
```

### Derived, never authored

Compute these; do not store them.

- Milestone and package dependencies — **roll up from task predecessors**
- Milestone and package duration, earliest start, earliest finish
- Critical path (topological sort → longest path)
- Float per task
- Milestone status (worst-case rollup of its tasks)
- Days-in-state (from `status_since`)
- Full upstream and downstream closure for any node
- Cross-milestone dependency list (any edge whose endpoints differ in milestone)
- Resource contention (tasks sharing an owner with overlapping windows)

### Status rules — implement exactly

- `AT_RISK` **never** renders as healthy. A mitigation plan does not restore green. `AT_RISK` and
  `IN_PROGRESS` are distinct states and must be visually distinct.
- Days-in-state is **always displayed** for `AT_RISK` and `BLOCKED`. Never hide aging.
- Milestone status = worst status among its tasks. Never average, never round toward optimism.

---

## 4. Generator (`npm run generate`)

Node + TypeScript script. Reads `program.yaml`, writes:

- `public/program.json` — the computed graph the app loads
- `content/L0-program.md` — milestone table, mermaid dependency graph, critical path
- `content/L1-milestones/M{n}.md` — one per milestone: packages, local graph, exit criteria
- `content/L2-tasks/M{n}-tasks.md` — one per milestone: full task table
- `content/registers/gates.md` — every task where `gate: true`, with criterion and evidence
- `content/registers/dependencies.md` — cross-milestone edges only, sorted by span length descending
- `content/registers/parallelization.md` — concurrent lanes, convergence points, owner contention

Every generated file carries a header: `<!-- GENERATED — do not edit. Source: program.yaml -->`

Generated markdown must use **relative links** (portable to GitHub and Obsidian) and **mermaid** code
fences for diagrams.

---

## 5. Application

### Stack

Vite · React · TypeScript · Tailwind · React Flow (graph) · React Router (hash routing for Pages).
No backend, no database, no auth. Loads `program.json` once at startup.

### Views

**L0 — Program.** Milestone cards or a compact table: status, owner, duration, gate flag, blocked-on.
Dependency graph via React Flow. Critical path visually distinct. Click a milestone → L1.

**L1 — Milestone.** Breadcrumb `Program / M4`. Work packages with type, owner, rolled-up status. Local
dependency graph. Gate criteria. Click a package → L2 filtered to it.

**L2 — Tasks.** Full task table: ID, name, type badge, owner, duration, predecessors, successors, gate,
status, days-in-state. Sortable, filterable.

**Graph view.** All ~200 tasks, force-directed or layered. Filterable by milestone, type, owner.

**Timeline view.** Swimlanes from computed earliest start/finish. Group by milestone or by owner. Show
float. Highlight critical path.

**Gate register.** All gates in sequence, with what each blocks.

### The feature that matters most

**Select any node → highlight its complete upstream and downstream chains.** Everything else dims. Show
the chain as a list alongside the graph, with the longest-span dependency called out.

This is the whole point of the application. A dependency introduced eight months earlier that only
surfaces at final validation should be *visible by clicking one node*. Build this before you build
anything cosmetic.

### Also required

- **Deep-linkable URLs** — `#/task/M4.3.3` opens that task, focused, chains highlighted. Every view
  shareable.
- **Search** — by ID, name, or owner. `M4.3` should jump straight there.
- **Keyboard navigation** — arrow keys traverse the hierarchy, `/` focuses search, `esc` clears selection.
- **Responsive** — usable on a phone. Graph may degrade to list on small screens.
- **Dark mode default**, light mode toggle.

### Design direction

Dense, technical, legible. Think flight-ops console or an oscilloscope UI — not a SaaS marketing page.
Monospace for IDs. Type badges (PHY/DIG/DOC/HYB) as small colored chips. Gates visually unmistakable.
No decorative animation; transitions only where they aid comprehension of a state change.

Status colors must be unambiguous and must not use green for `AT_RISK` under any circumstance.

---

## 6. Repository layout

```
/program.yaml               ← the only hand-edited file
/schema/program.schema.ts   ← Zod schema + validation
/scripts/generate.ts        ← YAML → JSON + markdown
/scripts/import-markdown.ts ← one-time migration helper (see §8)
/content/                   ← GENERATED markdown
/src/                       ← React app
/public/program.json        ← GENERATED
/.github/workflows/deploy.yml
/README.md
/CLAUDE.md
```

---

## 7. Deployment

GitHub Actions on push to `main`: validate → generate → build → deploy to Pages.
Fail the build on schema violation or on any dependency cycle. Set Vite `base` to the repo name.

**A useful consequence, not an accident:** because the site is static, every status change is a commit.
Status updates become pull requests — which gives you versioned definitions and sign-off as code review
for free. Lean into this. Document it in the README.

---

## 8. Build order

Ship each phase working before starting the next. Do not build ahead.

1. **Schema + validation.** Zod schema, three hand-written sample milestones, validation failing loudly
   on bad input.
2. **Import helper.** One-time script that reads the existing markdown in `datahall-bringup/` and emits
   a first-draft `program.yaml`. Throwaway code — correctness over elegance, human review expected.
3. **Graph computation.** Topological sort, cycle detection, critical path, float, upstream/downstream
   closure. **Unit-tested.** This is the core; everything else renders it.
4. **Generator.** YAML → JSON + all markdown files.
5. **App shell.** Routing, data loading, L0 table view. Deploy to Pages now — get the pipeline working
   while it's simple.
6. **Drill-down.** L0 → L1 → L2, breadcrumbs, deep links.
7. **Graph view + chain highlighting.** The feature from §5.
8. **Timeline view.**
9. **Search, filters, keyboard nav, polish.**

---

## 9. Acceptance criteria

- [ ] `program.yaml` is the only hand-edited source; no generated file is ever edited
- [ ] Every derived value is computed, none stored
- [ ] Build fails loudly on schema violation or dependency cycle
- [ ] `AT_RISK` is never rendered as healthy; aging always visible
- [ ] Clicking any node highlights full upstream and downstream chains
- [ ] Every view is deep-linkable and shareable
- [ ] Generated markdown renders correctly in GitHub **and** Obsidian
- [ ] Nothing domain-specific is hardcoded — a different `program.yaml` produces a working site
- [ ] Graph computation has unit tests
- [ ] Site deploys from a clean clone with `npm install && npm run generate && npm run build`

---

## 10. Non-goals

Explicitly out of scope for v1. Do not build these.

- In-browser editing — edits happen in `program.yaml` via pull request
- Authentication, multi-user, real-time collaboration
- Backend, database, or API
- Resource leveling or schedule optimization
- Import from MS Project or Primavera
- Comments or discussion threads — that's what PRs are for

---

## 11. Working notes for the agent

- **Ask before assuming.** If the spec is ambiguous, ask rather than guessing.
- **Show the plan before large changes.** Especially before phases 3 and 7.
- **Small commits, descriptive messages**, one phase per branch.
- **Run the tests.** If graph computation is wrong, everything downstream is wrong and it will look
  plausible while being incorrect.
- **Never edit files in `content/`.** If output is wrong, fix the generator.
- If a design decision would violate §2, say so and stop rather than working around it.
