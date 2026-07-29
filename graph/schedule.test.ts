import { describe, expect, it } from 'vitest'
import { makeProgram } from './__fixtures__/make.js'
import { buildAdjacency, topologicalOrder } from './build.js'
import { computeSchedule } from './schedule.js'
import type { Scenario } from './schedule.js'
import type { TaskSpec } from './__fixtures__/make.js'

function schedule(specs: TaskSpec[], scenario: Scenario = 'pessimistic') {
  const program = makeProgram(specs)
  const adjacency = buildAdjacency(program.tasks)
  const { order } = topologicalOrder(adjacency)
  return computeSchedule(program.tasks, adjacency, order, scenario)
}

describe('forward and backward pass', () => {
  // A(3) ─┬─ B(2) ─┬─ D(1)
  //       └─ C(4) ─┘
  const DIAMOND: TaskSpec[] = [
    { id: 'M1.1.1', duration: 3 },
    { id: 'M1.1.2', duration: 2, predecessors: ['M1.1.1'] },
    { id: 'M1.1.3', duration: 4, predecessors: ['M1.1.1'] },
    { id: 'M1.1.4', duration: 1, predecessors: ['M1.1.2', 'M1.1.3'] },
  ]

  it('computes earliest start and finish', () => {
    const s = schedule(DIAMOND)
    expect(s.tasks.get('M1.1.1')).toMatchObject({ earliestStart: 0, earliestFinish: 3 })
    expect(s.tasks.get('M1.1.2')).toMatchObject({ earliestStart: 3, earliestFinish: 5 })
    expect(s.tasks.get('M1.1.3')).toMatchObject({ earliestStart: 3, earliestFinish: 7 })
    // Waits for the LATER of its two predecessors, not the earlier.
    expect(s.tasks.get('M1.1.4')).toMatchObject({ earliestStart: 7, earliestFinish: 8 })
  })

  it('computes latest start and finish', () => {
    const s = schedule(DIAMOND)
    expect(s.tasks.get('M1.1.4')).toMatchObject({ latestStart: 7, latestFinish: 8 })
    expect(s.tasks.get('M1.1.2')).toMatchObject({ latestStart: 5, latestFinish: 7 })
    expect(s.tasks.get('M1.1.3')).toMatchObject({ latestStart: 3, latestFinish: 7 })
    expect(s.tasks.get('M1.1.1')).toMatchObject({ latestStart: 0, latestFinish: 3 })
  })

  it('computes float, and marks only zero-float tasks critical', () => {
    const s = schedule(DIAMOND)
    expect(s.tasks.get('M1.1.1')!.float).toBe(0)
    expect(s.tasks.get('M1.1.2')!.float).toBe(2) // the slack lane
    expect(s.tasks.get('M1.1.3')!.float).toBe(0)
    expect(s.tasks.get('M1.1.4')!.float).toBe(0)
    expect(s.criticalTasks).toEqual(['M1.1.1', 'M1.1.3', 'M1.1.4'])
  })

  it('reports the project duration as the longest path', () => {
    expect(schedule(DIAMOND).projectDuration).toBe(8)
  })

  it('traces one contiguous critical chain', () => {
    expect(schedule(DIAMOND).criticalChain).toEqual(['M1.1.1', 'M1.1.3', 'M1.1.4'])
  })
})

describe('two scenarios (D3)', () => {
  // Two independent lanes into a shared finish. Lane 1 is wide (1-10),
  // lane 2 is narrow (5-6). Which one binds depends on the end taken.
  const LANES: TaskSpec[] = [
    { id: 'M1.1.1', duration: { min: 1, max: 10 } },
    { id: 'M1.1.2', duration: { min: 5, max: 6 } },
    { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1', 'M1.1.2'] },
  ]

  it('takes duration.min for optimistic and duration.max for pessimistic', () => {
    expect(schedule(LANES, 'optimistic').projectDuration).toBe(6) // 5 + 1
    expect(schedule(LANES, 'pessimistic').projectDuration).toBe(11) // 10 + 1
  })

  it('THE CRITICAL PATH IS A DIFFERENT PATH IN EACH SCENARIO', () => {
    // The reason both are computed rather than one being scaled. Under
    // optimistic durations lane 2 binds; under pessimistic, lane 1 does.
    // Anything that reports "the" critical path without naming the scenario
    // is telling half the truth.
    expect(schedule(LANES, 'optimistic').criticalTasks).toEqual(['M1.1.2', 'M1.1.3'])
    expect(schedule(LANES, 'pessimistic').criticalTasks).toEqual(['M1.1.1', 'M1.1.3'])

    expect(schedule(LANES, 'optimistic').criticalChain).toEqual(['M1.1.2', 'M1.1.3'])
    expect(schedule(LANES, 'pessimistic').criticalChain).toEqual(['M1.1.1', 'M1.1.3'])
  })

  it('gives the slack to the other lane in each case', () => {
    expect(schedule(LANES, 'optimistic').tasks.get('M1.1.1')!.float).toBe(4)
    expect(schedule(LANES, 'pessimistic').tasks.get('M1.1.2')!.float).toBe(4)
  })

  it('never reports a shorter pessimistic schedule than optimistic', () => {
    const o = schedule(LANES, 'optimistic')
    const p = schedule(LANES, 'pessimistic')
    expect(p.projectDuration).toBeGreaterThanOrEqual(o.projectDuration)
  })
})

describe('zero-length tasks (D4)', () => {
  it('consume no time but still order the graph', () => {
    const s = schedule([
      { id: 'M1.1.1', duration: 3 },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] }, // no duration
      { id: 'M1.1.3', duration: 2, predecessors: ['M1.1.2'] },
    ])
    expect(s.tasks.get('M1.1.2')).toMatchObject({ earliestStart: 3, earliestFinish: 3 })
    expect(s.tasks.get('M1.1.3')).toMatchObject({ earliestStart: 3, earliestFinish: 5 })
    expect(s.projectDuration).toBe(5)
  })

  it('can sit on the critical path', () => {
    const s = schedule([
      { id: 'M1.1.1', duration: 3 },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', duration: 2, predecessors: ['M1.1.2'] },
    ])
    expect(s.criticalTasks).toContain('M1.1.2')
    expect(s.criticalChain).toEqual(['M1.1.1', 'M1.1.2', 'M1.1.3'])
  })
})

describe('shape edge cases', () => {
  it('handles multiple roots and multiple sinks', () => {
    const s = schedule([
      { id: 'M1.1.1', duration: 2 },
      { id: 'M1.1.2', duration: 5 },
      { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1'] },
      { id: 'M1.1.4', duration: 1, predecessors: ['M1.1.2'] },
    ])
    expect(s.projectDuration).toBe(6)
    // A sink that finishes early may drift to the project finish.
    expect(s.tasks.get('M1.1.3')!.float).toBe(3)
    expect(s.tasks.get('M1.1.4')!.float).toBe(0)
  })

  it('handles a single task', () => {
    const s = schedule([{ id: 'M1.1.1', duration: 4 }])
    expect(s.projectDuration).toBe(4)
    expect(s.criticalChain).toEqual(['M1.1.1'])
  })

  it('handles a fully disconnected graph', () => {
    const s = schedule([
      { id: 'M1.1.1', duration: 4 },
      { id: 'M1.1.2', duration: 4 },
    ])
    expect(s.projectDuration).toBe(4)
    expect(s.criticalTasks).toEqual(['M1.1.1', 'M1.1.2'])
  })

  it('float equals latestFinish minus earliestFinish as well as latestStart minus earliestStart', () => {
    const s = schedule([
      { id: 'M1.1.1', duration: 2 },
      { id: 'M1.1.2', duration: 5 },
      { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1', 'M1.1.2'] },
    ])
    for (const [, task] of s.tasks) {
      expect(task.latestFinish - task.earliestFinish).toBe(task.float)
      expect(task.latestStart - task.earliestStart).toBe(task.float)
    }
  })
})

describe('determinism', () => {
  it('produces identical results across runs regardless of authoring order', () => {
    const forward: TaskSpec[] = [
      { id: 'M1.1.1', duration: 3 },
      { id: 'M1.1.2', duration: 2, predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', duration: 2, predecessors: ['M1.1.1'] },
      { id: 'M1.1.4', duration: 1, predecessors: ['M1.1.2', 'M1.1.3'] },
    ]
    const reversed = [...forward].reverse()

    const a = schedule(forward)
    const b = schedule(reversed)

    expect(a.criticalTasks).toEqual(b.criticalTasks)
    expect(a.criticalChain).toEqual(b.criticalChain)
    expect([...a.tasks.entries()]).toEqual([...b.tasks.entries()])
  })
})
