/**
 * Resource contention — tasks sharing an owner with overlapping windows (SPEC §3).
 *
 * With `owners: RoleId[]` (D2) a task contends on EVERY role it names, which is
 * the correct reading: `conventions.md` defines HYB as needing both people
 * present at the same time, so a HYB task genuinely occupies two roles at once.
 *
 * ── This output is large, and that is not hidden ────────────────────────────
 * There is no capacity field on a role (Q20, unresolved). NET-R owns roughly a
 * third of the programme, so it will overlap with itself constantly and its
 * peak concurrency will be high. Without knowing how many engineers NET-R has,
 * no threshold here could separate real contention from arithmetic. So this
 * module computes the overlaps and the peak, and leaves the judgement to a
 * human — rather than inventing a cutoff that silently drops the real ones.
 *
 * Zero-length tasks (D4) are excluded: they occupy no window, so they cannot
 * contend for one.
 */

import type { Task } from '../schema/program.schema.js'
import type { Schedule } from './schedule.js'

export interface OwnerWindow {
  readonly taskId: string
  readonly start: number
  readonly end: number
}

export interface RoleContention {
  readonly role: string
  /** Windows held by this role, ordered by start then ID. */
  readonly windows: readonly OwnerWindow[]
  /** The most tasks this role is expected to run at once. */
  readonly peakConcurrency: number
  /** Day offsets over which the peak holds. Empty when peak <= 1. */
  readonly peakWindow?: { readonly start: number; readonly end: number }
  /** Task ID pairs whose windows overlap, sorted. */
  readonly overlaps: readonly (readonly [string, string])[]
}

/** Half-open windows: a task finishing on day 10 does not contend with one starting on day 10. */
const overlaps = (a: OwnerWindow, b: OwnerWindow): boolean => a.start < b.end && b.start < a.end

export function computeContention(
  tasks: readonly Task[],
  schedule: Schedule,
): Map<string, RoleContention> {
  const byRole = new Map<string, OwnerWindow[]>()

  for (const task of tasks) {
    const timing = schedule.tasks.get(task.id)
    if (timing === undefined) continue
    if (timing.earliestFinish <= timing.earliestStart) continue // zero-length: no window

    for (const role of task.owners) {
      const window = {
        taskId: task.id,
        start: timing.earliestStart,
        end: timing.earliestFinish,
      }
      const list = byRole.get(role)
      if (list === undefined) byRole.set(role, [window])
      else list.push(window)
    }
  }

  const result = new Map<string, RoleContention>()

  for (const role of [...byRole.keys()].sort()) {
    const windows = byRole
      .get(role)!
      .sort((a, b) => a.start - b.start || (a.taskId < b.taskId ? -1 : 1))

    const pairs: [string, string][] = []
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i]!
        const b = windows[j]!
        // Windows are start-ordered, so once one starts at or after a's end,
        // nothing later can overlap a either.
        if (b.start >= a.end) break
        if (overlaps(a, b)) pairs.push([a.taskId, b.taskId])
      }
    }

    const peak = sweep(windows)

    result.set(role, {
      role,
      windows,
      peakConcurrency: peak.count,
      ...(peak.count > 1 && peak.window ? { peakWindow: peak.window } : {}),
      overlaps: pairs.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] < y[1] ? -1 : 1)),
    })
  }

  return result
}

/** Sweep line over window boundaries to find maximum simultaneous occupancy. */
function sweep(windows: readonly OwnerWindow[]): {
  count: number
  window?: { start: number; end: number }
} {
  const events: { at: number; delta: number }[] = []
  for (const w of windows) {
    events.push({ at: w.start, delta: 1 })
    events.push({ at: w.end, delta: -1 })
  }
  // Ends before starts at the same instant, so touching windows do not count as concurrent.
  events.sort((a, b) => a.at - b.at || a.delta - b.delta)

  let current = 0
  let best = 0
  let bestStart = 0
  let bestEnd = 0

  for (let i = 0; i < events.length; i++) {
    current += events[i]!.delta
    if (current > best) {
      best = current
      bestStart = events[i]!.at
      bestEnd = events[i + 1]?.at ?? bestStart
    }
  }

  return best > 1 ? { count: best, window: { start: bestStart, end: bestEnd } } : { count: best }
}
