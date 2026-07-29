/**
 * The whole-program dependency graph — the feature SPEC §5 calls the point of
 * the application.
 *
 * All tasks by default; select any node and its complete upstream and downstream
 * chains light up while everything else dims, with the longest-reach dependency
 * called out beside the graph. Selection lives in the URL (`?focus=M4.3.3`) so
 * every view of a chain is shareable. Filters narrow the field for exploration;
 * clearing them (the default) shows the full chain on any selection.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Status, TaskType } from '../../schema/program.schema.js'
import { closureOf } from '../../graph/closure.js'
import { ChainPanel } from '../components/graph/ChainPanel.js'
import { DependencyGraph } from '../components/graph/DependencyGraph.js'
import { useScenario } from '../components/Layout.js'
import { graphInputs } from '../lib/graph.js'
import { useIndex, useProgram } from '../lib/program.js'

export function GraphView() {
  const program = useProgram()
  const index = useIndex()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]

  const [params, setParams] = useSearchParams()
  const selectedId = params.get('focus')

  const milestoneFilter = params.get('milestone') ?? 'all'
  const typeFilter = (params.get('type') ?? 'all') as TaskType | 'all'
  const ownerFilter = params.get('owner') ?? 'all'
  const statusFilter = (params.get('status') ?? 'all') as Status | 'all'

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value === 'all' || value === '') next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const select = useCallback(
    (id: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id === null) next.delete('focus')
          else next.set('focus', id)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  // esc clears the selection (SPEC §5). Full keyboard nav is phase 9.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  const milestoneOf = useCallback(
    (taskPackageId: string) => index.packages.get(taskPackageId)?.milestone ?? '',
    [index],
  )

  const tasks = useMemo(
    () =>
      program.tasks.filter(
        (task) =>
          (milestoneFilter === 'all' || milestoneOf(task.package) === milestoneFilter) &&
          (typeFilter === 'all' || task.type === typeFilter) &&
          (statusFilter === 'all' || task.status === statusFilter) &&
          (ownerFilter === 'all' || task.owners.includes(ownerFilter)),
      ),
    [program.tasks, milestoneFilter, typeFilter, statusFilter, ownerFilter, milestoneOf],
  )

  const closure = useMemo(() => {
    if (selectedId === null) return null
    const { adjacency, schedules } = graphInputs(program)
    if (!adjacency.predecessors.has(selectedId)) return null
    return closureOf(adjacency, selectedId, schedules[scenario])
  }, [selectedId, program, scenario])

  const highlighted = useMemo(() => {
    if (closure === null) return null
    return new Set<string>([
      closure.id,
      ...closure.upstream.map((n) => n.id),
      ...closure.downstream.map((n) => n.id),
    ])
  }, [closure])

  const criticalTasks = useMemo(() => new Set(data.criticalTasks), [data])

  const owners = useMemo(() => program.roles.map((r) => r.id).sort(), [program.roles])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <h2 className="mr-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Dependency graph
        </h2>
        <Select label="Milestone" value={milestoneFilter} onChange={(v) => setParam('milestone', v)}>
          <option value="all">All</option>
          {program.milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </Select>
        <Select label="Type" value={typeFilter} onChange={(v) => setParam('type', v)}>
          <option value="all">All</option>
          {(['PHY', 'DIG', 'DOC', 'HYB'] as const).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select label="Status" value={statusFilter} onChange={(v) => setParam('status', v)}>
          <option value="all">All</option>
          {(['NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'BLOCKED', 'COMPLETE'] as const).map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </Select>
        <Select label="Owner" value={ownerFilter} onChange={(v) => setParam('owner', v)}>
          <option value="all">All</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
        <span className="ml-auto self-center font-mono text-[11px] text-slate-500 dark:text-slate-500">
          {tasks.length} shown · {selectedId ? `${(highlighted?.size ?? 1) - 1} on chain` : 'no selection'}
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="h-[74vh] min-w-0 flex-1 overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800">
          {tasks.length === 0 ? (
            <div className="flex h-full items-center justify-center font-mono text-sm text-slate-500">
              No tasks match these filters.
            </div>
          ) : (
            <DependencyGraph
              tasks={tasks}
              selectedId={selectedId}
              highlighted={highlighted}
              criticalTasks={criticalTasks}
              onSelect={select}
            />
          )}
        </div>

        <aside className="h-[74vh] w-full shrink-0 rounded-sm border border-slate-200 p-3 dark:border-slate-800 lg:w-80">
          {closure === null ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center font-mono text-[11px] text-slate-400 dark:text-slate-600">
              <span aria-hidden="true" className="text-2xl">
                ◇
              </span>
              Select a task to trace its
              <br />
              upstream and downstream chains.
            </div>
          ) : (
            <ChainPanel closure={closure} onSelect={(id) => select(id)} />
          )}
        </aside>
      </div>

      <Legend />
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500 dark:text-slate-500">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-4 border-l-4 border-red-500" /> critical (zero float)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 bg-cyan-500" /> on selected chain
      </span>
      <span>border hue = status · AT_RISK is amber, never green</span>
      <span>click a node to trace · esc to clear</span>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {children}
      </select>
    </label>
  )
}
