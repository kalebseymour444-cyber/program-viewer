import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import type { Scenario } from '../lib/program.js'
import { DEFAULT_SCENARIO, useProgram } from '../lib/program.js'

/* ── Scenario ───────────────────────────────────────────────────────────────
 *
 * Which end of the duration ranges every scheduled figure comes from (D3).
 * Held at the top so a page can never show optimistic and pessimistic numbers
 * side by side without saying so.
 */

const ScenarioContext = createContext<{
  scenario: Scenario
  setScenario: (s: Scenario) => void
}>({ scenario: DEFAULT_SCENARIO, setScenario: () => {} })

export const useScenario = () => useContext(ScenarioContext)

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO)
  return (
    <ScenarioContext.Provider value={{ scenario, setScenario }}>{children}</ScenarioContext.Provider>
  )
}

function ScenarioToggle() {
  const { scenario, setScenario } = useScenario()

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500">Durations</span>
      <div
        className="flex rounded-sm border border-slate-300 dark:border-slate-700 overflow-hidden"
        role="group"
        aria-label="Duration scenario"
      >
        {(['optimistic', 'pessimistic'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setScenario(option)}
            aria-pressed={scenario === option}
            title={
              option === 'pessimistic'
                ? 'Longest duration in each range. The default — never round toward optimism.'
                : 'Shortest duration in each range. The critical path may be a different path.'
            }
            className={`px-2 py-0.5 font-mono text-[11px] transition-colors ${
              scenario === option
                ? 'bg-slate-800 text-slate-100 dark:bg-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {option === 'pessimistic' ? 'PESS' : 'OPT'}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      // Private browsing; the toggle still works for this session.
    }
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="rounded-sm border border-slate-300 px-2 py-0.5 font-mono text-[11px] text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? 'DARK' : 'LIGHT'}
    </button>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const program = useProgram()

  return (
    <div className="min-h-screen bg-white text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-[1600px] px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-3 mr-auto min-w-0">
            <h1 className="font-mono text-sm text-slate-900 dark:text-slate-100 truncate">{program.program.name}</h1>
            {program.program.description !== undefined && (
              <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-500 truncate">
                {program.program.description}
              </span>
            )}
          </div>
          <ScenarioToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-[1600px] px-4 py-8 text-[11px] text-slate-400 dark:text-slate-600">
        Generated from <span className="font-mono">program.yaml</span>. Every rolled-up figure is
        derived — nothing on this page is authored twice.
      </footer>
    </div>
  )
}
