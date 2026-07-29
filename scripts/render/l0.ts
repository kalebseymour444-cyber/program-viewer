/**
 * content/L0-program.md — the executive grain.
 *
 * Milestone table, dependency graph, critical path. Every figure here is
 * derived; nothing on this page is authored except the prose slot at the end.
 */

import type { ProgramGraph } from '../../graph/index.js'
import type { Narrative } from './narrative.js'
import {
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

export function renderL0(graph: ProgramGraph, narrative: Narrative): string {
  const { program } = graph

  const nav = [
    link('conventions', 'conventions.md'),
    link('gates', 'registers/gates.md'),
    link('dependencies', 'registers/dependencies.md'),
    link('parallelization', 'registers/parallelization.md'),
  ].join(' · ')

  const rows = graph.program.milestones.map((milestone) => {
    const rollup = graph.milestones.get(milestone.id)!
    const optimistic = graph.optimistic.milestones.get(milestone.id)!
    const pessimistic = graph.pessimistic.milestones.get(milestone.id)!

    const span =
      optimistic.duration === pessimistic.duration
        ? formatDays(pessimistic.duration)
        : `${optimistic.duration}–${pessimistic.duration}d`

    return [
      code(milestone.id),
      milestone.name,
      code(milestone.approver),
      gateCell(rollup.gateCount),
      joinIds(rollup.dependsOn),
      span,
      formatDays(pessimistic.float),
      formatStatusWithAging(rollup.status, undefined),
      link('→', `L1-milestones/${milestone.id}.md`),
    ]
  })

  const milestoneTable = table(
    ['ID', 'Milestone', 'Approver', 'Gates', 'Depends on', 'Duration', 'Float', 'Status', 'Detail'],
    rows,
  )

  return page(`L0 — ${program.program.name}`, [
    program.program.description === undefined ? undefined : `_${program.program.description}_`,
    nav,
    narrative.partials.get('lead/program'),
    section('Milestones', `${milestoneTable}\n\n${DURATION_NOTE}`),
    section('Dependency graph', renderMilestoneGraph(graph)),
    section('Critical path', renderCriticalPath(graph)),
    narrative.partials.get('program'),
  ])
}

const DURATION_NOTE = [
  '_Duration is a span — the milestone\'s earliest start to its latest finish — not the sum of its',
  'tasks. The two figures are the optimistic and pessimistic ends of the authored duration ranges.',
  'Float is the tightest slack among the milestone\'s tasks, pessimistic._',
].join(' ')

function renderMilestoneGraph(graph: ProgramGraph): string {
  const lines = ['graph LR']
  const critical = new Set(
    graph.pessimistic.schedule.criticalTasks.map((id) => id.split('.')[0]!),
  )

  for (const milestone of graph.program.milestones) {
    const rollup = graph.milestones.get(milestone.id)!
    const label = `${milestone.id} ${milestone.name}${gateBadge(rollup.gateCount)}`
    lines.push(`    ${mermaidId(milestone.id)}[${mermaidLabel(label)}]`)
  }

  for (const milestone of graph.program.milestones) {
    for (const dependency of graph.milestones.get(milestone.id)!.dependsOn) {
      lines.push(`    ${mermaidId(dependency)} --> ${mermaidId(milestone.id)}`)
    }
  }

  const criticalIds = graph.program.milestones
    .filter((m) => critical.has(m.id))
    .map((m) => mermaidId(m.id))

  if (criticalIds.length > 0) {
    lines.push('    classDef critical stroke-width:3px')
    lines.push(`    class ${criticalIds.join(',')} critical`)
  }

  return `${mermaid(lines)}\n\n_Thick outline marks a milestone on the pessimistic critical path._`
}

/**
 * Both ends, always, and always labelled.
 *
 * The critical path can be a genuinely different path in each scenario (D3),
 * so reporting one without naming which would be reporting half the answer.
 * SPEC §3 forbids rounding toward optimism, so pessimistic leads.
 */
function renderCriticalPath(graph: ProgramGraph): string {
  const describe = (scenario: 'optimistic' | 'pessimistic'): string => {
    const schedule = graph[scenario].schedule
    const chain = schedule.criticalChain
    const milestones = [...new Set(chain.map((id) => id.split('.')[0]!))]

    return [
      `**${scenario === 'pessimistic' ? 'Pessimistic' : 'Optimistic'}** — ` +
        `${schedule.projectDuration} days, ${schedule.criticalTasks.length} tasks with zero float.`,
      '',
      `By milestone: ${milestones.map((m) => code(m)).join(' → ')}`,
      '',
      `<details><summary>Full chain (${chain.length} tasks)</summary>`,
      '',
      chain.map((id) => code(id)).join(' → '),
      '',
      '</details>',
    ].join('\n')
  }

  return [
    describe('pessimistic'),
    '',
    describe('optimistic'),
    '',
    '_The critical path is not the same path at both ends of the duration ranges. A lane with slack',
    'when everything runs short can become the binding one when things run long, so neither figure',
    'means anything without the label._',
  ].join('\n')
}
