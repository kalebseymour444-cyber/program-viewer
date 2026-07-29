/**
 * Markdown rendering primitives.
 *
 * Two constraints shape everything here.
 *
 * PORTABILITY: output must render in GitHub AND in Obsidian (SPEC §9). That
 * means relative links, plain pipe tables, and mermaid fences. No GitHub-only
 * callout syntax and no wiki links. HTML is limited to the generated-file
 * marker and <details>, both of which render in either.
 *
 * DETERMINISM: no timestamps, no "generated at", nothing derived from the
 * clock. A build stamp would make every regeneration a diff and bury real
 * status changes in noise, which breaks review-as-pull-request (SPEC §7).
 */

import type { Duration, Status } from '../../schema/program.schema.js'

export const GENERATED_HEADER = '<!-- GENERATED — do not edit. Source: program.yaml -->'

/** True if a file was produced by this generator and may be safely replaced. */
export const isGenerated = (contents: string): boolean =>
  contents.trimStart().startsWith('<!-- GENERATED')

export function page(title: string, sections: (string | undefined)[]): string {
  const body = sections.filter((s): s is string => s !== undefined && s.trim() !== '').join('\n\n')
  return `${GENERATED_HEADER}\n\n# ${title}\n\n${body}\n`
}

/** Escape the characters that would break out of a table cell. */
function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()
}

export function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '_None._'
  const head = `| ${headers.map(cell).join(' | ')} |`
  const rule = `|${headers.map(() => '---').join('|')}|`
  const body = rows.map((row) => `| ${row.map(cell).join(' | ')} |`).join('\n')
  return `${head}\n${rule}\n${body}`
}

export function section(heading: string, body: string | undefined): string | undefined {
  if (body === undefined || body.trim() === '') return undefined
  return `## ${heading}\n\n${body}`
}

export function mermaid(lines: string[]): string {
  return ['```mermaid', ...lines, '```'].join('\n')
}

/**
 * Mermaid node IDs cannot contain dots, so `M4.3` becomes `M4_3`. The label
 * keeps the real ID — the reader must always see the ID they can search for.
 */
export const mermaidId = (id: string): string => id.replace(/[^A-Za-z0-9]/g, '_')

/** Quote a mermaid label so punctuation in a name cannot break the diagram. */
export const mermaidLabel = (text: string): string => `"${text.replace(/"/g, "'")}"`

/** `{min: 3, max: 3}` → `3d` · `{min: 20, max: 90}` → `20–90d` · absent → `—` */
export function formatDuration(duration: Duration | undefined): string {
  if (duration === undefined) return '—'
  return duration.min === duration.max ? `${duration.min}d` : `${duration.min}–${duration.max}d`
}

export const formatDays = (days: number): string => `${days}d`

export const formatStatus = (status: Status): string => `\`${status}\``

/**
 * Status with its aging, where aging applies.
 *
 * The date is shown rather than a day count, deliberately. Days-in-state
 * computed at generation time would change every single day and every file
 * would diff on every build. The app renders the live count from the same
 * field; here, the date IS the aging — it is visible and it cannot be hidden.
 */
export function formatStatusWithAging(status: Status, since: string | undefined): string {
  const base = formatStatus(status)
  if (status !== 'AT_RISK' && status !== 'BLOCKED') return base
  return since === undefined ? `${base} **(no date recorded)**` : `${base} since ${since}`
}

export const list = (items: string[]): string =>
  items.length === 0 ? '_None._' : items.map((i) => `- ${i}`).join('\n')

export const joinIds = (ids: readonly string[]): string =>
  ids.length === 0 ? '—' : ids.map((id) => `\`${id}\``).join(', ')

/** Inline code, for IDs. Monospace for IDs is a design requirement (SPEC §5). */
export const code = (text: string): string => `\`${text}\``

export const link = (text: string, href: string): string => `[${text}](${href})`

/** Gate marker. Gates must be visually unmistakable (SPEC §5). */
export const GATE = '🚨'

/**
 * Gate count for a rollup, as a diagram label suffix.
 *
 * The COUNT is shown, never a bare marker. Every milestone in this programme
 * contains at least one gate, so a plain 🚨 on each node would be true
 * everywhere and therefore say nothing — the "gates become decorative"
 * failure the gate register itself warns about (see D8).
 */
export const gateBadge = (count: number): string => (count > 0 ? ` ${GATE}${count}` : '')

/** Gate count for a table cell. */
export const gateCell = (count: number): string => (count === 0 ? '—' : `${GATE} ${count}`)
