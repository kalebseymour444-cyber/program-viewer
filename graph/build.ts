/**
 * Adjacency and topological ordering over the task graph.
 *
 * Task predecessors are the only authored dependencies (SPEC §3). Everything
 * else in this directory is built on the adjacency produced here.
 *
 * Determinism is a requirement, not a nicety. Generated markdown is committed,
 * and SPEC §7 makes a status change a reviewable pull request — which only
 * works if regenerating from unchanged input produces byte-identical output.
 * Every list this module returns is sorted, and the topological order is
 * canonical: among the tasks that are ready at each step, always take the
 * lowest ID. Two runs cannot disagree.
 */

import type { Task } from '../schema/program.schema.js'

export interface Adjacency {
  /** Every task ID, sorted. */
  readonly ids: readonly string[]
  /** Task ID → its predecessors, sorted. */
  readonly predecessors: ReadonlyMap<string, readonly string[]>
  /** Task ID → its successors, sorted. Derived; never authored. */
  readonly successors: ReadonlyMap<string, readonly string[]>
}

export function buildAdjacency(tasks: readonly Task[]): Adjacency {
  const ids = tasks.map((t) => t.id).sort()

  const predecessors = new Map<string, string[]>()
  const successors = new Map<string, string[]>()
  for (const id of ids) {
    predecessors.set(id, [])
    successors.set(id, [])
  }

  for (const task of tasks) {
    const preds = [...task.predecessors].sort()
    predecessors.set(task.id, preds)

    for (const pred of preds) {
      const list = successors.get(pred)
      if (list === undefined) {
        // Referential integrity runs before this (schema/integrity.ts), so a
        // dangling predecessor here means the graph was built from unvalidated
        // input. Fail rather than silently drop the edge.
        throw new Error(
          `buildAdjacency: task "${task.id}" lists predecessor "${pred}", which is not a known task. ` +
            `Validate the program before building the graph.`,
        )
      }
      list.push(task.id)
    }
  }

  for (const list of successors.values()) list.sort()

  return { ids, predecessors, successors }
}

/** Insert into a sorted array, keeping it sorted. */
function insertSorted(sorted: string[], value: string): void {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (sorted[mid]! < value) low = mid + 1
    else high = mid
  }
  sorted.splice(low, 0, value)
}

export interface TopologicalOrder {
  /** Tasks in dependency order. Incomplete if `cycles` is non-empty. */
  readonly order: readonly string[]
  /** Tasks that could not be ordered — those in a cycle, or downstream of one. */
  readonly unordered: readonly string[]
  /** Example cycles, each listed as a loop: `[a, b, c]` means a → b → c → a. */
  readonly cycles: readonly (readonly string[])[]
}

/**
 * Kahn's algorithm. Anything left with a non-zero in-degree is in a cycle or
 * downstream of one; `findCycles` then extracts concrete examples so the error
 * can name the loop rather than merely assert that one exists.
 */
export function topologicalOrder(adjacency: Adjacency): TopologicalOrder {
  const indegree = new Map<string, number>()
  for (const id of adjacency.ids) {
    indegree.set(id, adjacency.predecessors.get(id)?.length ?? 0)
  }

  const ready = adjacency.ids.filter((id) => indegree.get(id) === 0).slice()
  const order: string[] = []

  while (ready.length > 0) {
    const id = ready.shift()!
    order.push(id)

    for (const next of adjacency.successors.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1
      indegree.set(next, remaining)
      if (remaining === 0) insertSorted(ready, next)
    }
  }

  if (order.length === adjacency.ids.length) {
    return { order, unordered: [], cycles: [] }
  }

  const ordered = new Set(order)
  const unordered = adjacency.ids.filter((id) => !ordered.has(id))
  return { order, unordered, cycles: findCycles(adjacency, unordered) }
}

/** Rotate a cycle so it starts at its lowest ID, so the same loop always prints the same way. */
function canonical(cycle: readonly string[]): string[] {
  let pivot = 0
  for (let i = 1; i < cycle.length; i++) {
    if (cycle[i]! < cycle[pivot]!) pivot = i
  }
  return [...cycle.slice(pivot), ...cycle.slice(0, pivot)]
}

/**
 * Depth-first search over `nodes`, recording a cycle at every back edge.
 *
 * This reports representative cycles, not every elementary cycle — enumerating
 * all of them is exponential and a build error only needs to name one loop per
 * knot to be actionable.
 */
export function findCycles(adjacency: Adjacency, nodes: readonly string[]): string[][] {
  const inScope = new Set(nodes)
  const state = new Map<string, 'open' | 'closed'>()
  const stack: string[] = []
  const cycles: string[][] = []
  const seen = new Set<string>()

  const visit = (id: string): void => {
    state.set(id, 'open')
    stack.push(id)

    for (const next of adjacency.successors.get(id) ?? []) {
      if (!inScope.has(next)) continue

      const status = state.get(next)
      if (status === undefined) {
        visit(next)
      } else if (status === 'open') {
        const cycle = canonical(stack.slice(stack.indexOf(next)))
        const key = cycle.join('→')
        if (!seen.has(key)) {
          seen.add(key)
          cycles.push(cycle)
        }
      }
    }

    stack.pop()
    state.set(id, 'closed')
  }

  for (const id of [...nodes].sort()) {
    if (!state.has(id)) visit(id)
  }

  return cycles
}

export class DependencyCycleError extends Error {
  readonly cycles: readonly (readonly string[])[]

  constructor(cycles: readonly (readonly string[])[]) {
    const rendered = cycles
      .map((cycle, i) => `  ${i + 1}. ${[...cycle, cycle[0]].join(' → ')}`)
      .join('\n')
    super(
      `dependency ${cycles.length === 1 ? 'cycle' : 'cycles'} detected — the graph cannot be scheduled:\n\n` +
        `${rendered}\n\n` +
        `A cycle means each task waits on the other, so neither can ever start.\n` +
        `Remove an edge in program.yaml.`,
    )
    this.name = 'DependencyCycleError'
    this.cycles = cycles
  }
}
