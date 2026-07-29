/**
 * Bridge from the shipped program.json to the tested graph layer.
 *
 * `program.json` carries adjacency and per-scenario schedules as plain objects
 * (JSON has no Maps). The chain computation the whole app is built around lives
 * in `graph/closure.ts` and is unit-tested — so rather than re-walk the graph in
 * the browser (a second implementation is a second thing to get subtly wrong),
 * this reconstructs the Map-shaped inputs once per document and calls the real
 * `closureOf`. The reconstruction is cached against the document, which never
 * mutates, so selecting node after node re-walks edges but never rebuilds maps.
 */

import { closureOf, type Closure } from '../../graph/closure.js'
import type { Adjacency } from '../../graph/build.js'
import type { Schedule } from '../../graph/schedule.js'
import type { ProgramDocument, Scenario } from './program.js'
import { useProgram } from './program.js'

export type { Closure }
export type { ChainNode } from '../../graph/closure.js'

interface GraphInputs {
  readonly adjacency: Adjacency
  readonly schedules: Record<Scenario, Schedule>
}

const cache = new WeakMap<ProgramDocument, GraphInputs>()

function toMap(record: Record<string, readonly string[]>): Map<string, readonly string[]> {
  return new Map(Object.entries(record))
}

function scheduleOf(program: ProgramDocument, scenario: Scenario): Schedule {
  const data = program.scenarios[scenario]
  return {
    scenario,
    tasks: new Map(Object.entries(data.tasks)),
    projectDuration: data.projectDuration,
    criticalTasks: data.criticalTasks,
    criticalChain: data.criticalChain,
  }
}

export function graphInputs(program: ProgramDocument): GraphInputs {
  const cached = cache.get(program)
  if (cached) return cached

  const inputs: GraphInputs = {
    adjacency: {
      ids: program.tasks.map((t) => t.id),
      predecessors: toMap(program.adjacency.predecessors),
      successors: toMap(program.adjacency.successors),
    },
    schedules: {
      optimistic: scheduleOf(program, 'optimistic'),
      pessimistic: scheduleOf(program, 'pessimistic'),
    },
  }
  cache.set(program, inputs)
  return inputs
}

/** The transitive up/downstream closure of one task in one scenario. */
export function useClosure(taskId: string, scenario: Scenario): Closure {
  const { adjacency, schedules } = graphInputs(useProgram())
  return closureOf(adjacency, taskId, schedules[scenario])
}
