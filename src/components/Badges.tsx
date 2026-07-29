/**
 * Status, type and gate marks.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULE THIS FILE EXISTS TO ENFORCE (SPEC §3, §5)
 *
 * `AT_RISK` is never green, never reads as healthy, and is always visually
 * distinct from `IN_PROGRESS` — distinct in HUE, not merely in brightness, so
 * the difference survives greyscale and colour-vision deficiency.
 *
 * Aging is always displayed for `AT_RISK` and `BLOCKED`. There is no prop to
 * turn it off. A caller that could suppress aging would eventually be used to
 * suppress it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Status, TaskType } from '../../schema/program.schema.js'
import { daysSince } from '../lib/program.js'

/**
 * Both themes are spelled out per status rather than being derived from one
 * palette, so the AT_RISK rule is checkable by reading this table: no entry
 * here may use a green hue, in either theme.
 */
const STATUS_STYLE: Record<Status, string> = {
  NOT_STARTED:
    'text-slate-600 border-slate-300 bg-slate-100 dark:text-slate-400 dark:border-slate-600/60 dark:bg-slate-500/10',
  IN_PROGRESS:
    'text-cyan-700 border-cyan-400 bg-cyan-50 dark:text-cyan-300 dark:border-cyan-500/60 dark:bg-cyan-500/10',
  AT_RISK:
    'text-amber-700 border-amber-500 bg-amber-50 dark:text-amber-300 dark:border-amber-500/70 dark:bg-amber-500/15',
  BLOCKED:
    'text-red-700 border-red-500 bg-red-50 dark:text-red-300 dark:border-red-500/70 dark:bg-red-500/15',
  COMPLETE:
    'text-emerald-700 border-emerald-400 bg-emerald-50 dark:text-emerald-300 dark:border-emerald-600/50 dark:bg-emerald-500/10',
}

const STATUS_LABEL: Record<Status, string> = {
  NOT_STARTED: 'NOT STARTED',
  IN_PROGRESS: 'IN PROGRESS',
  AT_RISK: 'AT RISK',
  BLOCKED: 'BLOCKED',
  COMPLETE: 'COMPLETE',
}

/** Statuses whose aging must always be shown (SPEC §3, D6). */
const AGING: Status[] = ['AT_RISK', 'BLOCKED']

export function StatusBadge({
  status,
  since,
  today,
}: {
  status: Status
  since?: string | undefined
  today?: Date
}) {
  const showsAging = AGING.includes(status)

  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span
        className={`inline-block rounded-sm border px-1.5 py-px font-mono text-[11px] tracking-wide ${STATUS_STYLE[status]}`}
      >
        {STATUS_LABEL[status]}
      </span>
      {showsAging &&
        (since === undefined ? (
          // Never silently omit aging. A missing date is itself the finding.
          <span className="font-mono text-[11px] text-red-600 dark:text-red-400" title="No status_since recorded">
            no date
          </span>
        ) : (
          <span
            className="font-mono text-[11px] text-slate-500 dark:text-slate-400"
            title={`In this state since ${since}`}
          >
            {daysSince(since, today)}d
          </span>
        ))}
    </span>
  )
}

const TYPE_STYLE: Record<TaskType, string> = {
  PHY: 'text-orange-700 border-orange-400 bg-orange-50 dark:text-orange-300 dark:border-orange-600/50 dark:bg-orange-500/10',
  DIG: 'text-sky-700 border-sky-400 bg-sky-50 dark:text-sky-300 dark:border-sky-600/50 dark:bg-sky-500/10',
  DOC: 'text-violet-700 border-violet-400 bg-violet-50 dark:text-violet-300 dark:border-violet-600/50 dark:bg-violet-500/10',
  HYB: 'text-fuchsia-700 border-fuchsia-400 bg-fuchsia-50 dark:text-fuchsia-300 dark:border-fuchsia-600/50 dark:bg-fuchsia-500/10',
}

const TYPE_TITLE: Record<TaskType, string> = {
  PHY: 'Physical work — trades, rigging, terminations, mechanical, electrical',
  DIG: 'Digital work — configuration, provisioning, testing, software',
  DOC: 'Documentation, contractual, or approval work',
  HYB: 'Requires physical and digital in the same task, usually with two owners present',
}

export function TypeBadge({ type }: { type: TaskType }) {
  return (
    <span
      title={TYPE_TITLE[type]}
      className={`inline-block rounded-sm border px-1.5 py-px font-mono text-[11px] ${TYPE_STYLE[type]}`}
    >
      {type}
    </span>
  )
}

/**
 * Gate count, never a bare marker (D8).
 *
 * Every milestone in this programme contains at least one gate, so a plain
 * siren on each would be true everywhere and convey nothing.
 */
export function GateCount({ count }: { count: number }) {
  if (count === 0) return <span className="text-slate-400 dark:text-slate-600">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-700 dark:text-amber-300"
      title={`${count} gate task${count === 1 ? '' : 's'} beneath this node`}
    >
      <span aria-hidden="true">◆</span>
      {count}
    </span>
  )
}

/** IDs are monospace everywhere — they are identifiers, and they get searched for. */
export function Id({ children }: { children: string }) {
  return <span className="font-mono text-slate-900 dark:text-slate-200">{children}</span>
}

export function Role({ id }: { id: string }) {
  return (
    <span className="font-mono text-[11px] text-slate-600 border border-slate-300 dark:text-slate-300 dark:border-slate-700 rounded-sm px-1 py-px">
      {id}
    </span>
  )
}
