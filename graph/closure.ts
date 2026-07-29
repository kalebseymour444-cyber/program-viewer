/**
 * Full upstream and downstream closure for any node.
 *
 * This is the computation behind the feature SPEC §5 calls the whole point of
 * the application: select a node, see its complete chains, and have the
 * longest-reach dependency called out. "A dependency introduced eight months
 * earlier that only surfaces at final validation should be visible by clicking
 * one node."
 *
 * Closure is TRANSITIVE, not adjacent. Immediate predecessors are the easy half
 * and the useless half — the M1.2.2 patching matrix reaches M8.3.4 through
 * roughly forty intermediate tasks, and that reach is exactly what nobody sees
 * in a conventional plan.
 */

import type { Adjacency } from './build.js'
import type { Schedule } from './schedule.js'

export interface ChainNode {
  readonly id: string
  /** Fewest edges between this node and the selected one. */
  readonly depth: number
  /**
   * Reach in days: how far apart the two sit in the schedule. Measured start to
   * start, which is what "this decision was made eight months before it bit"
   * means. Requires a schedule; undefined without one.
   */
  readonly spanDays?: number
}

export interface Closure {
  readonly id: string
  /** Everything this node transitively depends on, nearest first then by ID. */
  readonly upstream: readonly ChainNode[]
  /** Everything transitively waiting on it, nearest first then by ID. */
  readonly downstream: readonly ChainNode[]
  /** The upstream node with the greatest reach — the one worth calling out. */
  readonly longestUpstream?: ChainNode
  /** The downstream node with the greatest reach. */
  readonly longestDownstream?: ChainNode
}

/** Breadth-first so `depth` is the shortest edge count, not whichever path we happened to walk. */
function traverse(
  start: string,
  edges: ReadonlyMap<string, readonly string[]>,
): Map<string, number> {
  const depths = new Map<string, number>()
  let frontier = [start]
  let depth = 0

  while (frontier.length > 0) {
    depth++
    const next: string[] = []
    for (const id of frontier) {
      for (const neighbour of edges.get(id) ?? []) {
        if (neighbour === start || depths.has(neighbour)) continue
        depths.set(neighbour, depth)
        next.push(neighbour)
      }
    }
    frontier = next.sort()
  }

  return depths
}

function toChain(
  depths: ReadonlyMap<string, number>,
  anchor: string,
  schedule: Schedule | undefined,
  direction: 'upstream' | 'downstream',
): ChainNode[] {
  const anchorStart = schedule?.tasks.get(anchor)?.earliestStart

  const nodes: ChainNode[] = [...depths].map(([id, depth]) => {
    const start = schedule?.tasks.get(id)?.earliestStart
    let spanDays: number | undefined
    if (anchorStart !== undefined && start !== undefined) {
      spanDays = direction === 'upstream' ? anchorStart - start : start - anchorStart
    }
    return spanDays === undefined ? { id, depth } : { id, depth, spanDays }
  })

  return nodes.sort((a, b) => a.depth - b.depth || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** The node of greatest reach; ties broken by ID so the callout never flickers between runs. */
function longest(nodes: readonly ChainNode[]): ChainNode | undefined {
  let best: ChainNode | undefined
  for (const node of nodes) {
    if (best === undefined) {
      best = node
      continue
    }
    const a = node.spanDays ?? node.depth
    const b = best.spanDays ?? best.depth
    if (a > b || (a === b && node.id < best.id)) best = node
  }
  return best
}

export function closureOf(adjacency: Adjacency, id: string, schedule?: Schedule): Closure {
  if (!adjacency.predecessors.has(id)) {
    throw new Error(`closureOf: unknown task "${id}"`)
  }

  const upstream = toChain(traverse(id, adjacency.predecessors), id, schedule, 'upstream')
  const downstream = toChain(traverse(id, adjacency.successors), id, schedule, 'downstream')

  const longestUpstream = longest(upstream)
  const longestDownstream = longest(downstream)

  return {
    id,
    upstream,
    downstream,
    ...(longestUpstream ? { longestUpstream } : {}),
    ...(longestDownstream ? { longestDownstream } : {}),
  }
}

export interface CrossMilestoneEdge {
  readonly from: string
  readonly to: string
  readonly fromMilestone: string
  readonly toMilestone: string
  /** Reach in days, start to start. Undefined without a schedule. */
  readonly spanDays?: number
}

/**
 * Every task edge whose endpoints sit in different milestones (SPEC §3).
 *
 * These are the dependencies nobody owns, because they span two owners. Sorted
 * by reach, longest first, which is the order the generated register wants
 * (SPEC §4) — the long ones are the ones that fail.
 */
export function crossMilestoneEdges(
  adjacency: Adjacency,
  schedule?: Schedule,
): CrossMilestoneEdge[] {
  const milestoneOf = (taskId: string) => taskId.split('.')[0]!
  const edges: CrossMilestoneEdge[] = []

  for (const to of adjacency.ids) {
    for (const from of adjacency.predecessors.get(to) ?? []) {
      const fromMilestone = milestoneOf(from)
      const toMilestone = milestoneOf(to)
      if (fromMilestone === toMilestone) continue

      const fromStart = schedule?.tasks.get(from)?.earliestStart
      const toStart = schedule?.tasks.get(to)?.earliestStart
      const spanDays =
        fromStart !== undefined && toStart !== undefined ? toStart - fromStart : undefined

      edges.push({
        from,
        to,
        fromMilestone,
        toMilestone,
        ...(spanDays === undefined ? {} : { spanDays }),
      })
    }
  }

  return edges.sort(
    (a, b) =>
      (b.spanDays ?? 0) - (a.spanDays ?? 0) ||
      (a.from < b.from ? -1 : a.from > b.from ? 1 : 0) ||
      (a.to < b.to ? -1 : a.to > b.to ? 1 : 0),
  )
}
