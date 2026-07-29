/**
 * Layered DAG layout via dagre.
 *
 * The graph is a dependency order, so a layered left-to-right layout reads the
 * way the work runs: predecessors sit left of what they feed. Dagre is
 * deterministic given the same node/edge set, so the same filter always lays out
 * the same way — a graph that reshuffled on every render would be unreadable.
 */

import Dagre from '@dagrejs/dagre'

export const NODE_WIDTH = 168
export const NODE_HEIGHT = 46

export interface LayoutEdge {
  readonly from: string
  readonly to: string
}

export interface Positioned {
  readonly positions: Map<string, { x: number; y: number }>
  readonly width: number
  readonly height: number
}

/** Top-left positions (React Flow's origin), keyed by node id. */
export function layout(ids: readonly string[], edges: readonly LayoutEdge[]): Positioned {
  const g = new Dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 24, ranksep: 90, marginx: 16, marginy: 16 })

  for (const id of ids) g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const edge of edges) {
    // Only lay out edges whose endpoints are both present in this view.
    if (g.hasNode(edge.from) && g.hasNode(edge.to)) g.setEdge(edge.from, edge.to)
  }

  Dagre.layout(g)

  const positions = new Map<string, { x: number; y: number }>()
  for (const id of ids) {
    const node = g.node(id)
    // dagre centres nodes; React Flow positions by top-left.
    positions.set(id, { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 })
  }

  const { width = 0, height = 0 } = g.graph()
  return { positions, width, height }
}
