/**
 * The browser's chain computation must be the tested one.
 *
 * These assert that reconstructing the Map-shaped inputs from program.json and
 * feeding them to `closureOf` yields a correct transitive closure — the property
 * the whole select-a-node feature stands on. If the reconstruction dropped or
 * mis-wired an edge, the closure would silently under-report reach, which is the
 * one failure mode SPEC §5 exists to prevent.
 */

import { describe, expect, it } from 'vitest'
import realProgram from '../../public/program.json'
import { closureOf } from '../../graph/closure.js'
import { layout } from '../components/graph/layout.js'
import { graphInputs } from './graph.js'
import type { ProgramDocument } from './program.js'

const program = realProgram as unknown as ProgramDocument
const { adjacency, schedules } = graphInputs(program)

describe('graphInputs reconstructs the adjacency faithfully', () => {
  it('has an entry for every task, with the same predecessor set', () => {
    // The shipped adjacency is sorted; the authored `predecessors` keeps
    // authoring order. Same set either way — compare order-independently.
    expect(adjacency.predecessors.size).toBe(program.tasks.length)
    for (const task of program.tasks) {
      expect([...(adjacency.predecessors.get(task.id) ?? [])].sort()).toEqual(
        [...task.predecessors].sort(),
      )
    }
  })
})

describe('closureOf over the reconstructed graph is transitively closed', () => {
  // A mid-graph task with dependencies in both directions.
  const anchor = program.tasks.find(
    (t) => t.predecessors.length > 0 && t.successors.length > 0,
  )!

  it('includes every direct predecessor in the upstream chain', () => {
    const closure = closureOf(adjacency, anchor.id, schedules.pessimistic)
    const upstream = new Set(closure.upstream.map((n) => n.id))
    for (const pred of anchor.predecessors) expect(upstream.has(pred)).toBe(true)
  })

  it('is closed: every upstream node brings its own predecessors', () => {
    const closure = closureOf(adjacency, anchor.id, schedules.pessimistic)
    const upstream = new Set(closure.upstream.map((n) => n.id))
    for (const id of upstream) {
      for (const pred of adjacency.predecessors.get(id) ?? []) {
        expect(upstream.has(pred)).toBe(true)
      }
    }
  })

  it('picks the greatest-reach node as the longest callout', () => {
    const closure = closureOf(adjacency, anchor.id, schedules.pessimistic)
    if (closure.longestUpstream?.spanDays !== undefined) {
      const maxSpan = Math.max(...closure.upstream.map((n) => n.spanDays ?? 0))
      expect(closure.longestUpstream.spanDays).toBe(maxSpan)
    }
  })
})

describe('layout', () => {
  it('positions every node it is given', () => {
    const ids = program.tasks.slice(0, 12).map((t) => t.id)
    const edges = program.tasks
      .slice(0, 12)
      .flatMap((t) => t.predecessors.map((from) => ({ from, to: t.id })))
    const { positions } = layout(ids, edges)
    for (const id of ids) expect(positions.has(id)).toBe(true)
  })

  it('is deterministic for the same input', () => {
    const ids = program.tasks.slice(0, 8).map((t) => t.id)
    const a = layout(ids, [])
    const b = layout(ids, [])
    for (const id of ids) expect(a.positions.get(id)).toEqual(b.positions.get(id))
  })
})
