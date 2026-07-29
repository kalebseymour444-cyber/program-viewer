/**
 * computeProgramGraph — the one call that turns an authored Program into
 * everything derived from it.
 *
 * This is the core (SPEC §8 phase 3). The generator and the app both render
 * what comes out of here; if it is wrong, everything downstream is wrong and
 * will look entirely plausible while being incorrect.
 */

import type { Program } from '../schema/program.schema.js'
import { buildAdjacency, topologicalOrder, DependencyCycleError } from './build.js'
import type { Adjacency } from './build.js'
import { computeSchedule } from './schedule.js'
import type { Schedule, Scenario } from './schedule.js'
import { rollUpMilestones, rollUpPackages, scheduleRollups } from './rollup.js'
import type { ScheduledRollup, StructuralRollup } from './rollup.js'
import { closureOf, crossMilestoneEdges } from './closure.js'
import type { Closure, CrossMilestoneEdge } from './closure.js'
import { computeContention } from './contention.js'
import type { RoleContention } from './contention.js'

export * from './build.js'
export * from './schedule.js'
export * from './rollup.js'
export * from './closure.js'
export * from './contention.js'
export * from './status.js'

/** Everything that depends on which end of the duration range you take (D3). */
export interface ScenarioGraph {
  readonly scenario: Scenario
  readonly schedule: Schedule
  readonly packages: ReadonlyMap<string, ScheduledRollup>
  readonly milestones: ReadonlyMap<string, ScheduledRollup>
  readonly contention: ReadonlyMap<string, RoleContention>
  readonly crossMilestoneEdges: readonly CrossMilestoneEdge[]
}

export interface ProgramGraph {
  readonly program: Program
  readonly adjacency: Adjacency
  /** Canonical topological order — deterministic across runs. */
  readonly order: readonly string[]

  /** Scenario-independent: membership, rolled-up dependencies, status, gate counts. */
  readonly packages: ReadonlyMap<string, StructuralRollup>
  readonly milestones: ReadonlyMap<string, StructuralRollup>

  /**
   * Both ends of every duration range. `pessimistic` is the default for
   * display; SPEC §3 forbids rounding toward optimism, and the critical path
   * can be a genuinely different path in each.
   */
  readonly optimistic: ScenarioGraph
  readonly pessimistic: ScenarioGraph

  /** Full transitive chains for a task, with the longest-reach node called out. */
  closure(taskId: string, scenario?: Scenario): Closure
}

/**
 * @throws {DependencyCycleError} if the task graph cannot be ordered. SPEC §7
 * requires the build to fail on any cycle — a cycle means two tasks each wait
 * on the other, so no schedule exists at all.
 */
export function computeProgramGraph(program: Program): ProgramGraph {
  const adjacency = buildAdjacency(program.tasks)
  const { order, cycles } = topologicalOrder(adjacency)

  if (cycles.length > 0) throw new DependencyCycleError(cycles)

  const packages = rollUpPackages(program.packages, program.tasks, adjacency)
  const milestones = rollUpMilestones(program.milestones, program.tasks, adjacency)

  const buildScenario = (scenario: Scenario): ScenarioGraph => {
    const schedule = computeSchedule(program.tasks, adjacency, order, scenario)
    return {
      scenario,
      schedule,
      packages: scheduleRollups(packages, schedule),
      milestones: scheduleRollups(milestones, schedule),
      contention: computeContention(program.tasks, schedule),
      crossMilestoneEdges: crossMilestoneEdges(adjacency, schedule),
    }
  }

  const optimistic = buildScenario('optimistic')
  const pessimistic = buildScenario('pessimistic')

  return {
    program,
    adjacency,
    order,
    packages,
    milestones,
    optimistic,
    pessimistic,
    closure(taskId, scenario = 'pessimistic') {
      return closureOf(adjacency, taskId, scenario === 'optimistic' ? optimistic.schedule : pessimistic.schedule)
    },
  }
}
