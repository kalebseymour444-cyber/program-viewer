/**
 * content/L2-tasks/M{n}-tasks.md — one per milestone, the full task table.
 *
 * Successors are shown alongside predecessors even though only predecessors are
 * authored. "Who is waiting on me" is the question an execution team actually
 * asks, and it is derived, so it costs nothing to answer here.
 */

import type { Milestone } from '../../schema/program.schema.js'
import type { ProgramGraph } from '../../graph/index.js'
import type { Narrative } from './narrative.js'
import {
  GATE,
  code,
  formatDays,
  formatDuration,
  formatStatusWithAging,
  joinIds,
  link,
  page,
  section,
  table,
} from './markdown.js'

export function renderL2(
  milestone: Milestone,
  graph: ProgramGraph,
  narrative: Narrative,
): string {
  const rollup = graph.milestones.get(milestone.id)!
  const byId = new Map(graph.program.tasks.map((t) => [t.id, t]))

  const breadcrumb = [
    link('Program', '../L0-program.md'),
    link(milestone.id, `../L1-milestones/${milestone.id}.md`),
    'Tasks',
  ].join(' / ')

  // Topological order, not ID order: the table reads in the order work happens.
  const ordered = graph.order.filter((id) => rollup.taskIds.includes(id))

  const rows = ordered.map((id) => {
    const task = byId.get(id)!
    const pessimistic = graph.pessimistic.schedule.tasks.get(id)!

    return [
      code(id),
      `${task.gate ? `${GATE} ` : ''}${task.name}${task.external ? ' _(external)_' : ''}`,
      task.type,
      task.owners.map((o) => code(o)).join(' + '),
      formatDuration(task.duration),
      joinIds(task.predecessors),
      joinIds(graph.adjacency.successors.get(id) ?? []),
      formatDays(pessimistic.float),
      formatStatusWithAging(task.status, task.status_since),
    ]
  })

  return page(`${milestone.id} — Tasks`, [
    breadcrumb,
    narrative.partials.get(`lead/${milestone.id}-tasks`),
    table(
      [
        'ID',
        'Task',
        'Type',
        'Owners',
        'Duration',
        'Predecessors',
        'Successors',
        'Float',
        'Status',
      ],
      rows,
    ),
    TABLE_NOTE,
    section('Task notes', renderTaskNotes(ordered, byId)),
    narrative.partials.get(`${milestone.id}-tasks`),
  ])
}

const TABLE_NOTE = [
  '_Rows are in dependency order, not ID order — the table reads in the order the work happens._',
  '_Successors and float are derived. Float is pessimistic; a zero-float task cannot slip at all',
  'without moving the programme finish. `(external)` marks work controlled outside the programme._',
].join('\n')

function renderTaskNotes(
  ordered: readonly string[],
  byId: ReadonlyMap<string, { note?: string }>,
): string | undefined {
  const notes = ordered
    .filter((id) => byId.get(id)?.note !== undefined)
    .map((id) => `- ${code(id)} — ${byId.get(id)!.note}`)

  return notes.length === 0 ? undefined : notes.join('\n')
}
