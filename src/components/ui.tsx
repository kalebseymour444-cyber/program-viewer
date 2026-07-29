/**
 * Small presentation primitives shared by the L0/L1/L2 tables.
 *
 * Extracted so the three levels render numbers and cells identically — a task's
 * duration must look the same in the package table as in a milestone summary,
 * and the em-dash-not-zero rule (D4) lives in exactly one place.
 */

import type { Duration } from '../../schema/program.schema.js'

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-1.5 font-medium ${className}`}>{children}</th>
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-1.5 align-baseline ${className}`}>{children}</td>
}

/** A day offset or span. Always suffixed `d` so a bare number is never ambiguous. */
export function Days({ value }: { value: number }) {
  return <span className="font-mono tabular-nums">{value}d</span>
}

/** A muted em dash for an absent value — never a fabricated zero. */
export function Dash() {
  return <span className="text-slate-400 dark:text-slate-600">—</span>
}

/**
 * Authored task duration as a range.
 *
 * Absent duration renders as `—`, never `0d` (D4): a task with no duration is
 * a sequencing point, not a zero-length one, and the two must not look alike. A
 * fixed duration (min === max) collapses to a single figure.
 */
export function DurationRange({ duration }: { duration: Duration | undefined }) {
  if (duration === undefined) return <Dash />
  if (duration.min === duration.max) return <Days value={duration.max} />
  return (
    <span className="font-mono tabular-nums whitespace-nowrap">
      {duration.min}–{duration.max}d
    </span>
  )
}
