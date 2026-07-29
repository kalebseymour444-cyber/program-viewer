/**
 * Loading and holding the program document.
 *
 * `program.json` is fetched once at startup and never refetched — it is a build
 * artifact, so it cannot change while the page is open (SPEC §5).
 */

import { createContext, useContext } from 'react'
import type { ProgramDocument } from '../../scripts/render/json.js'
import type { Scenario } from '../../graph/schedule.js'

export type { ProgramDocument }
export type { Scenario }

export type MilestoneRow = ProgramDocument['milestones'][number]
export type PackageRow = ProgramDocument['packages'][number]
export type TaskRow = ProgramDocument['tasks'][number]
export type ScenarioData = ProgramDocument['scenarios']['pessimistic']

export async function loadProgram(signal?: AbortSignal): Promise<ProgramDocument> {
  // BASE_URL carries the Pages sub-path, so this resolves correctly whether the
  // site is served from / or from /<repo-name>/.
  const url = `${import.meta.env.BASE_URL}program.json`
  const response = await fetch(url, signal ? { signal } : {})

  if (!response.ok) {
    throw new Error(
      `Could not load ${url} (${response.status}). ` +
        `It is generated — run \`npm run generate\` before serving the app.`,
    )
  }

  return (await response.json()) as ProgramDocument
}

export const ProgramContext = createContext<ProgramDocument | null>(null)

export function useProgram(): ProgramDocument {
  const program = useContext(ProgramContext)
  if (program === null) {
    throw new Error('useProgram must be used inside <ProgramContext.Provider>')
  }
  return program
}

/**
 * Pessimistic is the default everywhere (D3).
 *
 * SPEC §3 forbids rounding toward optimism, and the critical path can be a
 * different path at each end of the duration ranges — so an unlabelled figure
 * is not an answer. Every view that shows a scheduled number must also show
 * which scenario produced it.
 */
export const DEFAULT_SCENARIO: Scenario = 'pessimistic'

export const scenarioOf = (program: ProgramDocument, scenario: Scenario): ScenarioData =>
  program.scenarios[scenario]

/** Whole days between an ISO date and today, for aging. */
export function daysSince(since: string, today = new Date()): number {
  const from = Date.parse(`${since}T00:00:00Z`)
  const to = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.max(0, Math.round((to - from) / 86_400_000))
}
