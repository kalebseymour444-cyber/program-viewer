/**
 * content/conventions.md — the reading key.
 *
 * SPEC §4 does not list this file, but every other generated page links to it
 * and the legacy model treated it as the entry point ("the ID scheme is what
 * makes traversal work"). Generating it from the role registry and the schema
 * enums keeps it true; the parts that are genuinely editorial come from
 * `narrative/conventions.md`.
 */

import { STATUSES, TASK_TYPES } from '../../schema/program.schema.js'
import type { ProgramGraph } from '../../graph/index.js'
import type { Narrative } from './narrative.js'
import { STATUS_SEVERITY } from '../../graph/status.js'
import { code, link, page, section, table } from './markdown.js'

export function renderConventions(graph: ProgramGraph, narrative: Narrative): string {
  const milestone = graph.program.milestones[0]
  const example = graph.program.tasks[0]

  const idScheme = [
    '```',
    `${(milestone?.id ?? 'M4').padEnd(16)}Milestone      (L0)`,
    `${(example?.package ?? 'M4.3').padEnd(16)}Work package   (L1)`,
    `${(example?.id ?? 'M4.3.2').padEnd(16)}Task           (L2)`,
    '```',
    '',
    'Every ID carries its own path upward, which is what makes traversal mechanical rather than a',
    'matter of someone remembering. **IDs are permanent** — if work is removed the ID is retired,',
    'never reused, because renumbering breaks every reference that ever pointed at it.',
  ].join('\n')

  const roleRows = graph.program.roles.map((role) => {
    const owned = graph.program.tasks.filter((t) => t.owners.includes(role.id)).length
    const approves = graph.program.milestones.filter((m) => m.approver === role.id).length
    return [
      code(role.id),
      role.name,
      String(owned),
      approves === 0 ? '—' : String(approves),
    ]
  })

  const statusRows = STATUS_SEVERITY.map((status, i) => [
    code(status),
    String(i + 1),
    status === 'AT_RISK' || status === 'BLOCKED' ? '**always shown**' : '—',
  ])

  return page('Conventions', [
    link('← Program', 'L0-program.md'),
    narrative.partials.get('lead/conventions'),
    section('Identifier scheme', idScheme),
    section(
      'Task types',
      table(['Tag', 'Tasks'], TASK_TYPES.map((type) => [
        code(type),
        String(graph.program.tasks.filter((t) => t.type === type).length),
      ])),
    ),
    section(
      'Status',
      `${table(['State', 'Severity rank', 'Aging displayed'], statusRows)}\n\n` +
        '_A package or milestone takes the **worst** status among its tasks — never an average,\n' +
        'never rounded toward optimism. `AT_RISK` and `IN_PROGRESS` are distinct states: a mitigation\n' +
        'plan does not restore green. Where aging is shown it cannot be suppressed — the schema\n' +
        'requires a date on any task in those states._\n\n' +
        `_All ${STATUSES.length} states: ${STATUSES.map((s) => code(s)).join(', ')}._`,
    ),
    section(
      'Owner roles',
      `${table(['Role', 'Name', 'Tasks owned', 'Milestones approved'], roleRows)}\n\n` +
        '_Roles, never names, so the model survives staffing changes. A task may have several\n' +
        'owners — work needing two parties present at once is a coordination dependency, not just\n' +
        'a work item._',
    ),
    section(
      'Durations',
      '_Every duration is a range. The whole schedule is computed twice, from the optimistic and\n' +
        'the pessimistic end, and **the critical path can be a different path in each**. A figure\n' +
        'without a scenario label is not an answer. A task with no duration is continuous or\n' +
        'externally paced; it renders as `—`, never as `0d`._',
    ),
    narrative.partials.get('conventions'),
  ])
}
