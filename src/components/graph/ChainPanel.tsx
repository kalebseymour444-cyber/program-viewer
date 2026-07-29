/**
 * The chain, in words, beside the graph.
 *
 * SPEC §5: selecting a node lists its complete upstream and downstream chains
 * with the longest-reach dependency called out — "a dependency introduced eight
 * months earlier that only surfaces at final validation." The reach is measured
 * in days (`spanDays`), which is the whole point: depth in edges hides how far
 * apart in time two coupled tasks actually sit.
 */

import { Link } from 'react-router-dom'
import { Id, StatusBadge } from '../Badges.js'
import { useIndex } from '../../lib/program.js'
import type { ChainNode, Closure } from '../../lib/graph.js'

export function ChainPanel({ closure, onSelect }: { closure: Closure; onSelect: (id: string) => void }) {
  const index = useIndex()
  const selected = index.tasks.get(closure.id)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <header>
        <div className="flex items-center gap-2">
          <Id>{closure.id}</Id>
          <Link to={`/task/${closure.id}`} className="text-[11px] text-cyan-700 hover:underline dark:text-cyan-300">
            open ↗
          </Link>
        </div>
        {selected !== undefined && (
          <>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{selected.name}</p>
            <div className="mt-1">
              <StatusBadge status={selected.status} since={selected.status_since} />
            </div>
          </>
        )}
      </header>

      <Callout label="Longest upstream reach" node={closure.longestUpstream} />
      <Callout label="Longest downstream reach" node={closure.longestDownstream} />

      <ChainList
        title="Upstream"
        subtitle="everything this waits on"
        nodes={closure.upstream}
        onSelect={onSelect}
      />
      <ChainList
        title="Downstream"
        subtitle="everything waiting on this"
        nodes={closure.downstream}
        onSelect={onSelect}
      />
    </div>
  )
}

function Callout({ label, node }: { label: string; node: ChainNode | undefined }) {
  const index = useIndex()
  if (node === undefined) return null
  const task = index.tasks.get(node.id)

  return (
    <div className="rounded-sm border border-amber-300 bg-amber-50/60 p-2 dark:border-amber-500/40 dark:bg-amber-500/5">
      <div className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <Id>{node.id}</Id>
        {node.spanDays !== undefined && (
          <span className="font-mono text-xs text-amber-800 dark:text-amber-300" title="Reach in days, start to start">
            {node.spanDays}d apart
          </span>
        )}
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-500">·{node.depth} hops</span>
      </div>
      {task !== undefined && (
        <div className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">{task.name}</div>
      )}
    </div>
  )
}

function ChainList({
  title,
  subtitle,
  nodes,
  onSelect,
}: {
  title: string
  subtitle: string
  nodes: readonly ChainNode[]
  onSelect: (id: string) => void
}) {
  const index = useIndex()

  return (
    <section>
      <h3 className="flex items-baseline gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
        {title}
        <span className="font-mono text-[10px] normal-case tracking-normal text-slate-400 dark:text-slate-600">
          {nodes.length} · {subtitle}
        </span>
      </h3>
      {nodes.length === 0 ? (
        <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-600">none</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {nodes.map((node) => {
            const task = index.tasks.get(node.id)
            return (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => onSelect(node.id)}
                  className="flex w-full items-baseline gap-2 rounded-sm px-1 py-0.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{node.id}</span>
                  {node.spanDays !== undefined && (
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600">{node.spanDays}d</span>
                  )}
                  <span className="truncate text-[11px] text-slate-500 dark:text-slate-500">{task?.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
