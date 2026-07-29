/**
 * L1 — a single milestone.
 *
 * Its work packages with rolled-up status and schedule, the packages it depends
 * on and feeds (derived from task edges, never authored), and the gate criteria
 * that sit beneath it. Click a package → L2.
 */

import { Link, useParams } from 'react-router-dom'
import { GateCount, Id, Role, StatusBadge } from '../components/Badges.js'
import { Breadcrumbs } from '../components/Breadcrumbs.js'
import { useScenario } from '../components/Layout.js'
import { Dash, Days, Td, Th } from '../components/ui.js'
import { MissingNode } from '../components/MissingNode.js'
import { useIndex, useProgram } from '../lib/program.js'

export function MilestoneView() {
  const { milestoneId = '' } = useParams()
  const program = useProgram()
  const index = useIndex()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]

  const milestone = index.milestones.get(milestoneId)
  if (milestone === undefined) {
    return <MissingNode kind="milestone" id={milestoneId} />
  }

  const scheduled = data.milestones[milestone.id]!
  const packages = milestone.childIds.map((id) => index.packages.get(id)!)

  return (
    <div className="space-y-8">
      <Breadcrumbs
        trail={[
          { label: 'Program', to: '/' },
          { label: milestone.id },
        ]}
      />

      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Id>{milestone.id}</Id>
          <h1 className="text-lg text-slate-900 dark:text-slate-100">{milestone.name}</h1>
          <StatusBadge status={milestone.status} />
          {scheduled.critical && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400"
              title="Contains tasks with zero float in this scenario"
            >
              critical
            </span>
          )}
        </div>

        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <Fact label="Approver">
            <Role id={milestone.approver} />
          </Fact>
          <Fact label="Gates">
            <GateCount count={milestone.gateCount} />
          </Fact>
          <Fact label={`Start (${scenario})`}>
            <Days value={scheduled.earliestStart} />
          </Fact>
          <Fact label={`Finish (${scenario})`}>
            <Days value={scheduled.earliestFinish} />
          </Fact>
          <Fact label="Duration">
            <Days value={scheduled.duration} />
          </Fact>
          <Fact label="Float">
            <span className={scheduled.float === 0 ? 'text-red-600 dark:text-red-300' : undefined}>
              <Days value={scheduled.float} />
            </span>
          </Fact>
        </dl>

        <PeerLinks label="Depends on" ids={milestone.dependsOn} />
        <PeerLinks label="Feeds" ids={milestone.feeds} />
      </header>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Work packages
        </h2>
        <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60">
                <Th>ID</Th>
                <Th>Package</Th>
                <Th>Status</Th>
                <Th>Owners</Th>
                <Th>Gates</Th>
                <Th>Depends on</Th>
                <Th className="text-right">Start</Th>
                <Th className="text-right">Finish</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Float</Th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const s = data.packages[pkg.id]!
                return (
                  <tr
                    key={pkg.id}
                    className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/40"
                  >
                    <Td>
                      <Link to={`/package/${pkg.id}`} className="hover:underline underline-offset-2">
                        <Id>{pkg.id}</Id>
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-slate-900 dark:text-slate-200">{pkg.name}</span>
                    </Td>
                    <Td>
                      <StatusBadge status={pkg.status} />
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {pkg.owners.map((id) => (
                          <Role key={id} id={id} />
                        ))}
                      </span>
                    </Td>
                    <Td>
                      <GateCount count={pkg.gateCount} />
                    </Td>
                    <Td>
                      {pkg.dependsOn.length === 0 ? (
                        <Dash />
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {pkg.dependsOn.map((id) => (
                            <Link
                              key={id}
                              to={`/package/${id}`}
                              className="font-mono text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {id}
                            </Link>
                          ))}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right text-slate-500 dark:text-slate-500">
                      <Days value={s.earliestStart} />
                    </Td>
                    <Td className="text-right text-slate-500 dark:text-slate-500">
                      <Days value={s.earliestFinish} />
                    </Td>
                    <Td className="text-right text-slate-900 dark:text-slate-200">
                      <Days value={s.duration} />
                    </Td>
                    <Td className="text-right">
                      <span className={s.float === 0 ? 'text-red-600 dark:text-red-300' : 'text-slate-500'}>
                        <Days value={s.float} />
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-600">
          Day offsets from the earliest possible start, not calendar dates. Package duration is a span,
          not the sum of its tasks. Float is the tightest slack among a package&rsquo;s tasks.
        </p>
      </section>

      <GateCriteria taskIds={milestone.gateTaskIds} />
    </div>
  )
}

function GateCriteria({ taskIds }: { taskIds: readonly string[] }) {
  const index = useIndex()
  if (taskIds.length === 0) return null
  const gates = taskIds.map((id) => index.tasks.get(id)!)

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">
          ◆
        </span>
        Gate criteria
      </h2>
      <ul className="space-y-2">
        {gates.map((task) => (
          <li
            key={task.id}
            className="rounded-sm border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/30 dark:bg-amber-500/5"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <Link to={`/task/${task.id}`} className="hover:underline underline-offset-2">
                <Id>{task.id}</Id>
              </Link>
              <span className="text-sm text-slate-800 dark:text-slate-200">{task.name}</span>
            </div>
            {task.criterion !== undefined && (
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-500">Criterion — </span>
                {task.criterion}
              </p>
            )}
            {task.evidence !== undefined && (
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-500 dark:text-slate-500">Evidence — </span>
                {task.evidence}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function PeerLinks({ label, ids }: { label: string; ids: readonly string[] }) {
  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</span>
      <span className="flex flex-wrap gap-1">
        {ids.map((id) => (
          <Link
            key={id}
            to={`/milestone/${id}`}
            className="font-mono text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {id}
          </Link>
        ))}
      </span>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm">{children}</dd>
    </div>
  )
}
