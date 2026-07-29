/**
 * Loading hand-written prose partials from `narrative/` (decision D10).
 *
 * These are the ONLY hand-edited inputs besides program.yaml, and they are
 * included VERBATIM. Nothing here parses them, looks for tables in them, or
 * extracts structure from them — they carry commentary and nothing else, which
 * is what keeps SPEC §2 intact.
 *
 * The rule a partial must obey, restated because it is the whole basis of the
 * arrangement: NO STRUCTURAL CLAIMS. No durations, no dependency assertions,
 * no counts. "Handover is an event to a GC and an interval to deployment" is
 * safe forever; "five lanes converge here" is a fact about the graph that will
 * silently stop being true.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export interface Narrative {
  /** Entity ID or register name → prose, verbatim. */
  readonly partials: ReadonlyMap<string, string>
  /** Partials found on disk that name nothing in the program. */
  readonly orphans: readonly string[]
}

/** Every `.md` under `root`, as slugs relative to it: `M4`, `registers/gates`. */
function walk(root: string, prefix = ''): string[] {
  if (!existsSync(root)) return []
  const found: string[] = []

  for (const entry of readdirSync(root).sort()) {
    const full = join(root, entry)
    if (statSync(full).isDirectory()) {
      found.push(...walk(full, `${prefix}${entry}/`))
    } else if (entry.endsWith('.md') && entry !== 'README.md') {
      found.push(`${prefix}${entry.slice(0, -3)}`)
    }
  }

  return found
}

/**
 * @param knownSlugs every slug a partial is allowed to name — entity IDs plus
 * `program` and `registers/*`. A partial naming anything else is an orphan:
 * either a typo or prose left behind by a deleted milestone, and both are
 * build errors. Silently ignoring it would mean commentary that nobody can
 * find and nobody knows is dead.
 */
export function loadNarrative(root: string, knownSlugs: readonly string[]): Narrative {
  const allowed = new Set(knownSlugs)
  const partials = new Map<string, string>()
  const orphans: string[] = []

  for (const slug of walk(root)) {
    if (!allowed.has(slug)) {
      orphans.push(slug)
      continue
    }
    const text = readFileSync(join(root, `${slug}.md`), 'utf8').trim()
    if (text !== '') partials.set(slug, text)
  }

  return { partials, orphans }
}

export class OrphanNarrativeError extends Error {
  constructor(orphans: readonly string[], root: string) {
    super(
      `${orphans.length} narrative ${orphans.length === 1 ? 'partial names' : 'partials name'} ` +
        `nothing in program.yaml:\n\n` +
        orphans.map((slug) => `  ${relative(process.cwd(), join(root, `${slug}.md`))}`).join('\n') +
        `\n\nEither the ID is misspelled, or the entity it described was removed and this\n` +
        `commentary is now orphaned. Prose that documents nothing is worse than no prose:\n` +
        `it still reads as current.`,
    )
    this.name = 'OrphanNarrativeError'
  }
}
