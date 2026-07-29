/**
 * Package and milestone derivation.
 *
 * Nothing here is authored. Dependencies roll up from task predecessors,
 * duration is a span over member tasks, status is the worst case, and the gate
 * figure is a count of gate tasks (decision D8 — there is no rollup gate flag,
 * because no structural rule reproduced the legacy marking).
 *
 * A rollup is split in two because only half of it depends on the schedule:
 *   - `StructuralRollup` — membership, dependencies, status, gates. One copy.
 *   - `ScheduledRollup`  — start, finish, duration, float. One per scenario.
 */

import type { Milestone, Package, Status, Task } from '../schema/program.schema.js'
import type { Adjacency } from './build.js'
import type { Schedule } from './schedule.js'
import { rollupStatus } from './status.js'

export interface StructuralRollup {
  readonly id: string
  /** Direct children: tasks for a package, packages for a milestone. Sorted. */
  readonly childIds: readonly string[]
  /** Every task beneath this node, sorted. */
  readonly taskIds: readonly string[]
  /** Peer nodes this one depends on, rolled up from task edges. Sorted. */
  readonly dependsOn: readonly string[]
  /** Peer nodes depending on this one. Derived, never authored. Sorted. */
  readonly feeds: readonly string[]
  readonly status: Status
  /** Gate tasks beneath this node, sorted. `gateCount` is its length (D8). */
  readonly gateTaskIds: readonly string[]
  readonly gateCount: number
}

export interface ScheduledRollup {
  readonly id: string
  readonly earliestStart: number
  readonly earliestFinish: number
  /**
   * The SPAN of the node — finish minus start — not the sum of its tasks'
   * durations. Summing would count concurrent work twice and make M4's five
   * parallel lanes look five times longer than they are.
   */
  readonly duration: number
  /** The tightest float among member tasks: the slack this node actually has. */
  readonly float: number
  readonly critical: boolean
}

/** `M4.3.2` at depth 2 → `M4.3`; at depth 1 → `M4`. */
const ancestor = (taskId: string, depth: 1 | 2): string =>
  taskId.split('.').slice(0, depth).join('.')

function structural(
  nodeIds: readonly string[],
  tasks: readonly Task[],
  adjacency: Adjacency,
  depth: 1 | 2,
  childOf: (task: Task) => string,
): Map<string, StructuralRollup> {
  const tasksByNode = new Map<string, Task[]>()
  for (const id of nodeIds) tasksByNode.set(id, [])
  for (const task of tasks) {
    tasksByNode.get(ancestor(task.id, depth))?.push(task)
  }

  const dependsOn = new Map<string, Set<string>>()
  const feeds = new Map<string, Set<string>>()
  for (const id of nodeIds) {
    dependsOn.set(id, new Set())
    feeds.set(id, new Set())
  }

  // An edge between two tasks induces an edge between their containers, unless
  // both sit in the same one. This is the rollup SPEC §2 insists on deriving.
  for (const task of tasks) {
    const to = ancestor(task.id, depth)
    for (const pred of adjacency.predecessors.get(task.id) ?? []) {
      const from = ancestor(pred, depth)
      if (from === to) continue
      dependsOn.get(to)?.add(from)
      feeds.get(from)?.add(to)
    }
  }

  const rollups = new Map<string, StructuralRollup>()
  for (const id of [...nodeIds].sort()) {
    const members = tasksByNode.get(id) ?? []
    const gateTaskIds = members
      .filter((t) => t.gate)
      .map((t) => t.id)
      .sort()

    rollups.set(id, {
      id,
      childIds: [...new Set(members.map(childOf))].sort(),
      taskIds: members.map((t) => t.id).sort(),
      dependsOn: [...(dependsOn.get(id) ?? [])].sort(),
      feeds: [...(feeds.get(id) ?? [])].sort(),
      status: rollupStatus(members.map((t) => t.status)),
      gateTaskIds,
      gateCount: gateTaskIds.length,
    })
  }

  return rollups
}

export function rollUpPackages(
  packages: readonly Package[],
  tasks: readonly Task[],
  adjacency: Adjacency,
): Map<string, StructuralRollup> {
  return structural(
    packages.map((p) => p.id),
    tasks,
    adjacency,
    2,
    (task) => task.id,
  )
}

export function rollUpMilestones(
  milestones: readonly Milestone[],
  tasks: readonly Task[],
  adjacency: Adjacency,
): Map<string, StructuralRollup> {
  return structural(
    milestones.map((m) => m.id),
    tasks,
    adjacency,
    1,
    (task) => ancestor(task.id, 2),
  )
}

/** Project a structural rollup onto one schedule scenario. */
export function scheduleRollups(
  rollups: ReadonlyMap<string, StructuralRollup>,
  schedule: Schedule,
): Map<string, ScheduledRollup> {
  const scheduled = new Map<string, ScheduledRollup>()

  for (const [id, rollup] of [...rollups].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    let earliestStart = Number.POSITIVE_INFINITY
    let earliestFinish = 0
    let float = Number.POSITIVE_INFINITY

    for (const taskId of rollup.taskIds) {
      const task = schedule.tasks.get(taskId)
      if (task === undefined) continue
      earliestStart = Math.min(earliestStart, task.earliestStart)
      earliestFinish = Math.max(earliestFinish, task.earliestFinish)
      float = Math.min(float, task.float)
    }

    // Validation forbids an empty package or milestone, so this is defensive only.
    if (!Number.isFinite(earliestStart)) {
      earliestStart = 0
      float = 0
    }

    scheduled.set(id, {
      id,
      earliestStart,
      earliestFinish,
      duration: earliestFinish - earliestStart,
      float,
      critical: float === 0,
    })
  }

  return scheduled
}
