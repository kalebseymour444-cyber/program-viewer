#!/usr/bin/env tsx
/**
 * ONE-TIME MIGRATION HELPER — throwaway code (SPEC §8 phase 2).
 *
 * Reads the hand-written markdown in datahall-bringup/ and emits a first-draft
 * program.yaml plus a review report. Run once, review the output by hand, then
 * this script is dead. Do not import it, do not depend on it, do not tidy it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONLY MARKDOWN PARSER ALLOWED IN THIS REPOSITORY.
 *
 * It exists to END markdown-as-source, not to sustain it. Once program.yaml is
 * reviewed and committed, datahall-bringup/ is a historical artifact and this
 * file has no reason to run again. If you find yourself reaching for a markdown
 * parser anywhere else — especially in the generator — the architecture has
 * been inverted (SPEC §2).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two principles, because they are what makes the output trustworthy:
 *
 *   1. IMPORT WHAT IS WRITTEN, NEVER WHAT IS MEANT. The legacy L0 asserts
 *      milestone dependencies that its own task tables do not support. This
 *      script does NOT reconcile them. It imports the task edges — the only
 *      authored dependencies under SPEC §3 — and reports the disagreement.
 *      Deciding which one is true is a human's job, not a regex's.
 *
 *   2. EVERY GUESS IS REPORTED. Anything invented, defaulted or dropped lands
 *      in docs/import-review.md. A migration that quietly fills gaps produces a
 *      file that looks authoritative and isn't.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { stringify } from 'yaml'

const SOURCE_DIR = resolve(process.cwd(), 'datahall-bringup')
const OUT_YAML = resolve(process.cwd(), 'program.yaml')
const OUT_REVIEW = resolve(process.cwd(), 'docs/import-review.md')

/* ── Review log ────────────────────────────────────────────────────────── */

interface ReviewEntry {
  section: string
  detail: string
}
const review: ReviewEntry[] = []
const note = (section: string, detail: string) => review.push({ section, detail })

/* ── Markdown table reading ────────────────────────────────────────────── */

type Row = string[]

/** Every pipe table in the document, as raw cell strings. */
function readTables(markdown: string): Row[][] {
  const tables: Row[][] = []
  let current: Row[] | null = null

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      if (current === null) {
        current = []
        tables.push(current)
      }
      current.push(cells)
    } else if (line === '' || !line.startsWith('|')) {
      current = null
    }
  }

  // Drop the |---|---| separator row from each table.
  return tables.map((rows) => rows.filter((row) => !row.every((c) => /^:?-{2,}:?$/.test(c))))
}

/** The first table whose header row contains all of `headers` (case-insensitive). */
function findTable(markdown: string, headers: string[]): Row[] {
  for (const table of readTables(markdown)) {
    const head = table[0]
    if (!head) continue
    const lower = head.map((h) => h.toLowerCase())
    if (headers.every((h) => lower.some((cell) => cell.includes(h.toLowerCase())))) {
      return table.slice(1)
    }
  }
  return []
}

/* ── Cell cleaning ─────────────────────────────────────────────────────── */

const GATE_MARK = '🚨'

/** Strip markdown emphasis, code ticks, links and the gate siren from a cell. */
function clean(cell: string): string {
  return cell
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](link) -> text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(new RegExp(GATE_MARK, 'g'), '')
    .replace(/\s+/g, ' ')
    .trim()
}

const isGate = (cell: string) => cell.includes(GATE_MARK)

/** An em dash alone means "none stated". */
const isBlank = (cell: string) => {
  const c = clean(cell)
  return c === '' || c === '—' || c === '-' || c === '–'
}

/* ── Field parsers ─────────────────────────────────────────────────────── */

/**
 * "3d" -> {min:3,max:3} · "20–90d" -> {min:20,max:90} · "—" -> undefined
 *
 * Note the durations here are as-written. SPEC §3 calls them working days, but
 * the externally-controlled ones (permitting at 20–90d, carrier provisioning at
 * 30–120d) are near-certainly calendar days. That ambiguity is Q19 and is NOT
 * resolved by this script — the numbers are carried across unchanged.
 */
function parseDuration(cell: string): { min: number; max: number } | undefined {
  if (isBlank(cell)) return undefined
  const text = clean(cell)

  const range = text.match(/(\d+)\s*[–—-]\s*(\d+)/)
  if (range) return { min: Number(range[1]), max: Number(range[2]) }

  const single = text.match(/(\d+)/)
  if (single) {
    const n = Number(single[1])
    return { min: n, max: n }
  }

  note('Unparsed durations', `"${text}" could not be read as a duration — imported as absent`)
  return undefined
}

/** "CX + PM" / "MECH/CX" / "ICT + NET-R" -> ["CX","PM"]. Never splits on "-" (NET-R). */
function parseOwners(cell: string): string[] {
  const text = clean(cell)
  if (text === '') return []
  return text
    .split(/\s*[+/]\s*/)
    .map((o) => o.trim())
    .filter((o) => o !== '')
}

/**
 * "M4.4.1, M4.3.7" -> [...] · "—" -> [] · "construction" -> [] plus external.
 *
 * `construction` is not a task ID. Per decision D5 it becomes an external
 * anchor: the task is a root whose start is determined outside the program.
 */
function parsePredecessors(cell: string, taskId: string): { ids: string[]; external: boolean } {
  if (isBlank(cell)) return { ids: [], external: false }

  const parts = clean(cell)
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p !== '')

  const ids: string[] = []
  let external = false

  for (const part of parts) {
    if (/^[A-Za-z][\w-]*\.[\w-]+\.[\w-]+$/.test(part)) {
      ids.push(part)
    } else {
      external = true
      note(
        'External anchors (D5)',
        `${taskId}: predecessor "${part}" is not a task ID — imported as external: true with no predecessors`,
      )
    }
  }

  return { ids, external }
}

/* ── Sources ───────────────────────────────────────────────────────────── */

const read = (file: string) => readFileSync(join(SOURCE_DIR, file), 'utf8')

const files = readdirSync(SOURCE_DIR)
const taskFiles = files.filter((f) => /^M\d+-tasks\.md$/.test(f)).sort()
const packageFiles = files.filter((f) => /^M\d+-/.test(f) && !/-tasks\.md$/.test(f)).sort()

const milestoneOf = (file: string) => file.match(/^(M\d+)-/)![1]!

/* ── 1. Roles, from conventions.md ─────────────────────────────────────── */

function importRoles(): { id: string; name: string }[] {
  const text = read('conventions.md')
  const section = text.split('## Owner roles')[1]?.split('---')[0] ?? ''

  const roles: { id: string; name: string }[] = []
  for (const chunk of section.split('·')) {
    const match = chunk.match(/`([A-Za-z][\w-]*)`\s*([^`]*)/)
    if (!match) continue
    const name = match[2]!.replace(/\s+/g, ' ').trim()
    if (name === '') continue
    roles.push({
      id: match[1]!,
      // Title-case the description: conventions.md writes them lowercase.
      name: name.charAt(0).toUpperCase() + name.slice(1),
    })
  }
  return roles
}

/* ── 2. Milestones, from L0-program.md ─────────────────────────────────── */

function importMilestones() {
  const text = read('L0-program.md')

  const nameRows = findTable(text, ['ID', 'Milestone', 'Gate', 'Duration'])
  const stateRows = findTable(text, ['ID', 'State', 'Approver'])

  const approvers = new Map<string, string>()
  for (const row of stateRows) {
    const id = clean(row[0] ?? '')
    const approver = clean(row[row.length - 1] ?? '')
    if (id !== '' && approver !== '') approvers.set(id, approver)
  }

  const milestones = []
  for (const row of nameRows) {
    const id = clean(row[0] ?? '')
    const name = clean(row[1] ?? '')
    if (!/^M\d+$/.test(id)) continue

    const approver = approvers.get(id)
    if (approver === undefined) {
      note('Missing approvers', `${id} has no approver in the L0 states table — needs one`)
    }

    if (isGate(row[2] ?? '')) {
      note(
        'Dropped: authored gate flags (D7)',
        `${id} was marked as a gate milestone. Gate is authored on tasks only; the rollup is derived (Q24)`,
      )
    }
    if (!isBlank(row[4] ?? '')) {
      note(
        'Dropped: authored durations',
        `${id} stated duration "${clean(row[4] ?? '')}" — milestone duration is derived from tasks (SPEC §3)`,
      )
    }
    if (!isBlank(row[3] ?? '')) {
      note(
        'Dropped: authored dependencies',
        `${id} stated "depends on ${clean(row[3] ?? '')}" — milestone dependencies roll up from task predecessors (SPEC §3). See the reconciliation section below`,
      )
    }

    milestones.push({ id, name, approver: approver ?? 'PM' })
  }
  return milestones
}

/** The authored "Depends on" column, kept only to diff against the derived graph. */
function authoredMilestoneDeps(): Map<string, string[]> {
  const rows = findTable(read('L0-program.md'), ['ID', 'Milestone', 'Gate', 'Duration'])
  const map = new Map<string, string[]>()
  for (const row of rows) {
    const id = clean(row[0] ?? '')
    if (!/^M\d+$/.test(id)) continue
    const cell = row[3] ?? ''
    map.set(
      id,
      isBlank(cell)
        ? []
        : clean(cell)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    )
  }
  return map
}

/* ── 3. Packages, from the L1 milestone files ──────────────────────────── */

function importPackages() {
  const packages = []
  for (const file of packageFiles) {
    const milestone = milestoneOf(file)
    const rows = findTable(read(file), ['ID', 'Package', 'Type', 'Owner'])

    if (rows.length === 0) {
      note('Unreadable files', `${file}: no work package table found`)
      continue
    }

    for (const row of rows) {
      const id = clean(row[0] ?? '')
      if (!/^M\d+\.\d+$/.test(id)) continue

      if (isGate(row[1] ?? '')) {
        note(
          'Dropped: authored gate flags (D7)',
          `${id} was marked as a gate package. Gate is authored on tasks only; the rollup is derived (Q24)`,
        )
      }

      packages.push({
        id,
        milestone,
        name: clean(row[1] ?? ''),
        type: clean(row[2] ?? ''),
        owners: parseOwners(row[3] ?? ''),
      })
    }
  }
  return packages
}

/* ── 4. Tasks, from the L2 task files ──────────────────────────────────── */

interface DraftTask {
  id: string
  package: string
  name: string
  type: string
  owners: string[]
  duration?: { min: number; max: number }
  predecessors: string[]
  gate?: boolean
  criterion?: string
  evidence?: string
  external?: boolean
}

function importTasks(): DraftTask[] {
  const tasks: DraftTask[] = []

  for (const file of taskFiles) {
    const rows = findTable(read(file), ['ID', 'Task', 'Type', 'Owner'])
    if (rows.length === 0) {
      note('Unreadable files', `${file}: no task table found`)
      continue
    }

    for (const row of rows) {
      const id = clean(row[0] ?? '')
      if (!/^M\d+\.\d+\.\d+$/.test(id)) continue

      const nameCell = row[1] ?? ''
      const { ids, external } = parsePredecessors(row[5] ?? '', id)

      const task: DraftTask = {
        id,
        package: id.slice(0, id.lastIndexOf('.')),
        name: clean(nameCell),
        type: clean(row[2] ?? ''),
        owners: parseOwners(row[3] ?? ''),
        predecessors: ids,
      }

      const duration = parseDuration(row[4] ?? '')
      if (duration) task.duration = duration
      if (isGate(nameCell)) task.gate = true
      if (external) task.external = true

      tasks.push(task)
    }
  }

  return tasks
}

/* ── 5. Gate criteria and evidence, from the gate register ─────────────── */

function applyGateRegister(tasks: DraftTask[]) {
  const rows = findTable(read('gates.md'), ['Gate', 'Criterion', 'Blocks', 'Evidence'])
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const matched = new Set<string>()

  for (const row of rows) {
    const raw = clean(row[0] ?? '')
    if (raw === '') continue

    // "M7.3.2/3" is two gates written as one row. Split it.
    const ids: string[] = []
    const compound = raw.match(/^(M\d+\.\d+)\.(\d+(?:\/\d+)+)$/)
    if (compound) {
      for (const n of compound[2]!.split('/')) ids.push(`${compound[1]}.${n}`)
      note(
        'Compound gate IDs split',
        `gates.md row "${raw}" covered more than one task — split into ${ids.join(', ')}`,
      )
    } else {
      ids.push(raw)
    }

    for (const id of ids) {
      const task = byId.get(id)
      if (!task) {
        note(
          'Gate register entries with no task',
          `gates.md lists "${id}" but no task table defines it — dropped`,
        )
        continue
      }
      task.gate = true
      task.criterion = clean(row[1] ?? '')
      task.evidence = clean(row[row.length - 1] ?? '')
      matched.add(id)
    }

    // The "Blocks" column is authored and must not survive: successors are derived.
    if (!isBlank(row[2] ?? '')) {
      note(
        'Dropped: authored "Blocks" column (Q15)',
        `${raw} stated it blocks "${clean(row[2] ?? '')}" — successors are derived from task predecessors`,
      )
    }
  }

  // A gate with no criterion cannot validate, and inventing one silently would
  // be exactly the "criteria written after the work" anti-pattern gates.md names.
  for (const task of tasks) {
    if (task.gate && !matched.has(task.id)) {
      task.criterion = 'TODO — marked as a gate in the task table but absent from the gate register'
      task.evidence = 'TODO — no evidence defined'
      note(
        'GATES NEEDING CRITERIA — must be written before this file is trusted',
        `${task.id} "${task.name}" is flagged 🚨 in the task table but has no entry in gates.md. Placeholder criterion and evidence inserted so the file validates`,
      )
    }
  }
}

/* ── 6. External flags, from the dependency register ───────────────────── */

function applyExternalFlags(tasks: DraftTask[]) {
  const text = read('dependencies.md')
  const section = text.split('## Externally controlled')[1] ?? ''
  const byId = new Map(tasks.map((t) => [t.id, t]))

  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('-')) continue
    const match = line.match(/\*\*(M[\d.]+)\*\*/)
    if (!match) continue

    const id = match[1]!
    const task = byId.get(id)
    if (task) {
      task.external = true
    } else {
      note(
        'Unmappable external flags',
        `dependencies.md marks "${id}" as externally controlled, but it is not a task ` +
          `(external is a task-level flag). Set it on the relevant tasks by hand`,
      )
    }
  }
}

/* ── 7. Reconcile derived milestone edges against the authored ones ────── */

function reconcileMilestoneDependencies(tasks: DraftTask[]) {
  const milestoneOfTask = (id: string) => id.split('.')[0]!

  const derived = new Map<string, Set<string>>()
  for (const task of tasks) {
    const to = milestoneOfTask(task.id)
    for (const pred of task.predecessors) {
      const from = milestoneOfTask(pred)
      if (from === to) continue
      if (!derived.has(to)) derived.set(to, new Set())
      derived.get(to)!.add(from)
    }
  }

  const authored = authoredMilestoneDeps()
  const lines: string[] = []

  for (const [milestone, statedRaw] of authored) {
    // The L0 table cites packages ("M4.1") where it means milestones.
    const stated = new Set(statedRaw.map((s) => s.split('.')[0]!))
    const computed = derived.get(milestone) ?? new Set<string>()

    const missing = [...stated].filter((m) => !computed.has(m))
    const extra = [...computed].filter((m) => !stated.has(m))
    if (missing.length === 0 && extra.length === 0) continue

    const parts: string[] = []
    if (missing.length > 0) {
      parts.push(
        `**asserted but not supported by any task edge: ${missing.join(', ')}** — either an edge is missing from the task tables, or the claim was never true`,
      )
    }
    if (extra.length > 0) {
      parts.push(`derived from task edges but not stated in L0: ${extra.join(', ')}`)
    }
    lines.push(`${milestone}: ${parts.join('; ')}`)
  }

  for (const line of lines) {
    note('DEPENDENCY RECONCILIATION — authored L0 vs derived graph', line)
  }
}

/* ── Review report ─────────────────────────────────────────────────────── */

function writeReview(counts: Record<string, number>) {
  const grouped = new Map<string, string[]>()
  for (const { section, detail } of review) {
    if (!grouped.has(section)) grouped.set(section, [])
    grouped.get(section)!.push(detail)
  }

  const body = [...grouped.entries()]
    .map(([section, details]) => {
      const items = details.map((d) => `- ${d}`).join('\n')
      return `## ${section}\n\n_${details.length} item${details.length === 1 ? '' : 's'}_\n\n${items}`
    })
    .join('\n\n')

  const header = `# Import review

Generated by \`scripts/import-markdown.ts\` from \`datahall-bringup/\`.
**\`program.yaml\` is a first draft and is not trustworthy until this list is worked through.**

Imported: ${counts.roles} roles · ${counts.milestones} milestones · ${counts.packages} packages · ${counts.tasks} tasks
(${counts.gates} gates, ${counts.external} externally controlled, ${counts.noDuration} with no duration)

Read the two capitalised sections first. Everything else is informational — a
record of what was dropped and why, so that nothing looks like it went missing
silently.

Prose was not imported at all: seam notes, exit criteria, parallel-lane
commentary and the definition-of-done contract have nowhere to live in the
schema yet. That is Q6 in open-questions.md and it is unresolved — do not delete
\`datahall-bringup/\` until it is.

---

`

  writeFileSync(OUT_REVIEW, header + body + '\n', 'utf8')
}

/* ── Main ──────────────────────────────────────────────────────────────── */

// This script ran once. program.yaml is now the single hand-edited source of
// truth, and a second run would silently replace a reviewed file with a fresh
// draft of the legacy markdown — losing every correction made since. Refuse.
if (existsSync(OUT_YAML) && !process.argv.includes('--force')) {
  console.error(
    'program.yaml already exists — refusing to overwrite it.\n\n' +
      'This is a ONE-TIME migration helper (SPEC §8 phase 2) and it has already run.\n' +
      'program.yaml is now the single hand-edited source of truth; re-importing would\n' +
      'discard every review correction made to it since.\n\n' +
      'If you genuinely mean to regenerate the draft from datahall-bringup/ and lose\n' +
      'those edits, commit your work first and pass --force.',
  )
  process.exit(1)
}

const roles = importRoles()
const milestones = importMilestones()
const packages = importPackages()
const tasks = importTasks()

applyGateRegister(tasks)
applyExternalFlags(tasks)
reconcileMilestoneDependencies(tasks)

// Roles referenced by tasks or packages but never registered in conventions.md.
const known = new Set(roles.map((r) => r.id))
const referenced = new Set<string>()
for (const p of packages) for (const o of p.owners) referenced.add(o)
for (const t of tasks) for (const o of t.owners) referenced.add(o)
for (const m of milestones) referenced.add(m.approver)
for (const id of [...referenced].sort()) {
  if (!known.has(id)) {
    note('Unregistered roles', `"${id}" is used as an owner or approver but is not in conventions.md`)
  }
}

const program = {
  program: {
    id: 'datahall-bringup',
    name: 'Data Hall Bring-Up',
    description: 'Meet-me room to clusters live',
  },
  roles,
  milestones,
  packages,
  tasks,
}

const banner = `# FIRST DRAFT — imported from datahall-bringup/ by scripts/import-markdown.ts.
# Reviewed by: (nobody yet)
#
# Read docs/import-review.md before trusting anything in this file. It lists
# every guess, every dropped field, and every place the legacy L0 disagrees
# with the dependency graph its own task tables describe.
#
# From here on this file is the single hand-edited source of truth (SPEC §2).
# content/ and public/program.json are generated from it and must never be
# edited directly.

`

writeFileSync(OUT_YAML, banner + stringify(program, { lineWidth: 0 }), 'utf8')

const counts = {
  roles: roles.length,
  milestones: milestones.length,
  packages: packages.length,
  tasks: tasks.length,
  gates: tasks.filter((t) => t.gate).length,
  external: tasks.filter((t) => t.external).length,
  noDuration: tasks.filter((t) => !t.duration).length,
}
writeReview(counts)

console.log(`program.yaml      ${counts.milestones} milestones · ${counts.packages} packages · ${counts.tasks} tasks`)
console.log(`                  ${counts.gates} gates · ${counts.external} external · ${counts.noDuration} with no duration`)
console.log(`docs/import-review.md   ${review.length} items needing review`)
console.log(`\nNext: npm run validate`)
