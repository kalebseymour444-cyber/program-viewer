# Layered Program Viewer

A program structure documented at three levels of abstraction, where every element at one level
resolves downward into the level beneath it — and where **every rolled-up figure is computed, never
written down twice.**

The example content is a data hall deployment programme: 8 milestones, 58 work packages, 204 tasks,
with typed dependencies, gates, owners and durations. Nothing about data centres is hardcoded — a
different `program.yaml` produces a working site.

---

## The one architectural rule

**`program.yaml` is the single machine-readable source of truth. Everything else is generated.**

```
program.yaml  ──generate──▶  content/**.md       readable in GitHub and Obsidian
   +                      └▶ public/program.json  consumed by the app
narrative/**.md  (prose, spliced in verbatim)
```

`content/` and `public/program.json` are **build artifacts**. Never edit them; if the output is
wrong, fix the generator. Nothing ever parses generated markdown to recover structure.

**Why this is non-negotiable:** if the three levels are maintained as three hand-written documents,
they are aligned on day one and divergent within weeks — three claims to truth with no way to
adjudicate which is right. The rollup has to be *derived*, never authored alongside the detail.

This is not theoretical. Migrating the original hand-written documents surfaced four assertions the
data did not support, including one where the model claimed clusters went live 48 days **before** the
network was accepted. See [`docs/open-questions.md`](docs/open-questions.md).

---

## Quick start

```bash
npm install
npm run generate     # program.yaml -> content/ + public/program.json
npm run dev          # http://localhost:5173
```

| Command | Does |
|---|---|
| `npm run validate` | Schema, cross-references, and dependency cycles |
| `npm run generate` | Regenerate `content/` and `public/program.json` |
| `npm test` | Full suite — graph computation above all |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run dev` | Vite dev server |
| `npm run build` | Validate, generate, then build for production |

---

## Editing the programme

Edit `program.yaml`. Then:

```bash
npm run generate && npm test
```

Commit `program.yaml` **and** the regenerated `content/` and `public/program.json` together. CI fails
if they disagree.

Prose lives in [`narrative/`](narrative/README.md) and is spliced into the generated pages verbatim.
It must contain **no structural claims** — no durations, no dependency assertions, no counts. If a
sentence would need editing after someone adds a task, it does not belong there.

### Status changes are pull requests

Because the site is static, every status change is a commit. That is a useful consequence rather than
an accident: status updates become pull requests, which gives you versioned definitions and sign-off
as code review for free.

A status change is a two-line diff in `program.yaml` plus its regenerated output — reviewable, dated,
attributable, and revertible.

---

## What gets computed

Authored on tasks only: durations, predecessors, gate criteria, evidence, owners, status.

Everything else is derived, and cannot drift:

- Milestone and package dependencies, rolled up from task predecessors
- Duration, earliest start and finish, float, critical path
- Rolled-up status — worst case, never averaged, never rounded toward optimism
- Full upstream and downstream closure for any node
- Cross-milestone edges, sorted by reach
- Owner contention

**Durations are ranges,** so the whole schedule is computed twice — optimistic and pessimistic. These
are not one schedule scaled: the critical path can be a genuinely **different path** at each end. Any
figure shown without a scenario label is only half an answer.

---

## Layout

```
program.yaml               the only hand-edited data file
narrative/                 hand-written prose, spliced in verbatim
schema/                    Zod schema, referential integrity
graph/                     derived computation — CPM, closure, rollups
scripts/                   generator and validator
content/                   GENERATED markdown
public/program.json        GENERATED app input
src/                       React app
datahall-bringup/          pre-migration source, kept for reference
```

---

## Deploying

Push to `main`. The workflow validates, tests, typechecks, regenerates, verifies the committed output
matches, builds, and deploys to GitHub Pages. The Pages base path is derived from the repository name,
so nothing needs configuring when the repo is renamed or forked.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
