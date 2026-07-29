/**
 * Status rollup and aging.
 *
 * SPEC §3: a milestone's status is the WORST status among its tasks. Never
 * average, never round toward optimism. The whole model exists so that
 * reporting is structurally capable of delivering bad news; a rollup that
 * softens a status defeats the point of building any of this.
 */

import type { Status } from '../schema/program.schema.js'

/**
 * Severity, worst first (decision D9).
 *
 * One blocked task blocks the milestone. A milestone with work underway reads
 * IN_PROGRESS even when some of its tasks are untouched; one where nothing has
 * started reads NOT_STARTED; COMPLETE requires every task to be complete.
 */
export const STATUS_SEVERITY: readonly Status[] = [
  'BLOCKED',
  'AT_RISK',
  'IN_PROGRESS',
  'NOT_STARTED',
  'COMPLETE',
]

const severityOf = (status: Status): number => {
  const rank = STATUS_SEVERITY.indexOf(status)
  /* istanbul ignore next — unreachable while Status and STATUS_SEVERITY agree */
  if (rank === -1) throw new Error(`unranked status "${status}" — add it to STATUS_SEVERITY`)
  return rank
}

/** The worst status among `statuses`. Throws on an empty list: an empty rollup has no status. */
export function rollupStatus(statuses: readonly Status[]): Status {
  const first = statuses[0]
  if (first === undefined) {
    throw new Error('rollupStatus: no statuses to roll up — validation should have caught this')
  }
  return statuses.reduce((worst, s) => (severityOf(s) < severityOf(worst) ? s : worst), first)
}

/** Statuses whose aging must always be displayed (SPEC §3, D6). */
export const AGING_STATUSES: readonly Status[] = ['AT_RISK', 'BLOCKED']

export const agingMustBeShown = (status: Status): boolean => AGING_STATUSES.includes(status)

const MS_PER_DAY = 86_400_000

/**
 * Whole days between `since` and `asOf`, both ISO dates.
 *
 * `asOf` is a required parameter rather than "today" on purpose. Days-in-state
 * computed at build time would change every day, so every regeneration would
 * diff even when nothing about the program changed — which would bury real
 * status changes in noise and break the review-as-pull-request model of §7.
 * The app passes today at render time; the generator passes an explicit date.
 */
export function daysInState(since: string, asOf: string): number {
  const from = Date.parse(`${since}T00:00:00Z`)
  const to = Date.parse(`${asOf}T00:00:00Z`)
  if (Number.isNaN(from)) throw new Error(`daysInState: "${since}" is not an ISO date`)
  if (Number.isNaN(to)) throw new Error(`daysInState: "${asOf}" is not an ISO date`)
  return Math.round((to - from) / MS_PER_DAY)
}
