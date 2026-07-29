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

describe('the edges added to resolve Q10 and Q11', () => {
  // These pinned the DEFECTS while Q10-Q12 were open, and failed the moment the
  // edges were added — which was the intended signal. They now pin the fix.

  it('M4 depends on M1: design freeze feeds containment, busway and CDU (Q10)', () => {
    expect(graph.milestones.get('M4')!.dependsOn).toContain('M1')

    expect(graph.adjacency.predecessors.get('M4.1.3')).toContain('M1.1.2') // floor plan
    expect(graph.adjacency.predecessors.get('M4.2.1')).toContain('M1.1.3') // power layout
    expect(graph.adjacency.predecessors.get('M4.3.1')).toContain('M1.1.4') // fluid layout
  })

  it('M7 depends on M2: provisioning cannot pull an image over a console path (Q11)', () => {
    expect(graph.milestones.get('M7')!.dependsOn).toContain('M2')
    expect(graph.adjacency.predecessors.get('M7.7.1')).toContain('M2.8.4')
  })

  it('M5 still depends on M2, through OOB reachability (Q12)', () => {
    expect(graph.milestones.get('M5')!.dependsOn).toContain('M2')
  })

  it('the programme no longer finishes before the WAN is accepted', () => {
    // The defect Q11 produced: with M2 dangling, the model said clusters went
    // live 48 days BEFORE WAN acceptance. M8 must now be the terminal.
    const m2 = graph.pessimistic.milestones.get('M2')!
    const m8 = graph.pessimistic.milestones.get('M8')!

    expect(m8.earliestFinish).toBeGreaterThanOrEqual(m2.earliestFinish)
    expect(m8.earliestFinish).toBe(graph.pessimistic.schedule.projectDuration)
  })

  it('reproduces the critical path L0 always claimed: M1 → M2 → M7 → M8', () => {
    const milestones = [
      ...new Set(graph.pessimistic.schedule.criticalChain.map((id) => id.split('.')[0]!)),
    ]
    expect(milestones).toEqual(['M1', 'M2', 'M7', 'M8'])
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
