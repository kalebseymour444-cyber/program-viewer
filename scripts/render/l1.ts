/**
 * content/L1-milestones/M{n}.md — one per milestone.
 *
 * Work packages, the local dependency graph, and exit criteria derived from
 * the gate tasks beneath the milestone (decision D11). The exit criteria are
 * NOT authored: they used to be, and they were a restatement of gate criteria
 * already on the tasks — exactly the duplication SPEC §2 exists to prevent.
 */

import type { Milestone } from '../../schema/program.schema.js'
import type { ProgramGraph } from '../../graph/index.js'
import type { Narrative } from './narrative.js'
import {
  GATE,
  code,
  formatDays,
  formatStatusWithAging,
  gateBadge,
  gateCell,
  joinIds,
  link,
  mermaid,
  mermaidId,
  mermaidLabel,
  page,
  section,
  table,
} from './markdown.js'

export function renderL1(
  milestone: Milestone,
  graph: ProgramGraph,
  narrative: Narrative,
): string {
  const rollup = graph.milestones.get(milestone.id)!
  const optimistic = graph.optimistic.milestones.get(milestone.id)!
  const pessimistic = graph.pessimistic.milestones.get(milestone.id)!

  const breadcrumb = `${link('Program', '../L0-program.md')} / ${code(milestone.id)}`

  const facts = table(
    ['', ''],
    [
      ['Approver', code(milestone.approver)],
      ['Status', formatStatusWithAging(rollup.status, undefined)],
      ['Depends on', joinIds(rollup.dependsOn)],
      ['Feeds', joinIds(rollup.feeds)],
      [
        'Duration',
        optimistic.duration === pessimistic.duration
          ? formatDays(pessimistic.duration)
          : `${optimistic.duration}–${pessimistic.duration}d`,
      ],
      ['Float', formatDays(pessimistic.float)],
      ['Gates', gateCell(rollup.gateCount)],
      ['Tasks', String(rollup.taskIds.length)],
    ],
  )

  const packageRows = rollup.childIds.map((packageId) => {
    const pkg = graph.program.packages.find((p) => p.id === packageId)!
    const packageRollup = graph.packages.get(packageId)!
    const scheduled = graph.pessimistic.packages.get(packageId)!

    return [
      code(packageId),
      pkg.name,
      pkg.type,
      pkg.owners.map((o) => code(o)).join(' + '),
      gateCell(packageRollup.gateCount),
      joinIds(packageRollup.dependsOn),
      formatDays(scheduled.duration),
      formatStatusWithAging(packageRollup.status, undefined),
    ]
  })

  return page(`${milestone.id} — ${milestone.name}`, [
    breadcrumb,
    narrative.partials.get(`lead/${milestone.id}`),
    facts,
    section(
      'Work packages',
      `${table(
        ['ID', 'Package', 'Type', 'Owners', 'Gates', 'Depends on', 'Duration', 'Status'],
        packageRows,
      )}\n\n${link('All tasks →', `../L2-tasks/${milestone.id}-tasks.md`)}`,
    ),
    section('Local sequence', renderPackageGraph(milestone, graph)),
    section('Exit criteria', renderExitCriteria(milestone, graph)),
    narrative.partials.get(milestone.id),
    renderPackageNarratives(milestone, graph, narrative),
  ])
}

function renderPackageGraph(milestone: Milestone, graph: ProgramGraph): string {
  const rollup = graph.milestones.get(milestone.id)!
  const lines = ['graph LR']
  const external = new Set<string>()

  for (const packageId of rollup.childIds) {
    const pkg = graph.program.packages.find((p) => p.id === packageId)!
    const packageRollup = graph.packages.get(packageId)!
    const label = `${packageId} ${pkg.name}${gateBadge(packageRollup.gateCount)}`
    lines.push(`    ${mermaidId(packageId)}[${mermaidLabel(label)}]`)
  }

  for (const packageId of rollup.childIds) {
    for (const dependency of graph.packages.get(packageId)!.dependsOn) {
      // A dependency on another milestone's package is drawn as an entry point,
      // so the local graph shows where the milestone is fed from rather than
      // pretending it begins in a vacuum.
      if (!rollup.childIds.includes(dependency)) external.add(dependency)
      lines.push(`    ${mermaidId(dependency)} --> ${mermaidId(packageId)}`)
    }
  }

  for (const dependency of [...external].sort()) {
    lines.push(`    ${mermaidId(dependency)}[${mermaidLabel(`${dependency} (external)`)}]`)
  }

  if (external.size > 0) {
    lines.push('    classDef external stroke-dasharray:4')
    lines.push(`    class ${[...external].sort().map(mermaidId).join(',')} external`)
  }

  const note =
    external.size > 0
      ? '\n\n_Dashed nodes are packages in other milestones that feed this one._'
      : ''

  return mermaid(lines) + note
}

/**
 * Derived from gate tasks (D11) — never authored.
 *
 * A gate is a task whose exit criteria must be evidenced before any successor
 * begins, so the milestone's exit criteria simply ARE the criteria of the gates
 * beneath it. Authoring them separately is how the two versions drift.
 */
function renderExitCriteria(milestone: Milestone, graph: ProgramGraph): string {
  const rollup = graph.milestones.get(milestone.id)!
  if (rollup.gateTaskIds.length === 0) {
    return '_This milestone contains no gate tasks, so it has no evidenced exit criteria._'
  }

  const byId = new Map(graph.program.tasks.map((t) => [t.id, t]))
  const ordered = graph.order.filter((id) => rollup.gateTaskIds.includes(id))

  const rows = ordered.map((id) => {
    const task = byId.get(id)!
    return [
      `${GATE} ${code(id)}`,
      task.criterion ?? '—',
      task.evidence ?? '—',
      joinIds(graph.adjacency.successors.get(id) ?? []),
    ]
  })

  return [
    table(['Gate', 'Criterion — what must be evidenced', 'Evidence', 'Blocks'], rows),
    '',
    '_Derived from the gate tasks in this milestone. Gate exit is measured, not asserted: if the',
    'criterion is not evidenced, the gate is not closed. **Blocks** lists the immediate successors',
    'that cannot begin until it is._',
  ].join('\n')
}

/** Package-level commentary, appended under its own heading so it is findable. */
function renderPackageNarratives(
  milestone: Milestone,
  graph: ProgramGraph,
  narrative: Narrative,
): string | undefined {
  const rollup = graph.milestones.get(milestone.id)!
  const blocks: string[] = []

  for (const packageId of rollup.childIds) {
    const prose = narrative.partials.get(packageId)
    if (prose === undefined) continue
    const pkg = graph.program.packages.find((p) => p.id === packageId)!
    blocks.push(`### ${packageId} — ${pkg.name}\n\n${prose}`)
  }

  return blocks.length === 0 ? undefined : `## Package notes\n\n${blocks.join('\n\n')}`
}
