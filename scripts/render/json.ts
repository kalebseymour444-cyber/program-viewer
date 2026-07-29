/**
 * public/program.json — what the application loads at startup.
 *
 * Contains the authored entities AND everything derived from them, so the app
 * renders exactly what the markdown states. Shipping the computed graph rather
 * than recomputing in the browser guarantees the site and the generated
 * documents can never disagree — they came out of the same computation.
 *
 * Adjacency is included so the app can walk chains for the select-a-node
 * feature (SPEC §5) without re-running the critical path.
 *
 * Keys are emitted in sorted order and no timestamp appears anywhere: this file
 * is committed, and a build stamp would make every regeneration a diff.
 */

import type { ProgramGraph, ScenarioGraph } from '../../graph/index.js'

/** Map → plain object with keys in sorted order, so JSON.stringify is stable. */
function sortedObject<T>(map: ReadonlyMap<string, T>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const key of [...map.keys()].sort()) out[key] = map.get(key)!
  return out
}

function serializeScenario(scenario: ScenarioGraph) {
  return {
    scenario: scenario.scenario,
    projectDuration: scenario.schedule.projectDuration,
    criticalTasks: scenario.schedule.criticalTasks,
    criticalChain: scenario.schedule.criticalChain,
    tasks: sortedObject(scenario.schedule.tasks),
    packages: sortedObject(scenario.packages),
    milestones: sortedObject(scenario.milestones),
    crossMilestoneEdges: scenario.crossMilestoneEdges,
    contention: sortedObject(scenario.contention),
  }
}

export function renderJson(graph: ProgramGraph): string {
  const { program } = graph

  const document = {
    program: program.program,
    roles: program.roles,

    // Authored fields merged with the structural rollup, so a consumer never
    // has to join two collections to render one row.
    milestones: program.milestones.map((milestone) => ({
      ...milestone,
      ...graph.milestones.get(milestone.id)!,
    })),
    packages: program.packages.map((pkg) => ({
      ...pkg,
      ...graph.packages.get(pkg.id)!,
    })),
    tasks: program.tasks.map((task) => ({
      ...task,
      successors: graph.adjacency.successors.get(task.id) ?? [],
    })),

    order: graph.order,
    adjacency: {
      predecessors: sortedObject(graph.adjacency.predecessors),
      successors: sortedObject(graph.adjacency.successors),
    },

    scenarios: {
      optimistic: serializeScenario(graph.optimistic),
      pessimistic: serializeScenario(graph.pessimistic),
    },
  }

  return `${JSON.stringify(document, null, 2)}\n`
}
