/**
 * L2 — a single work package's full task table.
 *
 * Every column SPEC §5 asks for: ID, name, type, owners, duration, predecessors,
 * successors, gate, status with days-in-state, and float. Sortable by clicking a
 * header; filterable by status, type, and owner. A deep link to `/task/<id>`
 * lands here with that row highlighted (the parent package is derived from the
 * task's own ID via the rollup, never by slicing the string).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Status, TaskType } from '../../schema/program.schema.js'
import { Id, Role, StatusBadge, TypeBadge } from '../components/Badges.js'
import { Breadcrumbs } from '../components/Breadcrumbs.js'
import { useScenario } from '../components/Layout.js'
import { MissingNode } from '../components/MissingNode.js'
import { Dash, Days, DurationRange, Td, Th } from '../components/ui.js'
import { useIndex, useProgram, type TaskRow } from '../lib/program.js'

/** Worst-first, so sorting the status column surfaces the problems (SPEC §3). */
const STATUS_RANK: Record<Status, number> = {
  BLOCKED: 0,
  AT_RISK: 1,
  IN_PROGRESS: 2,
  NOT_STARTED: 3,
  COMPLETE: 4,
}

type SortKey = 'id' | 'name' | 'type' | 'status' | 'float'
type Direction = 'asc' | 'desc'

export function PackageView({
  packageId: packageIdProp,
  focusTaskId,
}: {
  packageId?: string
  focusTaskId?: string
} = {}) {
  const params = useParams()
  const packageId = packageIdProp ?? params.packageId ?? ''

  const program = useProgram()
  const index = useIndex()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]

  const [sort, setSort] = useState<{ key: SortKey; dir: Direction }>({ key: 'id', dir: 'asc' })
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  const pkg = index.packages.get(packageId)

  const tasks = useMemo(
    () => (pkg ? pkg.taskIds.map((id) => index.tasks.get(id)!) : []),
    [pkg, index],
  )

  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const task of tasks) for (const owner of task.owners) set.add(owner)
    return [...set].sort()
  }, [tasks])

  const rows = useMemo(() => {
    const filtered = tasks.filter(
      (task) =>
        (statusFilter === 'all' || task.status === statusFilter) &&
        (typeFilter === 'all' || task.type === typeFilter) &&
        (ownerFilter === 'all' || task.owners.includes(ownerFilter)),
    )

    const key = (task: TaskRow): string | number => {
      switch (sort.key) {
        case 'id':
          return task.id
        case 'name':
          return task.name.toLowerCase()
        case 'type':
          return task.type
        case 'status':
          return STATUS_RANK[task.status]
        case 'float':
          return data.tasks[task.id]!.float
      }
    }

    const sorted = [...filtered].sort((a, b) => {
      const ka = key(a)
      const kb = key(b)
      const cmp = ka < kb ? -1 : ka > kb ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [tasks, statusFilter, typeFilter, ownerFilter, sort, data])

  if (pkg === undefined) {
    return <MissingNode kind="package" id={packageId} />
  }

  // The package authors its parent milestone (schema §3) — no ID slicing.
  const milestoneId = pkg.milestone
  const milestoneName = index.milestones.get(milestoneId)?.name

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )

  return (
    <div className="space-y-6">
      <Breadcrumbs
        trail={[
          { label: 'Program', to: '/' },
          { label: milestoneId, to: `/milestone/${milestoneId}` },
          { label: pkg.id },
        ]}
      />

      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Id>{pkg.id}</Id>
          <h1 className="text-lg text-slate-900 dark:text-slate-100">{pkg.name}</h1>
          <StatusBadge status={pkg.status} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          {milestoneName !== undefined && (
            <>
              In{' '}
              <Link
                to={`/milestone/${milestoneId}`}
                className="font-mono hover:underline"
              >
                {milestoneId}
              </Link>{' '}
              {milestoneName} · {' '}
            </>
          )}
          {pkg.taskIds.length} task{pkg.taskIds.length === 1 ? '' : 's'} · {pkg.gateCount} gate
          {pkg.gateCount === 1 ? '' : 's'}
        </p>
      </header>

      <Filters
        owners={owners}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        ownerFilter={ownerFilter}
        onStatus={setStatusFilter}
        onType={setTypeFilter}
        onOwner={setOwnerFilter}
        showing={rows.length}
        total={tasks.length}
      />

      <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60">
              <SortableTh label="ID" col="id" sort={sort} onClick={toggleSort} />
              <SortableTh label="Task" col="name" sort={sort} onClick={toggleSort} />
              <SortableTh label="Type" col="type" sort={sort} onClick={toggleSort} />
              <Th>Owners</Th>
              <Th className="text-right">Duration</Th>
              <Th>Predecessors</Th>
              <Th>Successors</Th>
              <Th>Gate</Th>
              <SortableTh label="Status" col="status" sort={sort} onClick={toggleSort} />
              <SortableTh label="Float" col="float" sort={sort} onClick={toggleSort} className="text-right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <TaskRowView
                key={task.id}
                task={task}
                float={data.tasks[task.id]!.float}
                focused={task.id === focusTaskId}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-500">
                  No tasks match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaskRowView({
  task,
  float,
  focused,
}: {
  task: TaskRow
  float: number
  focused: boolean
}) {
  const ref = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    // Optional call: scrollIntoView is absent in jsdom and on older engines.
    if (focused) ref.current?.scrollIntoView?.({ block: 'center' })
  }, [focused])

  return (
    <tr
      ref={ref}
      className={`border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/40 ${
        focused ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-400 dark:bg-cyan-500/10 dark:ring-cyan-500/60' : ''
      }`}
    >
      <Td>
        <Id>{task.id}</Id>
        {task.external && (
          <span
            className="ml-1.5 font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500"
            title="Gated by something outside this program"
          >
            ext
          </span>
        )}
      </Td>
      <Td>
        <span className="text-slate-900 dark:text-slate-200">{task.name}</span>
        {task.gate && task.criterion !== undefined && (
          <p className="mt-0.5 max-w-md text-[11px] text-amber-700 dark:text-amber-300/80">{task.criterion}</p>
        )}
      </Td>
      <Td>
        <TypeBadge type={task.type} />
      </Td>
      <Td>
        <span className="flex flex-wrap gap-1">
          {task.owners.map((id) => (
            <Role key={id} id={id} />
          ))}
        </span>
      </Td>
      <Td className="text-right">
        <DurationRange duration={task.duration} />
      </Td>
      <RefList ids={task.predecessors} />
      <RefList ids={task.successors} />
      <Td>
        {task.gate ? (
          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300" title="Gate task">
            ◆ gate
          </span>
        ) : (
          <Dash />
        )}
      </Td>
      <Td>
        <StatusBadge status={task.status} since={task.status_since} />
      </Td>
      <Td className="text-right">
        <span className={float === 0 ? 'text-red-600 dark:text-red-300' : 'text-slate-500'}>
          <Days value={float} />
        </span>
      </Td>
    </tr>
  )
}

/** Task references link across packages — a successor often lives elsewhere. */
function RefList({ ids }: { ids: readonly string[] }) {
  if (ids.length === 0)
    return (
      <Td>
        <Dash />
      </Td>
    )
  return (
    <Td>
      <span className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <Link
            key={id}
            to={`/task/${id}`}
            className="font-mono text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {id}
          </Link>
        ))}
      </span>
    </Td>
  )
}

function SortableTh({
  label,
  col,
  sort,
  onClick,
  className = '',
}: {
  label: string
  col: SortKey
  sort: { key: SortKey; dir: Direction }
  onClick: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === col
  return (
    <Th className={className}>
      <button
        type="button"
        onClick={() => onClick(col)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 ${
          active ? 'text-slate-800 dark:text-slate-200' : ''
        }`}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </Th>
  )
}

function Filters({
  owners,
  statusFilter,
  typeFilter,
  ownerFilter,
  onStatus,
  onType,
  onOwner,
  showing,
  total,
}: {
  owners: string[]
  statusFilter: Status | 'all'
  typeFilter: TaskType | 'all'
  ownerFilter: string
  onStatus: (s: Status | 'all') => void
  onType: (t: TaskType | 'all') => void
  onOwner: (o: string) => void
  showing: number
  total: number
}) {
  const statuses: Status[] = ['NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'BLOCKED', 'COMPLETE']
  const types: TaskType[] = ['PHY', 'DIG', 'DOC', 'HYB']

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <FilterSelect label="Status" value={statusFilter} onChange={(v) => onStatus(v as Status | 'all')}>
        <option value="all">All</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Type" value={typeFilter} onChange={(v) => onType(v as TaskType | 'all')}>
        <option value="all">All</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label="Owner" value={ownerFilter} onChange={onOwner}>
        <option value="all">All</option>
        {owners.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </FilterSelect>
      <span className="ml-auto self-center font-mono text-[11px] text-slate-500 dark:text-slate-500">
        {showing === total ? `${total} tasks` : `${showing} of ${total} tasks`}
      </span>
    </div>
  )
}

function FilterSelect({
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
      <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</span>
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

/**
 * `/task/<id>` — resolve the owning package from the ID's ancestry and render L2
 * with the row focused. Single-task focus with full chain highlighting is
 * phase 7; this is only the deep-link landing.
 */
export function TaskView() {
  const { taskId = '' } = useParams()
  const index = useIndex()
  const task = index.tasks.get(taskId)
  if (task === undefined) {
    return <MissingNode kind="task" id={taskId} />
  }
  return <PackageView packageId={task.package} focusTaskId={taskId} />
}
