/**
 * Critical path method — forward pass, backward pass, float, critical set.
 *
 * ── Two scenarios, not one (decision D3) ────────────────────────────────────
 * Durations are ranges (D1), so the entire schedule is computed twice:
 * `optimistic` from `duration.min` and `pessimistic` from `duration.max`.
 *
 * These are not the same schedule scaled up and down. The critical path can be
 * a DIFFERENT PATH at each end — a lane that is slack under optimistic
 * durations can become the binding one under pessimistic durations. Anything
 * consuming this must say which scenario it is showing; SPEC §3 forbids
 * rounding toward optimism, so the pessimistic figure is the default.
 *
 * ── Time is measured in day offsets, not dates ──────────────────────────────
 * Zero is the earliest possible project start. There is deliberately no
 * calendar here: whether these are working days or calendar days is Q19 and is
 * unresolved, and mapping offsets onto real dates is phase 8's problem. Nothing
 * in this module needs to know what a weekend is.
 */

import type { Task } from '../schema/program.schema.js'
import type { Adjacency } from './build.js'

export type Scenario = 'optimistic' | 'pessimistic'

export interface TaskSchedule {
  readonly earliestStart: number
  readonly earliestFinish: number
  readonly latestStart: number
  readonly latestFinish: number
  /** Days this task can slip without moving the project finish. */
  readonly float: number
  readonly critical: boolean
}

export interface Schedule {
  readonly scenario: Scenario
  readonly tasks: ReadonlyMap<string, TaskSchedule>
  /** Day offset of the project finish — the longest path through the graph. */
  readonly projectDuration: number
  /** Every zero-float task, sorted. */
  readonly criticalTasks: readonly string[]
  /**
   * ONE critical path, start to finish, for display. There are usually several;
   * this picks the lowest ID at each branch so the choice is stable across runs.
   */
  readonly criticalChain: readonly string[]
}

/**
 * An absent duration is zero-length (D4). Such a task still participates in
 * ordering and can sit on the critical path — it just consumes no time.
 */
export function durationFor(task: Task, scenario: Scenario): number {
  if (task.duration === undefined) return 0
  return scenario === 'optimistic' ? task.duration.min : task.duration.max
}

export function computeSchedule(
  tasks: readonly Task[],
  adjacency: Adjacency,
  order: readonly string[],
  scenario: Scenario,
): Schedule {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const duration = (id: string) => {
    const task = byId.get(id)
    if (task === undefined) throw new Error(`computeSchedule: unknown task "${id}"`)
    return durationFor(task, scenario)
  }

  /* Forward pass — earliest start is the latest finish among predecessors. */
  const earliestStart = new Map<string, number>()
  const earliestFinish = new Map<string, number>()

  for (const id of order) {
    let start = 0
    for (const pred of adjacency.predecessors.get(id) ?? []) {
      start = Math.max(start, earliestFinish.get(pred) ?? 0)
    }
    earliestStart.set(id, start)
    earliestFinish.set(id, start + duration(id))
  }

  const projectDuration = order.reduce((max, id) => Math.max(max, earliestFinish.get(id) ?? 0), 0)

  /* Backward pass — latest finish is the earliest start among successors.
   * A task with no successors may run until the project finish. */
  const latestFinish = new Map<string, number>()
  const latestStart = new Map<string, number>()

  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!
    const successors = adjacency.successors.get(id) ?? []

    let finish = projectDuration
    if (successors.length > 0) {
      finish = Number.POSITIVE_INFINITY
      for (const next of successors) {
        finish = Math.min(finish, latestStart.get(next) ?? projectDuration)
      }
    }

    latestFinish.set(id, finish)
    latestStart.set(id, finish - duration(id))
  }

  const schedules = new Map<string, TaskSchedule>()
  const criticalTasks: string[] = []

  for (const id of [...order].sort()) {
    const es = earliestStart.get(id) ?? 0
    const ef = earliestFinish.get(id) ?? 0
    const ls = latestStart.get(id) ?? 0
    const lf = latestFinish.get(id) ?? 0
    const slack = ls - es
    const critical = slack === 0

    schedules.set(id, {
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      float: slack,
      critical,
    })
    if (critical) criticalTasks.push(id)
  }

  return {
    scenario,
    tasks: schedules,
    projectDuration,
    criticalTasks,
    criticalChain: traceCriticalChain(adjacency, schedules),
  }
}

/**
 * Walk one continuous zero-float path from a critical start to a critical end.
 *
 * Following "any critical successor" is not enough — two critical tasks can be
 * critical without being adjacent in time. The next task on the chain must also
 * begin exactly when this one finishes.
 */
function traceCriticalChain(
  adjacency: Adjacency,
  schedules: ReadonlyMap<string, TaskSchedule>,
): string[] {
  const isCritical = (id: string) => schedules.get(id)?.critical === true

  const starts = [...schedules.keys()]
    .filter((id) => isCritical(id) && schedules.get(id)!.earliestStart === 0)
    .sort()

  const first = starts[0]
  if (first === undefined) return []

  const chain = [first]
  let current = first

  for (;;) {
    const finish = schedules.get(current)!.earliestFinish
    const next = (adjacency.successors.get(current) ?? [])
      .filter((id) => isCritical(id) && schedules.get(id)!.earliestStart === finish)
      .sort()[0]

    if (next === undefined) break
    chain.push(next)
    current = next
  }

  return chain
}
