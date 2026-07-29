import { describe, expect, it } from 'vitest'
import { makeProgram } from './__fixtures__/make.js'
import { computeProgramGraph } from './index.js'
import { rollupStatus, daysInState, STATUS_SEVERITY, agingMustBeShown } from './status.js'
import type { Status } from '../schema/program.schema.js'

describe('rolled-up dependencies', () => {
  const graph = computeProgramGraph(
    makeProgram([
      { id: 'M1.1.1', duration: 2 },
      { id: 'M1.2.1', duration: 3, predecessors: ['M1.1.1'] },
      { id: 'M2.1.1', duration: 1, predecessors: ['M1.2.1'] },
    ]),
  )

  it('derives package dependencies from task edges', () => {
    expect(graph.packages.get('M1.2')!.dependsOn).toEqual(['M1.1'])
    expect(graph.packages.get('M1.1')!.dependsOn).toEqual([])
  })

  it('derives milestone dependencies from task edges', () => {
    expect(graph.milestones.get('M2')!.dependsOn).toEqual(['M1'])
    expect(graph.milestones.get('M1')!.dependsOn).toEqual([])
  })

  it('derives `feeds` as the inverse, rather than trusting an authored column', () => {
    expect(graph.milestones.get('M1')!.feeds).toEqual(['M2'])
    expect(graph.packages.get('M1.1')!.feeds).toEqual(['M1.2'])
  })

  it('does not record a self-dependency for edges inside one node', () => {
    const internal = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 1 },
        { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
      ]),
    )
    expect(internal.packages.get('M1.1')!.dependsOn).toEqual([])
  })

  it('records membership at both levels', () => {
    expect(graph.milestones.get('M1')!.taskIds).toEqual(['M1.1.1', 'M1.2.1'])
    expect(graph.milestones.get('M1')!.childIds).toEqual(['M1.1', 'M1.2'])
    expect(graph.packages.get('M1.1')!.childIds).toEqual(['M1.1.1'])
  })
})

describe('rollup duration is a span, not a sum', () => {
  it('does not double-count concurrent work', () => {
    // Three tasks of 5 days each, all running at once. The package takes 5
    // days, not 15. Summing would make M4's five parallel lanes look five
    // times longer than they are.
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 5 },
        { id: 'M1.1.2', duration: 5 },
        { id: 'M1.1.3', duration: 5 },
      ]),
    )
    const pkg = graph.pessimistic.packages.get('M1.1')!
    expect(pkg.earliestStart).toBe(0)
    expect(pkg.earliestFinish).toBe(5)
    expect(pkg.duration).toBe(5)
  })

  it('spans from the earliest start to the latest finish', () => {
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 3 },
        { id: 'M1.1.2', duration: 4, predecessors: ['M1.1.1'] },
      ]),
    )
    expect(graph.pessimistic.packages.get('M1.1')!.duration).toBe(7)
  })

  it('takes the tightest float among its tasks', () => {
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 2 }, // slack
        { id: 'M1.1.2', duration: 5 }, // critical
        { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1', 'M1.1.2'] },
      ]),
    )
    expect(graph.pessimistic.packages.get('M1.1')!.float).toBe(0)
    expect(graph.pessimistic.packages.get('M1.1')!.critical).toBe(true)
  })

  it('differs between scenarios when the durations do', () => {
    const graph = computeProgramGraph(
      makeProgram([{ id: 'M1.1.1', duration: { min: 2, max: 9 } }]),
    )
    expect(graph.optimistic.packages.get('M1.1')!.duration).toBe(2)
    expect(graph.pessimistic.packages.get('M1.1')!.duration).toBe(9)
  })
})

describe('gates roll up as a count, not a flag (D8)', () => {
  const graph = computeProgramGraph(
    makeProgram([
      { id: 'M1.1.1', duration: 1, gate: true },
      { id: 'M1.1.2', duration: 1 },
      { id: 'M1.2.1', duration: 1, gate: true },
    ]),
  )

  it('counts gate tasks beneath a package', () => {
    expect(graph.packages.get('M1.1')!.gateCount).toBe(1)
    expect(graph.packages.get('M1.1')!.gateTaskIds).toEqual(['M1.1.1'])
  })

  it('counts gate tasks beneath a milestone', () => {
    expect(graph.milestones.get('M1')!.gateCount).toBe(2)
    expect(graph.milestones.get('M1')!.gateTaskIds).toEqual(['M1.1.1', 'M1.2.1'])
  })

  it('exposes no boolean gate on a rollup', () => {
    expect(graph.milestones.get('M1')).not.toHaveProperty('gate')
    expect(graph.packages.get('M1.1')).not.toHaveProperty('gate')
  })
})

describe('status rollup (D9) — worst case, never optimistic', () => {
  const worst = (...statuses: Status[]) => rollupStatus(statuses)

  it('ranks severity BLOCKED > AT_RISK > IN_PROGRESS > NOT_STARTED > COMPLETE', () => {
    expect(STATUS_SEVERITY).toEqual([
      'BLOCKED',
      'AT_RISK',
      'IN_PROGRESS',
      'NOT_STARTED',
      'COMPLETE',
    ])
  })

  it.each([
    ['BLOCKED', 'AT_RISK'],
    ['AT_RISK', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'NOT_STARTED'],
    ['NOT_STARTED', 'COMPLETE'],
  ] as [Status, Status][])('%s beats %s', (worseStatus, betterStatus) => {
    expect(worst(betterStatus, worseStatus)).toBe(worseStatus)
    expect(worst(worseStatus, betterStatus)).toBe(worseStatus)
  })

  it('AT_RISK is never softened by surrounding healthy work', () => {
    // The rule the whole model exists for. A mitigation plan does not restore
    // green, and neither does a majority of completed tasks.
    expect(worst('COMPLETE', 'COMPLETE', 'COMPLETE', 'AT_RISK')).toBe('AT_RISK')
    expect(worst('IN_PROGRESS', 'AT_RISK', 'COMPLETE')).toBe('AT_RISK')
  })

  it('one blocked task blocks the whole rollup', () => {
    expect(worst('COMPLETE', 'COMPLETE', 'BLOCKED')).toBe('BLOCKED')
  })

  it('requires every task complete before a rollup is complete', () => {
    expect(worst('COMPLETE', 'COMPLETE')).toBe('COMPLETE')
    expect(worst('COMPLETE', 'NOT_STARTED')).toBe('NOT_STARTED')
  })

  it('rolls up through both levels', () => {
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 1, status: 'COMPLETE' },
        { id: 'M1.2.1', duration: 1, status: 'AT_RISK' },
      ]),
    )
    expect(graph.packages.get('M1.1')!.status).toBe('COMPLETE')
    expect(graph.packages.get('M1.2')!.status).toBe('AT_RISK')
    expect(graph.milestones.get('M1')!.status).toBe('AT_RISK')
  })

  it('throws on an empty rollup rather than inventing a status', () => {
    expect(() => rollupStatus([])).toThrow(/no statuses/)
  })
})

describe('aging', () => {
  it('must be shown for AT_RISK and BLOCKED, and only those', () => {
    expect(agingMustBeShown('AT_RISK')).toBe(true)
    expect(agingMustBeShown('BLOCKED')).toBe(true)
    expect(agingMustBeShown('IN_PROGRESS')).toBe(false)
    expect(agingMustBeShown('NOT_STARTED')).toBe(false)
    expect(agingMustBeShown('COMPLETE')).toBe(false)
  })

  it('counts whole days between two dates', () => {
    expect(daysInState('2026-07-01', '2026-07-28')).toBe(27)
    expect(daysInState('2026-07-28', '2026-07-28')).toBe(0)
  })

  it('spans month and year boundaries', () => {
    expect(daysInState('2025-12-25', '2026-01-01')).toBe(7)
  })

  it('takes `asOf` explicitly rather than reading the clock', () => {
    // Build-time aging would change every day, so every regeneration would
    // diff even when nothing about the programme changed — burying real status
    // changes in noise and breaking review-as-pull-request (SPEC §7).
    expect(daysInState.length).toBe(2)
  })

  it('rejects a non-date', () => {
    expect(() => daysInState('not-a-date', '2026-07-28')).toThrow(/not an ISO date/)
  })
})
