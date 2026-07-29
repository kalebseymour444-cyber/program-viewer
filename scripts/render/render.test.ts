import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { makeProgram } from '../../graph/__fixtures__/make.js'
import { computeProgramGraph } from '../../graph/index.js'
import {
  formatDuration,
  formatStatusWithAging,
  gateBadge,
  gateCell,
  isGenerated,
  table,
  GENERATED_HEADER,
} from './markdown.js'
import { loadNarrative } from './narrative.js'
import { renderL0 } from './l0.js'
import { renderL1 } from './l1.js'
import { renderL2 } from './l2.js'
import { renderConventions } from './conventions.js'
import {
  renderDependencyRegister,
  renderGateRegister,
  renderParallelizationRegister,
} from './registers.js'
import { renderJson } from './json.js'

const EMPTY_NARRATIVE = { partials: new Map<string, string>(), orphans: [] }

const PROGRAM = makeProgram([
  { id: 'M1.1.1', duration: { min: 2, max: 5 } },
  { id: 'M1.1.2', duration: 3, predecessors: ['M1.1.1'], gate: true },
  { id: 'M1.2.1', duration: 4, predecessors: ['M1.1.1'] },
  { id: 'M2.1.1', duration: 1, predecessors: ['M1.1.2'] },
])
const GRAPH = computeProgramGraph(PROGRAM)

describe('markdown primitives', () => {
  it('formats a fixed duration, a range, and an absent one', () => {
    expect(formatDuration({ min: 3, max: 3 })).toBe('3d')
    expect(formatDuration({ min: 20, max: 90 })).toBe('20–90d')
    // Never "0d" — a continuous activity must not read as instantaneous (D4).
    expect(formatDuration(undefined)).toBe('—')
  })

  it('escapes pipes so a name cannot break out of a table cell', () => {
    const rendered = table(['A'], [['left | right']])
    expect(rendered).toContain('left \\| right')

    // Only the two delimiters are live pipes, so the row stays one cell.
    const row = rendered.split('\n')[2]!
    const unescaped = row.replace(/\\\|/g, '').match(/\|/g) ?? []
    expect(unescaped).toHaveLength(2)
  })

  it('renders an empty table as prose rather than an empty grid', () => {
    expect(table(['A', 'B'], [])).toBe('_None._')
  })

  it('shows a gate COUNT, never a bare marker', () => {
    // A marker true of every milestone says nothing (D8).
    expect(gateBadge(3)).toBe(' 🚨3')
    expect(gateBadge(0)).toBe('')
    expect(gateCell(3)).toBe('🚨 3')
    expect(gateCell(0)).toBe('—')
  })

  it('always shows aging for AT_RISK and BLOCKED', () => {
    expect(formatStatusWithAging('AT_RISK', '2026-06-30')).toContain('since 2026-06-30')
    expect(formatStatusWithAging('BLOCKED', '2026-06-30')).toContain('since 2026-06-30')
  })

  it('says so loudly when an aging status has no date', () => {
    expect(formatStatusWithAging('AT_RISK', undefined)).toContain('no date recorded')
  })

  it('does not clutter non-aging statuses with a date', () => {
    expect(formatStatusWithAging('IN_PROGRESS', '2026-06-30')).toBe('`IN_PROGRESS`')
  })

  it('recognises its own output', () => {
    expect(isGenerated(`${GENERATED_HEADER}\n\n# Anything`)).toBe(true)
    expect(isGenerated('# Hand written')).toBe(false)
  })
})

const PAGES: [string, () => string][] = [
  ['L0', () => renderL0(GRAPH, EMPTY_NARRATIVE)],
  ['L1', () => renderL1(PROGRAM.milestones[0]!, GRAPH, EMPTY_NARRATIVE)],
  ['L2', () => renderL2(PROGRAM.milestones[0]!, GRAPH, EMPTY_NARRATIVE)],
  ['conventions', () => renderConventions(GRAPH, EMPTY_NARRATIVE)],
  ['gates', () => renderGateRegister(GRAPH, EMPTY_NARRATIVE)],
  ['dependencies', () => renderDependencyRegister(GRAPH, EMPTY_NARRATIVE)],
  ['parallelization', () => renderParallelizationRegister(GRAPH, EMPTY_NARRATIVE)],
]

describe('every generated page', () => {
  it.each(PAGES)('%s carries the do-not-edit header', (_name, render) => {
    expect(render().startsWith(GENERATED_HEADER)).toBe(true)
  })

  it.each(PAGES)('%s is byte-identical when rendered twice', (_name, render) => {
    expect(render()).toBe(render())
  })

  it.each(PAGES)('%s contains no build timestamp', (_name, render) => {
    // A generation stamp would make every regeneration a diff and bury real
    // status changes in noise, breaking review-as-pull-request (SPEC §7).
    const output = render()
    expect(output).not.toMatch(/\b20\d{2}-\d{2}-\d{2}T/) // ISO datetime
    expect(output).not.toMatch(/[Gg]enerated (at|on)\b/)
  })

  it.each(PAGES)('%s uses relative links only, for GitHub and Obsidian', (_name, render) => {
    const links = [...render().matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!)
    for (const href of links) {
      expect(href).not.toMatch(/^https?:\/\//)
      expect(href).not.toMatch(/^\//)
    }
  })

  it.each(PAGES)('%s uses no wiki links, which GitHub would not resolve', (_name, render) => {
    expect(render()).not.toMatch(/\[\[/)
  })
})

describe('exit criteria are derived from gates (D11)', () => {
  const page = renderL1(PROGRAM.milestones[0]!, GRAPH, EMPTY_NARRATIVE)

  it('lists the gate task with its criterion and evidence', () => {
    expect(page).toContain('Exit criteria')
    expect(page).toContain('M1.1.2')
    expect(page).toContain('Criterion for M1.1.2')
    expect(page).toContain('Evidence for M1.1.2')
  })

  it('shows what the gate blocks, derived from successors', () => {
    const exitSection = page.slice(page.indexOf('## Exit criteria'))
    expect(exitSection).toContain('M2.1.1')
  })

  it('says so plainly when a milestone has no gates', () => {
    const gateless = computeProgramGraph(makeProgram([{ id: 'M1.1.1', duration: 1 }]))
    const rendered = renderL1(gateless.program.milestones[0]!, gateless, EMPTY_NARRATIVE)
    expect(rendered).toContain('no gate tasks')
  })
})

describe('narrative partials (D10)', () => {
  function withNarrative(files: Record<string, string>) {
    const root = mkdtempSync(join(tmpdir(), 'narrative-'))
    for (const [slug, body] of Object.entries(files)) {
      const path = join(root, `${slug}.md`)
      mkdirSync(join(path, '..'), { recursive: true })
      writeFileSync(path, body, 'utf8')
    }
    return root
  }

  it('includes prose verbatim, without parsing it', () => {
    const root = withNarrative({ M1: 'Handover is an *event* to a GC.\n\n| not | a table |' })
    const narrative = loadNarrative(root, ['M1'])
    const page = renderL1(PROGRAM.milestones[0]!, GRAPH, narrative)

    expect(page).toContain('Handover is an *event* to a GC.')
    expect(page).toContain('| not | a table |')
    rmSync(root, { recursive: true })
  })

  it('treats a partial naming nothing in the program as an orphan', () => {
    const root = withNarrative({ M1: 'kept', M9: 'orphan' })
    const narrative = loadNarrative(root, ['M1'])

    expect(narrative.orphans).toEqual(['M9'])
    expect(narrative.partials.has('M1')).toBe(true)
    rmSync(root, { recursive: true })
  })

  it('reads partials in subdirectories', () => {
    const root = withNarrative({ 'registers/gates': 'gate commentary' })
    const narrative = loadNarrative(root, ['registers/gates'])
    expect(narrative.partials.get('registers/gates')).toBe('gate commentary')
    rmSync(root, { recursive: true })
  })

  it('ignores an empty partial rather than emitting a blank section', () => {
    const root = withNarrative({ M1: '   \n\n  ' })
    expect(loadNarrative(root, ['M1']).partials.size).toBe(0)
    rmSync(root, { recursive: true })
  })

  it('ignores README.md, so the directory can document itself', () => {
    const root = withNarrative({ README: 'how to write these' })
    expect(loadNarrative(root, []).orphans).toEqual([])
    rmSync(root, { recursive: true })
  })

  it('copes with no narrative directory at all', () => {
    const narrative = loadNarrative(join(tmpdir(), 'does-not-exist-at-all'), ['M1'])
    expect(narrative.partials.size).toBe(0)
    expect(narrative.orphans).toEqual([])
  })
})

describe('program.json', () => {
  const json = JSON.parse(renderJson(GRAPH))

  it('carries both scenarios', () => {
    expect(json.scenarios.optimistic.projectDuration).toBeLessThanOrEqual(
      json.scenarios.pessimistic.projectDuration,
    )
  })

  it('merges derived rollups into the authored entities', () => {
    const milestone = json.milestones.find((m: { id: string }) => m.id === 'M1')
    expect(milestone.approver).toBe('R1') // authored
    expect(milestone.gateCount).toBe(1) // derived
    expect(milestone.feeds).toEqual(['M2']) // derived
  })

  it('includes successors on tasks, so the app need not invert the edges', () => {
    const task = json.tasks.find((t: { id: string }) => t.id === 'M1.1.1')
    expect(task.successors).toEqual(['M1.1.2', 'M1.2.1'])
  })

  it('ships adjacency for chain highlighting', () => {
    expect(json.adjacency.predecessors['M1.1.2']).toEqual(['M1.1.1'])
    expect(json.adjacency.successors['M1.1.1']).toEqual(['M1.1.2', 'M1.2.1'])
  })

  it('is byte-identical across runs, with stable key order', () => {
    expect(renderJson(GRAPH)).toBe(renderJson(computeProgramGraph(PROGRAM)))
  })

  it('contains no build timestamp', () => {
    expect(renderJson(GRAPH)).not.toMatch(/\b20\d{2}-\d{2}-\d{2}T/)
  })
})
