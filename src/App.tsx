import { useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout, ScenarioProvider } from './components/Layout.js'
import { ProgramContext, loadProgram, type ProgramDocument } from './lib/program.js'
import { ProgramView } from './routes/Program.js'
import { MilestoneView } from './routes/Milestone.js'
import { PackageView } from './routes/Package.js'
import { TaskFocusView } from './routes/Task.js'
import { GraphView } from './routes/Graph.js'

/**
 * Hash routing, not browser routing.
 *
 * GitHub Pages serves static files with no rewrite rules, so a deep link to
 * /task/M4.3.3 would 404 on refresh. `#/task/M4.3.3` is handled entirely in the
 * browser, which makes every view genuinely shareable (SPEC §5) on a host that
 * cannot be configured.
 */
export function App() {
  const [program, setProgram] = useState<ProgramDocument | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadProgram(controller.signal)
      .then(setProgram)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause : new Error(String(cause)))
      })
    return () => controller.abort()
  }, [])

  if (error !== null) return <LoadFailure error={error} />
  if (program === null) return <Loading />

  return (
    <ProgramContext.Provider value={program}>
      <ScenarioProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<ProgramView />} />
              <Route path="/graph" element={<GraphView />} />
              <Route path="/milestone/:milestoneId" element={<MilestoneView />} />
              <Route path="/package/:packageId" element={<PackageView />} />
              <Route path="/task/:taskId" element={<TaskFocusView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </HashRouter>
      </ScenarioProvider>
    </ProgramContext.Provider>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 font-mono text-sm text-slate-500">
      Loading program…
    </div>
  )
}

/**
 * A failure to load is stated plainly, with the fix.
 *
 * The most likely cause by far is that `npm run generate` has not been run, and
 * saying so is more useful than a stack trace.
 */
function LoadFailure({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-300">
      <h1 className="font-mono text-sm text-red-300">Could not load the program</h1>
      <pre className="mt-3 max-w-3xl whitespace-pre-wrap font-mono text-xs text-slate-400">
        {error.message}
      </pre>
    </div>
  )
}

function NotFound() {
  return (
    <div className="font-mono text-sm">
      <p className="text-slate-400">No such view.</p>
      <Link to="/" className="mt-2 inline-block text-cyan-300 hover:underline">
        ← Program
      </Link>
    </div>
  )
}
