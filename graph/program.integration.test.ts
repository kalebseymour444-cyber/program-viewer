/**
 * The graph layer against the actual imported programme.
 *
 * The unit tests prove the algorithms on graphs whose answers are known by
 * hand. This proves they survive 204 real tasks — and pins a few facts about
 * the data itself, so that if a future edit to program.yaml changes the shape
 * of the programme, it changes here first rather than silently in a rendered
 * view.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateProgramYaml } from '../schema/validate.js'
import { computeProgramGraph } from './index.js'

const PROGRAM = fileURLToPath(new URL('../program.yaml', import.meta.url))
const program = validateProgramYaml(readFileSync(PROGRAM, 'utf8'), 'program.yaml')
const graph = computeProgramGraph(program)

describe('the real programme', () => {
  it('has no dependency cycle', () => {
    // computeProgramGraph throws on a cycle, so reaching here proves it.
    expect(graph.order).toHaveLength(program.tasks.length)
  })

  it('orders all 204 tasks', () => {
    expect(program.tasks).toHaveLength(204)
    expect(new Set(graph.order).size).toBe(204)
  })

  it('places every task after its predecessors', () => {
    const position = new Map(graph.order.map((id, i) => [id, i]))
    for (const task of program.tasks) {
      for (const pred of task.predecessors) {
        expect(position.get(pred)!).toBeLessThan(position.get(task.id)!)
      }
    }
  })

  it('rolls up 8 milestones and 58 packages', () => {
    expect(graph.milestones.size).toBe(8)
    expect(graph.packages.size).toBe(58)
  })
})

describe('what the rollup says about the legacy assertions', () => {
  // These pin Q10-Q12 as facts about the current data. When someone decides to
  // add the missing edges, these tests fail — which is the intended signal,
  // not a regression.

  it('M4 is a root: it depends on nothing, despite L0 asserting M1', () => {
    expect(graph.milestones.get('M4')!.dependsOn).toEqual([])
  })

  it('M7 does not depend on M2 directly, despite L0 asserting it', () => {
    expect(graph.milestones.get('M7')!.dependsOn).not.toContain('M2')
  })

  it('M5 depends on M2, which L0 does not state', () => {
    expect(graph.milestones.get('M5')!.dependsOn).toContain('M2')
  })

  it('M2 reaches M7 only through M5', () => {
    const upstreamOfM7 = new Set(
      graph.milestones.get('M7')!.taskIds.flatMap((id) => graph.closure(id).upstream.map((n) => n.id)),
    )
    // There IS a path from M2 to M7 — it is just not a direct milestone edge.
    expect([...upstreamOfM7].some((id) => id.startsWith('M2.'))).toBe(true)
  })
})

describe('scenarios', () => {
  it('never reports a shorter pessimistic schedule', () => {
    expect(graph.pessimistic.schedule.projectDuration).toBeGreaterThanOrEqual(
      graph.optimistic.schedule.projectDuration,
    )
  })

  it('produces a contiguous critical chain in both scenarios', () => {
    for (const scenario of [graph.optimistic, graph.pessimistic]) {
      const chain = scenario.schedule.criticalChain
      expect(chain.length).toBeGreaterThan(0)

      for (let i = 1; i < chain.length; i++) {
        const previous = scenario.schedule.tasks.get(chain[i - 1]!)!
        const current = scenario.schedule.tasks.get(chain[i]!)!
        expect(current.earliestStart).toBe(previous.earliestFinish)
        expect(current.float).toBe(0)
      }
    }
  })

  it('marks every critical task with zero float and no others', () => {
    for (const scenario of [graph.optimistic, graph.pessimistic]) {
      for (const [id, task] of scenario.schedule.tasks) {
        expect(task.critical).toBe(task.float === 0)
        expect(scenario.schedule.criticalTasks.includes(id)).toBe(task.float === 0)
      }
    }
  })

  it('keeps every rollup span within its scenario schedule', () => {
    for (const scenario of [graph.optimistic, graph.pessimistic]) {
      for (const [, rollup] of scenario.milestones) {
        expect(rollup.earliestFinish).toBeLessThanOrEqual(scenario.schedule.projectDuration)
        expect(rollup.duration).toBe(rollup.earliestFinish - rollup.earliestStart)
      }
    }
  })
})

describe('determinism', () => {
  it('computes byte-identical results on a second run', () => {
    const again = computeProgramGraph(program)
    expect(again.order).toEqual(graph.order)
    expect(again.pessimistic.schedule.criticalTasks).toEqual(
      graph.pessimistic.schedule.criticalTasks,
    )
    expect(again.pessimistic.schedule.criticalChain).toEqual(
      graph.pessimistic.schedule.criticalChain,
    )
    expect([...again.milestones.entries()]).toEqual([...graph.milestones.entries()])
  })
})

describe('gates and cross-milestone reach', () => {
  it('counts 34 gate tasks across the programme', () => {
    const gates = [...graph.milestones.values()].reduce((n, m) => n + m.gateCount, 0)
    expect(gates).toBe(34)
  })

  it('finds cross-milestone edges and sorts them by reach', () => {
    const edges = graph.pessimistic.crossMilestoneEdges
    expect(edges.length).toBeGreaterThan(0)
    for (let i = 1; i < edges.length; i++) {
      expect(edges[i - 1]!.spanDays!).toBeGreaterThanOrEqual(edges[i]!.spanDays!)
    }
  })
})
