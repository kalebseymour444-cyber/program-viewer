/**
 * One task in the dependency graph.
 *
 * Carries the same status semantics as the tables (SPEC §3): the border hue is
 * per-status and AT_RISK is amber, never green — a node must not read as healthy
 * when it is at risk any more than a table row may. Critical-path membership is a
 * red edge accent, selection is a cyan ring, and everything off the highlighted
 * chain is dimmed rather than hidden, so context stays on screen.
 */

import { Handle, Position } from '@xyflow/react'
import type { Status } from '../../../schema/program.schema.js'
import { TypeBadge } from '../Badges.js'
import type { TaskRow } from '../../lib/program.js'

/** Border hue per status. Distinct hues, not shades — and no green for AT_RISK. */
const STATUS_BORDER: Record<Status, string> = {
  NOT_STARTED: 'border-slate-400 dark:border-slate-600',
  IN_PROGRESS: 'border-cyan-500 dark:border-cyan-500/70',
  AT_RISK: 'border-amber-500 dark:border-amber-500/80',
  BLOCKED: 'border-red-500 dark:border-red-500/80',
  COMPLETE: 'border-emerald-500 dark:border-emerald-600/70',
}

export interface TaskNodeData {
  readonly task: TaskRow
  readonly critical: boolean
  readonly selected: boolean
  readonly dimmed: boolean
  [key: string]: unknown
}

export function TaskNode({ data }: { data: TaskNodeData }) {
  const { task, critical, selected, dimmed } = data

  return (
    <div
      className={`h-[46px] w-[168px] rounded-sm border bg-white px-2 py-1 shadow-sm transition-opacity dark:bg-slate-900 ${
        STATUS_BORDER[task.status]
      } ${critical ? 'border-l-4 border-l-red-500 dark:border-l-red-400' : ''} ${
        selected ? 'ring-2 ring-cyan-500 dark:ring-cyan-400' : ''
      } ${dimmed ? 'opacity-25' : ''}`}
      title={`${task.id} — ${task.name}`}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-slate-400" />
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[11px] text-slate-900 dark:text-slate-200">{task.id}</span>
        <TypeBadge type={task.type} />
      </div>
      <div className="truncate text-[10px] leading-tight text-slate-600 dark:text-slate-400">
        {task.name}
      </div>
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-slate-400" />
    </div>
  )
}
