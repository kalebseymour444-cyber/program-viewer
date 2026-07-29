/**
 * L0 — the program view.
 *
 * Milestone table with status, approver, gates, rolled-up dependencies,
 * duration, float. Every column except name and approver is derived.
 */

import { Link } from 'react-router-dom'
import { GateCount, Id, Role, StatusBadge } from '../components/Badges.js'
import { useScenario } from '../components/Layout.js'
import { Days, Td, Th } from '../components/ui.js'
import { useProgram } from '../lib/program.js'

export function ProgramView() {
  const program = useProgram()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]

  const criticalMilestones = new Set(data.criticalTasks.map((id) => id.split('.')[0]!))

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap gap-x-10 gap-y-3">
        <Figure label="Milestones" value={String(program.milestones.length)} />
        <Figure label="Packages" value={String(program.packages.length)} />
        <Figure label="Tasks" value={String(program.tasks.length)} />
        <Figure
          label="Gates"
          value={String(program.tasks.filter((t) => t.gate).length)}
          accent="text-amber-700 dark:text-amber-300"
        />
        <Figure
          label={`Duration (${scenario})`}
          value={`${data.projectDuration}d`}
          accent="text-slate-900 dark:text-slate-100"
        />
        <Figure
          label="Zero float"
          value={`${data.criticalTasks.length} tasks`}
          accent="text-red-600 dark:text-red-300"
        />
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">Milestones</h2>
        <div className="overflow-x-auto rounded-sm border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60">
                <Th>ID</Th>
                <Th>Milestone</Th>
                <Th>Status</Th>
                <Th>Approver</Th>
                <Th>Gates</Th>
                <Th>Depends on</Th>
                <Th className="text-right">Start</Th>
                <Th className="text-right">Finish</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Float</Th>
              </tr>
            </thead>
            <tbody>
              {program.milestones.map((milestone) => {
                const scheduled = data.milestones[milestone.id]!
                const onCriticalPath = criticalMilestones.has(milestone.id)

                return (
                  <tr
                    key={milestone.id}
                    className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-900/40"
                  >
                    <Td>
                      <Link
                        to={`/milestone/${milestone.id}`}
                        className="hover:underline underline-offset-2"
                      >
                        <Id>{milestone.id}</Id>
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-slate-900 dark:text-slate-200">{milestone.name}</span>
                      {onCriticalPath && (
                        <span
                          className="ml-2 font-mono text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400"
                          title="Contains tasks with zero float in this scenario"
                        >
                          critical
                        </span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={milestone.status} />
                    </Td>
                    <Td>
                      <Role id={milestone.approver} />
                    </Td>
                    <Td>
                      <GateCount count={milestone.gateCount} />
                    </Td>
                    <Td>
                      {milestone.dependsOn.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {milestone.dependsOn.map((id) => (
                            <Link
                              key={id}
                              to={`/milestone/${id}`}
                              className="font-mono text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              {id}
                            </Link>
                          ))}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right text-slate-500 dark:text-slate-500">
                      <Days value={scheduled.earliestStart} />
                    </Td>
                    <Td className="text-right text-slate-500 dark:text-slate-500">
                      <Days value={scheduled.earliestFinish} />
                    </Td>
                    <Td className="text-right text-slate-900 dark:text-slate-200">
                      <Days value={scheduled.duration} />
                    </Td>
                    <Td className="text-right">
                      <span className={scheduled.float === 0 ? 'text-red-600 dark:text-red-300' : 'text-slate-500'}>
                        <Days value={scheduled.float} />
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-600">
          Day offsets from the earliest possible start, not calendar dates. Duration is a span — the
          milestone&rsquo;s earliest start to its latest finish — not the sum of its tasks. Float is
          the tightest slack among its tasks.
        </p>
      </section>

      <CriticalPath />
    </div>
  )
}

function CriticalPath() {
  const program = useProgram()
  const { scenario } = useScenario()
  const data = program.scenarios[scenario]
  const other = scenario === 'pessimistic' ? 'optimistic' : 'pessimistic'
  const otherData = program.scenarios[other]

  const byMilestone = [...new Set(data.criticalChain.map((id) => id.split('.')[0]!))]
  const otherByMilestone = [...new Set(otherData.criticalChain.map((id) => id.split('.')[0]!))]
  const pathDiffers = byMilestone.join() !== otherByMilestone.join()

  return (
    <section>
      <h2 className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Critical path — {scenario}
      </h2>
      <div className="rounded-sm border border-slate-200 p-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1 font-mono text-sm">
          {byMilestone.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-400 dark:text-slate-600">→</span>}
              <Link to={`/milestone/${id}`} className="text-red-600 hover:underline dark:text-red-300">
                {id}
              </Link>
            </span>
          ))}
          <span className="ml-3 text-slate-500 dark:text-slate-500">
            {data.projectDuration}d · {data.criticalChain.length} tasks
          </span>
        </div>

        {pathDiffers && (
          <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] text-amber-700 dark:border-slate-800 dark:text-amber-300/80">
            Under {other} durations the critical path is a{' '}
            <strong className="font-semibold">different path</strong> —{' '}
            <span className="font-mono">{otherByMilestone.join(' → ')}</span> at{' '}
            {otherData.projectDuration}d. A lane with slack when everything runs short can become the
            binding one when things run long, so neither figure means anything without the label.
          </p>
        )}
      </div>
    </section>
  )
}

function Figure({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${accent ?? 'text-slate-700 dark:text-slate-300'}`}>{value}</div>
    </div>
  )
}

