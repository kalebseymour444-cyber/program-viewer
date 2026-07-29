/**
 * The drill-down trail: Program / M4 / M4.3.
 *
 * Every segment except the last is a link, so any level is one click back and
 * the current position is always legible. Deep links (SPEC §5) land mid-trail,
 * so this is reconstructed from the node's own ancestry, not from history.
 */

import { Link } from 'react-router-dom'

export interface Crumb {
  readonly label: string
  /** Omitted for the current (last) node, which is not a link. */
  readonly to?: string
}

export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
      {trail.map((crumb, i) => {
        const last = i === trail.length - 1
        return (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                /
              </span>
            )}
            {last || crumb.to === undefined ? (
              <span aria-current="page" className="text-slate-900 dark:text-slate-200">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
