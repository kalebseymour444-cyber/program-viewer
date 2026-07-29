/**
 * `/task/:id` — a single task, opened focused with its chains highlighted.
 *
 * This is SPEC §5's literal requirement: `#/task/M4.3.3` "opens that task,
 * focused, chains highlighted." The graph here is the task's own transitive
 * closure — itself plus everything upstream and downstream — so the far-reaching
 * dependency that a table hides is on screen the moment the link is opened.
 * Clicking any node re-focuses on it; the chain list mirrors the graph.
 */

import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { closureOf } from '../../graph/closure.js'
import { Id, Role, StatusBadge, TypeBadge } from '../components/Badges.js'
import { Breadcrumbs } from '../components/Breadcrumbs.js'
import { ChainPanel } from '../components/graph/ChainPanel.js'
import { DependencyGraph } from '../components/graph/DependencyGraph.js'
import { useScenario } from '../components/Layout.js'
import { MissingNode } from '../components/MissingNode.js'
import { DurationRange } from '../components/ui.js'
import { graphInputs } from '../lib/graph.js'
import { useIndex, useProgram } from '../lib/program.js'

export function TaskFocusView() {
  const { taskId = '' } = useParams()
  const navigate = useNavigate()
  const program = useProgram()
  const index = useIndex()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]

  const task = index.tasks.get(taskId)

  const closure = useMemo(() => {
    const { adjacency, schedules } = graphInputs(program)
    if (!adjacency.predecessors.has(taskId)) return null
    return closureOf(adjacency, taskId, schedules[scenario])
  }, [program, taskId, scenario])

  const shown = useMemo(() => {
    if (closure === null) return []
    const ids = [closure.id, ...closure.upstream.map((n) => n.id), ...closure.downstream.map((n) => n.id)]
    return ids.map((id) => index.tasks.get(id)!).filter(Boolean)
  }, [closure, index])

  // The whole subgraph IS the chain, so every shown node stays lit.
  const highlighted = useMemo(() => new Set(shown.map((t) => t.id)), [shown])
  const criticalTasks = useMemo(() => new Set(data.criticalTasks), [data])

  if (task === undefined || closure === null) {
    return <MissingNode kind="task" id={taskId} />
  }

  const pkg = index.packages.get(task.package)
  const milestoneId = pkg?.milestone ?? ''

  return (
    <div className="space-y-4">
      <Breadcrumbs
        trail={[
          { label: 'Program', to: '/' },
          { label: milestoneId, to: `/milestone/${milestoneId}` },
          { label: task.package, to: `/package/${task.package}` },
          { label: task.id },
        ]}
      />

      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <Id>{task.id}</Id>
          <TypeBadge type={task.type} />
          <h1 className="text-lg text-slate-900 dark:text-slate-100">{task.name}</h1>
          <StatusBadge status={task.status} since={task.status_since} />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1">
            owners
            {task.owners.map((id) => (
              <Role key={id} id={id} />
            ))}
          </span>
          <span>
            duration <DurationRange duration={task.duration} />
          </span>
          <span>
            float{' '}
            <span className={data.tasks[task.id]!.float === 0 ? 'text-red-600 dark:text-red-300' : undefined}>
              {data.tasks[task.id]!.float}d
            </span>
          </span>
          <Link to={`/package/${task.package}?focus=${task.id}`} className="text-cyan-700 hover:underline dark:text-cyan-300">
            in package table ↗
          </Link>
          <Link to={`/graph?focus=${task.id}`} className="text-cyan-700 hover:underline dark:text-cyan-300">
            in full graph ↗
          </Link>
        </div>
        {task.gate && (
          <div className="rounded-sm border border-amber-300 bg-amber-50/50 p-2 text-xs dark:border-amber-500/40 dark:bg-amber-500/5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
              ◆ gate
            </span>
            {task.criterion !== undefined && (
              <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-500">Criterion — </span>
                {task.criterion}
              </p>
            )}
            {task.evidence !== undefined && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="text-slate-500 dark:text-slate-500">Evidence — </span>
                {task.evidence}
              </p>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="h-[68vh] min-w-0 flex-1 overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800">
          <DependencyGraph
            tasks={shown}
            selectedId={task.id}
            highlighted={highlighted}
            criticalTasks={criticalTasks}
            onSelect={(id) => {
              if (id !== null && id !== task.id) navigate(`/task/${id}`)
            }}
          />
        </div>
        <aside className="h-[68vh] w-full shrink-0 rounded-sm border border-slate-200 p-3 dark:border-slate-800 lg:w-80">
          <ChainPanel closure={closure} onSelect={(id) => navigate(`/task/${id}`)} />
        </aside>
      </div>
    </div>
  )
}
