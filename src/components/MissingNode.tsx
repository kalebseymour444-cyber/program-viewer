/**
 * A deep link to an ID that no longer exists.
 *
 * IDs are permanent and never reused (CLAUDE.md), so a link that fails to
 * resolve means a genuinely retired node — worth stating plainly rather than
 * showing a blank page or silently redirecting to L0.
 */

import { Link } from 'react-router-dom'

export function MissingNode({ kind, id }: { kind: string; id: string }) {
  return (
    <div className="space-y-3 font-mono text-sm">
      <p className="text-slate-500 dark:text-slate-400">
        No {kind} <span className="text-slate-900 dark:text-slate-200">{id || '(none)'}</span> in this
        program.
      </p>
      <Link to="/" className="inline-block text-cyan-700 hover:underline dark:text-cyan-300">
        ← Program
      </Link>
    </div>
  )
}
