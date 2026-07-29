/**
 * The cross-cutting registers — what does not belong to a single milestone.
 *
 * All three are fully derived. The legacy versions were hand-maintained, and
 * the gate register in particular carried an authored "Blocks" column that the
 * import discarded (Q15): successors are computed, so stating them by hand was
 * a second claim to truth about the same edges.
 */

import type { ProgramGraph } from '../../graph/index.js'
import type { Narrative } from './narrative.js'
import {
  GATE,
  code,
  formatDays,
  joinIds,
  link,
  page,
  section,
  table,
} from './markdown.js'

const NAV = [
  link('← Program', '../L0-program.md'),
  link('gates', 'gates.md'),
  link('dependencies', 'dependencies.md'),
  link('parallelization', 'parallelization.md'),
].join(' · ')

/* ── Gate register ─────────────────────────────────────────────────────── */

export function renderGateRegister(graph: ProgramGraph, narrative: Narrative): string {
  const byId = new Map(graph.program.tasks.map((t) => [t.id, t]))
  const gates = graph.order.filter((id) => byId.get(id)?.gate === true)

  const rows = gates.map((id) => {
    const task = byId.get(id)!
    return [
      `${GATE} ${code(id)}`,
      code(id.split('.')[0]!),
      task.criterion ?? '—',
      task.evidence ?? '—',
      joinIds(graph.adjacency.successors.get(id) ?? []),
    ]
  })

  return page('Gate register', [
    NAV,
    '> A **gate** is a task whose exit criteria must be evidenced before any successor begins. Gate\n' +
      '> exit is measured, not asserted. If the criterion is not evidenced the gate is not closed,\n' +
      '> regardless of schedule pressure.',
    section(
      `Gates in sequence (${gates.length})`,
      `${table(['Gate', 'Milestone', 'Criterion', 'Evidence', 'Blocks'], rows)}\n\n` +
        '_In dependency order. **Blocks** is derived from task predecessors — it is what cannot\n' +
        'begin until this gate closes._',
    ),
    narrative.partials.get('registers/gates'),
  ])
}

/* ── Dependency register ───────────────────────────────────────────────── */

export function renderDependencyRegister(graph: ProgramGraph, narrative: Narrative): string {
  const byId = new Map(graph.program.tasks.map((t) => [t.id, t]))
  const edges = graph.pessimistic.crossMilestoneEdges

  const rows = edges.map((edge) => [
    code(edge.from),
    byId.get(edge.from)?.name ?? '',
    code(edge.to),
    byId.get(edge.to)?.name ?? '',
    `${edge.fromMilestone} → ${edge.toMilestone}`,
    edge.spanDays === undefined ? '—' : formatDays(edge.spanDays),
  ])

  return page('Dependency register', [
    NAV,
    '> Dependencies **within** a milestone live in that milestone\'s pages. This register holds the\n' +
      '> cross-milestone ones — the dependencies nobody owns, because they span two owners.',
    section(
      `Cross-milestone edges (${edges.length})`,
      `${table(['From', '', 'To', '', 'Span', 'Reach'], rows)}\n\n` +
        '_Sorted by reach, longest first. **Reach** is the distance in days between the two tasks\'\n' +
        'earliest starts, pessimistic. The long ones are the ones that fail: a decision made months\n' +
        'earlier surfaces at a point where nobody is looking upstream for a cause._',
    ),
    section('Externally controlled', renderExternal(graph)),
    narrative.partials.get('registers/dependencies'),
  ])
}

function renderExternal(graph: ProgramGraph): string {
  const external = graph.program.tasks.filter((t) => t.external)
  if (external.length === 0) return '_None._'

  const rows = external
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((task) => [
      code(task.id),
      task.name,
      task.owners.map((o) => code(o)).join(' + '),
      joinIds(graph.adjacency.successors.get(task.id) ?? []),
    ])

  return (
    `${table(['ID', 'Task', 'Owners', 'Blocks'], rows)}\n\n` +
    '_Controlled outside the programme — permits, carriers, vendors, inspection queues. Track these\n' +
    'weekly against the controlling party\'s own milestones rather than their quoted date._'
  )
}

/* ── Parallelization register ──────────────────────────────────────────── */

export function renderParallelizationRegister(
  graph: ProgramGraph,
  narrative: Narrative,
): string {
  return page('Parallelization register', [
    NAV,
    '> What can run at the same time, what cannot, and where parallel lanes collapse into a single\n' +
      '> point. Every figure is derived from the pessimistic schedule.',
    section('Convergence points', renderConvergence(graph)),
    section('Concurrent packages', renderConcurrentPackages(graph)),
    section('Owner contention', renderContention(graph)),
    narrative.partials.get('registers/parallelization'),
  ])
}

/**
 * Where several independent lanes collapse onto one task.
 *
 * Counted by distinct predecessor PACKAGES rather than predecessor tasks: three
 * predecessors from one package is a sequence, three from three packages is a
 * convergence, and only the second is a scheduling pressure point.
 */
function renderConvergence(graph: ProgramGraph): string {
  const byId = new Map(graph.program.tasks.map((t) => [t.id, t]))

  const points = graph.order
    .map((id) => {
      const ownPackage = id.split('.').slice(0, 2).join('.')
      const predecessors = graph.adjacency.predecessors.get(id) ?? []
      // A predecessor in the task's OWN package is a sequence, not a lane.
      // Counting it would report "M2.4.2 merges 2 lanes" for a task that
      // simply follows its neighbour and takes one feed from elsewhere.
      const lanes = new Set(
        predecessors
          .map((p) => p.split('.').slice(0, 2).join('.'))
          .filter((p) => p !== ownPackage),
      )
      return { id, lanes, predecessors }
    })
    .filter((p) => p.lanes.size >= 2)
    .sort((a, b) => b.lanes.size - a.lanes.size || (a.id < b.id ? -1 : 1))

  if (points.length === 0) return '_None._'

  const rows = points.map((point) => [
    code(point.id),
    byId.get(point.id)?.name ?? '',
    String(point.lanes.size),
    joinIds([...point.lanes].sort()),
  ])

  return (
    `${table(['Task', '', 'Lanes', 'Merging'], rows)}\n\n` +
    '_A task fed **directly** by two or more other packages. **The last lane sets the date** —\n' +
    'managing the average of a convergence is meaningless; track the slowest feeder and staff\n' +
    'against it._\n\n' +
    '_Counted on immediate predecessors only. A lane that reaches a task through an intermediate\n' +
    'package is real but is not counted here, so this list is narrower than an eye-judged one._'
  )
}

/** Packages inside one milestone whose windows overlap — genuine parallelism. */
function renderConcurrentPackages(graph: ProgramGraph): string {
  const rows: string[][] = []

  for (const milestone of graph.program.milestones) {
    const children = graph.milestones.get(milestone.id)!.childIds
    const groups: string[][] = []

    for (const packageId of children) {
      const a = graph.pessimistic.packages.get(packageId)!
      const concurrent = children.filter((other) => {
        if (other === packageId) return false
        const b = graph.pessimistic.packages.get(other)!
        return a.earliestStart < b.earliestFinish && b.earliestStart < a.earliestFinish
      })
      if (concurrent.length > 0) groups.push([packageId, ...concurrent])
    }

    // Deduplicate: the same overlapping set appears once per member.
    const unique = new Set(groups.map((g) => [...g].sort().join(',')))
    for (const key of [...unique].sort()) {
      const members = key.split(',')
      const starts = members.map((id) => graph.pessimistic.packages.get(id)!.earliestStart)
      const ends = members.map((id) => graph.pessimistic.packages.get(id)!.earliestFinish)
      rows.push([
        code(milestone.id),
        joinIds(members),
        String(members.length),
        `day ${Math.min(...starts)}–${Math.max(...ends)}`,
      ])
    }
  }

  if (rows.length === 0) return '_No packages overlap._'

  return (
    `${table(['Milestone', 'Packages', 'Count', 'Window'], rows)}\n\n` +
    '_Packages whose scheduled windows overlap, so they can be staffed concurrently._'
  )
}

function renderContention(graph: ProgramGraph): string {
  const rows = [...graph.pessimistic.contention.values()]
    .filter((role) => role.peakConcurrency > 1)
    .sort((a, b) => b.peakConcurrency - a.peakConcurrency || (a.role < b.role ? -1 : 1))
    .map((role) => [
      code(role.role),
      String(role.peakConcurrency),
      String(role.overlaps.length),
      role.peakWindow === undefined
        ? '—'
        : `day ${role.peakWindow.start}–${role.peakWindow.end}`,
    ])

  if (rows.length === 0) return '_No owner is scheduled against itself._'

  return (
    `${table(['Owner', 'Peak concurrent tasks', 'Overlapping pairs', 'Peak window'], rows)}\n\n` +
    '_The schedule assumes a role can do everything asked of it at once. **There is no capacity\n' +
    'figure in the model**, so this is not a finding on its own — a role with a peak of five may\n' +
    'have five crews or one. It is the list of places to check._'
  )
}
