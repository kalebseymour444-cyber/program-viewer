/**
 * The dependency graph — nodes are tasks, edges are predecessor→successor.
 *
 * Presentational: it is told which tasks to show, which are highlighted, and
 * which are on the critical path, and it renders them. The chain computation
 * (which nodes are up/downstream of the selection) is the caller's job, done
 * once with the tested `closureOf` — this component never walks the graph.
 */

import '@xyflow/react/dist/style.css'
import { useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react'
import type { TaskRow } from '../../lib/program.js'
import { NODE_HEIGHT, NODE_WIDTH, layout, type LayoutEdge } from './layout.js'
import { TaskNode, type TaskNodeData } from './TaskNode.js'

const nodeTypes = { task: TaskNode }

export interface DependencyGraphProps {
  readonly tasks: readonly TaskRow[]
  readonly selectedId: string | null
  /** Ids to keep lit. `null` = nothing selected, so nothing dims. */
  readonly highlighted: ReadonlySet<string> | null
  readonly criticalTasks: ReadonlySet<string>
  readonly onSelect: (id: string | null) => void
}

export function DependencyGraph(props: DependencyGraphProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  )
}

function Flow({ tasks, selectedId, highlighted, criticalTasks, onSelect }: DependencyGraphProps) {
  const shown = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks])

  const edges = useMemo<LayoutEdge[]>(() => {
    const out: LayoutEdge[] = []
    for (const task of tasks) {
      for (const from of task.predecessors) {
        if (shown.has(from)) out.push({ from, to: task.id })
      }
    }
    return out
  }, [tasks, shown])

  // Layout is expensive and deterministic; recompute only when the node/edge set
  // changes, not when selection (a pure styling change) does.
  const positioned = useMemo(
    () => layout(tasks.map((t) => t.id), edges),
    [tasks, edges],
  )

  const flowNodes = useMemo<Node<TaskNodeData>[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        type: 'task',
        position: positioned.positions.get(task.id) ?? { x: 0, y: 0 },
        data: {
          task,
          critical: criticalTasks.has(task.id),
          selected: task.id === selectedId,
          dimmed: highlighted !== null && !highlighted.has(task.id),
        },
        draggable: false,
      })),
    [tasks, positioned, criticalTasks, selectedId, highlighted],
  )

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map(({ from, to }) => {
        const onChain = highlighted !== null && highlighted.has(from) && highlighted.has(to)
        const critical = criticalTasks.has(from) && criticalTasks.has(to)
        const dimmed = highlighted !== null && !onChain
        return {
          id: `${from}->${to}`,
          source: from,
          target: to,
          animated: onChain,
          style: {
            stroke: critical ? '#ef4444' : onChain ? '#06b6d4' : '#94a3b8',
            strokeWidth: critical || onChain ? 2 : 1,
            opacity: dimmed ? 0.12 : critical ? 0.9 : 0.5,
          },
        }
      }),
    [edges, highlighted, criticalTasks],
  )

  const onNodeClick = useMemo<NodeMouseHandler>(
    () => (_event, node) => onSelect(node.id),
    [onSelect],
  )

  const { setCenter, fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()

  // Fit (or centre on the selection) only once React Flow has measured the
  // nodes. Fitting before measurement computes empty bounds and leaves the
  // viewport at the origin — which then culls every off-screen node and edge.
  useEffect(() => {
    if (!nodesInitialized) return
    if (selectedId !== null) {
      const pos = positioned.positions.get(selectedId)
      if (pos !== undefined) {
        void setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, { zoom: 1, duration: 400 })
        return
      }
    }
    void fitView({ padding: 0.12, duration: 300 })
  }, [nodesInitialized, selectedId, positioned, setCenter, fitView])

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={() => onSelect(null)}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.1}
      // Initial auto-fit once nodes are measured; the effect below re-fits on
      // filter changes and centres on the selection.
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-slate-50 dark:bg-slate-950"
    >
      <Background color="#64748b" gap={24} className="opacity-30" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeStrokeWidth={2}
        className="!bg-white dark:!bg-slate-900"
        nodeColor={(n) => ((n.data as TaskNodeData).critical ? '#ef4444' : '#64748b')}
      />
    </ReactFlow>
  )
}
