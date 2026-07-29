#!/usr/bin/env tsx
/**
 * `npm run generate` — program.yaml → public/program.json + content/**
 *
 * The one direction information flows. Nothing here reads a generated file,
 * and nothing parses markdown for structure; `narrative/` partials are prose
 * and are spliced in verbatim (D10).
 *
 * Validation runs first and the whole thing fails on any violation or cycle.
 * Nothing is written from a program model that does not validate.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { ProgramValidationError, validateProgramYaml } from '../schema/validate.js'
import { computeProgramGraph, DependencyCycleError } from '../graph/index.js'
import { isGenerated } from './render/markdown.js'
import { loadNarrative, OrphanNarrativeError } from './render/narrative.js'
import { renderJson } from './render/json.js'
import { renderL0 } from './render/l0.js'
import { renderL1 } from './render/l1.js'
import { renderL2 } from './render/l2.js'
import { renderConventions } from './render/conventions.js'
import {
  renderDependencyRegister,
  renderGateRegister,
  renderParallelizationRegister,
} from './render/registers.js'

const ROOT = process.cwd()
const SOURCE = resolve(ROOT, 'program.yaml')
const CONTENT = resolve(ROOT, 'content')
const NARRATIVE = resolve(ROOT, 'narrative')
const PUBLIC = resolve(ROOT, 'public')

const show = (path: string) => relative(ROOT, path).replace(/\\/g, '/')

/**
 * Remove previously generated markdown so a deleted milestone does not leave
 * its page behind.
 *
 * Only files carrying the generated marker are removed. Anything else in
 * content/ is left alone and reported — it should not be there, but deleting a
 * file this generator did not write is not a decision a build step gets to make.
 */
function clean(directory: string): string[] {
  const strays: string[] = []
  if (!existsSafe(directory)) return strays

  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry)
    if (statSync(full).isDirectory()) {
      strays.push(...clean(full))
      continue
    }
    if (!entry.endsWith('.md')) {
      strays.push(full)
      continue
    }
    if (isGenerated(readFileSync(full, 'utf8'))) rmSync(full)
    else strays.push(full)
  }

  return strays
}

function existsSafe(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch {
    return false
  }
}

function write(path: string, contents: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true })
  writeFileSync(path, contents, 'utf8')
}

function main(): number {
  let text: string
  try {
    text = readFileSync(SOURCE, 'utf8')
  } catch {
    console.error(`program.yaml not found at ${show(SOURCE)}.`)
    return 1
  }

  let graph
  try {
    const program = validateProgramYaml(text, 'program.yaml')
    graph = computeProgramGraph(program)
  } catch (error) {
    if (error instanceof ProgramValidationError) {
      console.error(error.message)
      return 1
    }
    if (error instanceof DependencyCycleError) {
      console.error(`program.yaml — ${error.message}\n\nNothing was generated.`)
      return 1
    }
    throw error
  }

  // Every slug a narrative partial is allowed to name.
  const slugs = [
    'program',
    'conventions',
    'registers/gates',
    'registers/dependencies',
    'registers/parallelization',
    ...graph.program.milestones.map((m) => m.id),
    ...graph.program.milestones.map((m) => `${m.id}-tasks`),
    ...graph.program.packages.map((p) => p.id),
  ]

  const narrative = loadNarrative(NARRATIVE, slugs)
  if (narrative.orphans.length > 0) {
    console.error(new OrphanNarrativeError(narrative.orphans, NARRATIVE).message)
    console.error('\nNothing was generated.')
    return 1
  }

  const strays = clean(CONTENT)

  const files: [string, string][] = [
    [join(CONTENT, 'L0-program.md'), renderL0(graph, narrative)],
    [join(CONTENT, 'conventions.md'), renderConventions(graph, narrative)],
    [join(CONTENT, 'registers/gates.md'), renderGateRegister(graph, narrative)],
    [join(CONTENT, 'registers/dependencies.md'), renderDependencyRegister(graph, narrative)],
    [
      join(CONTENT, 'registers/parallelization.md'),
      renderParallelizationRegister(graph, narrative),
    ],
  ]

  for (const milestone of graph.program.milestones) {
    files.push([
      join(CONTENT, 'L1-milestones', `${milestone.id}.md`),
      renderL1(milestone, graph, narrative),
    ])
    files.push([
      join(CONTENT, 'L2-tasks', `${milestone.id}-tasks.md`),
      renderL2(milestone, graph, narrative),
    ])
  }

  files.push([join(PUBLIC, 'program.json'), renderJson(graph)])

  for (const [path, contents] of files) write(path, contents)

  console.log(`Generated ${files.length} files from program.yaml`)
  console.log(
    `  ${graph.program.milestones.length} milestones · ${graph.program.packages.length} packages · ` +
      `${graph.program.tasks.length} tasks`,
  )
  console.log(
    `  ${narrative.partials.size} narrative ${narrative.partials.size === 1 ? 'partial' : 'partials'} included`,
  )

  if (strays.length > 0) {
    console.warn(
      `\n${strays.length} file(s) in content/ were not written by this generator and were left alone:`,
    )
    for (const stray of strays) console.warn(`  ${show(stray)}`)
    console.warn('content/ is generated output — hand-edited files there will not survive review.')
  }

  return 0
}

process.exit(main())
