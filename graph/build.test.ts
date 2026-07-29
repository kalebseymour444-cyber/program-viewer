import { describe, expect, it } from 'vitest'
import { makeProgram, makeProgramUnchecked } from './__fixtures__/make.js'
import { buildAdjacency, topologicalOrder, DependencyCycleError } from './build.js'
import { computeProgramGraph } from './index.js'

describe('adjacency', () => {
  const program = makeProgram([
    { id: 'M1.1.1' },
    { id: 'M1.1.2', predecessors: ['M1.1.1'] },
    { id: 'M1.1.3', predecessors: ['M1.1.1'] },
    { id: 'M1.1.4', predecessors: ['M1.1.2', 'M1.1.3'] },
  ])

  it('derives successors from authored predecessors', () => {
    const adjacency = buildAdjacency(program.tasks)
    expect(adjacency.successors.get('M1.1.1')).toEqual(['M1.1.2', 'M1.1.3'])
    expect(adjacency.successors.get('M1.1.4')).toEqual([])
  })

  it('sorts every list, so downstream output cannot depend on authoring order', () => {
    const scrambled = makeProgram([
      { id: 'M1.1.4', predecessors: ['M1.1.3', 'M1.1.2'] },
      { id: 'M1.1.1' },
      { id: 'M1.1.3', predecessors: ['M1.1.1'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
    ])
    const adjacency = buildAdjacency(scrambled.tasks)
    expect(adjacency.ids).toEqual(['M1.1.1', 'M1.1.2', 'M1.1.3', 'M1.1.4'])
    expect(adjacency.predecessors.get('M1.1.4')).toEqual(['M1.1.2', 'M1.1.3'])
  })

  it('throws rather than silently dropping an edge to an unknown task', () => {
    const broken = makeProgramUnchecked([
      { id: 'M1.1.1' },
      { id: 'M1.1.2', predecessors: ['M1.9.9'] },
    ])
    expect(() => buildAdjacency(broken.tasks)).toThrow(/not a known task/)
  })
})

describe('topological order', () => {
  it('places every task after its predecessors', () => {
    const program = makeProgram([
      { id: 'M1.1.1' },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', predecessors: ['M1.1.2'] },
      { id: 'M2.1.1', predecessors: ['M1.1.3'] },
    ])
    const adjacency = buildAdjacency(program.tasks)
    const { order } = topologicalOrder(adjacency)

    const position = new Map(order.map((id, i) => [id, i]))
    for (const task of program.tasks) {
      for (const pred of task.predecessors) {
        expect(position.get(pred)!).toBeLessThan(position.get(task.id)!)
      }
    }
  })

  it('is canonical — the lowest ready ID always goes first', () => {
    // M1.1.2 and M1.1.3 are both ready once M1.1.1 completes. Without a
    // tie-break the order would depend on Map iteration, and every regenerated
    // file would diff for no reason.
    const program = makeProgram([
      { id: 'M1.1.1' },
      { id: 'M1.1.3', predecessors: ['M1.1.1'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
    ])
    const { order } = topologicalOrder(buildAdjacency(program.tasks))
    expect(order).toEqual(['M1.1.1', 'M1.1.2', 'M1.1.3'])
  })

  it('orders disconnected roots by ID', () => {
    const program = makeProgram([{ id: 'M2.1.1' }, { id: 'M1.1.1' }, { id: 'M1.2.1' }])
    const { order } = topologicalOrder(buildAdjacency(program.tasks))
    expect(order).toEqual(['M1.1.1', 'M1.2.1', 'M2.1.1'])
  })

  it('reports no cycles for an acyclic graph', () => {
    const program = makeProgram([{ id: 'M1.1.1' }, { id: 'M1.1.2', predecessors: ['M1.1.1'] }])
    const result = topologicalOrder(buildAdjacency(program.tasks))
    expect(result.cycles).toEqual([])
    expect(result.unordered).toEqual([])
  })
})

describe('cycle detection', () => {
  it('finds a two-task cycle and names both tasks', () => {
    const program = makeProgramUnchecked([
      { id: 'M1.1.1', predecessors: ['M1.1.2'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
    ])
    const { cycles, order } = topologicalOrder(buildAdjacency(program.tasks))

    expect(order).toEqual([])
    expect(cycles).toHaveLength(1)
    expect([...cycles[0]!].sort()).toEqual(['M1.1.1', 'M1.1.2'])
  })

  it('finds a three-task cycle', () => {
    const program = makeProgramUnchecked([
      { id: 'M1.1.1', predecessors: ['M1.1.3'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', predecessors: ['M1.1.2'] },
    ])
    const { cycles } = topologicalOrder(buildAdjacency(program.tasks))
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toEqual(['M1.1.1', 'M1.1.2', 'M1.1.3'])
  })

  it('still orders the acyclic part and reports only the knot', () => {
    const program = makeProgramUnchecked([
      { id: 'M1.1.1' },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M2.1.1', predecessors: ['M2.1.2'] },
      { id: 'M2.1.2', predecessors: ['M2.1.1'] },
    ])
    const { order, unordered, cycles } = topologicalOrder(buildAdjacency(program.tasks))

    expect(order).toEqual(['M1.1.1', 'M1.1.2'])
    expect(unordered).toEqual(['M2.1.1', 'M2.1.2'])
    expect(cycles).toHaveLength(1)
  })

  it('reports two independent cycles separately', () => {
    const program = makeProgramUnchecked([
      { id: 'M1.1.1', predecessors: ['M1.1.2'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M2.1.1', predecessors: ['M2.1.2'] },
      { id: 'M2.1.2', predecessors: ['M2.1.1'] },
    ])
    const { cycles } = topologicalOrder(buildAdjacency(program.tasks))
    expect(cycles).toHaveLength(2)
  })

  it('reports a cycle identically no matter which node it was entered from', () => {
    // Canonical rotation. Otherwise the same defect prints differently between
    // runs and looks like two different problems.
    const forward = makeProgramUnchecked([
      { id: 'M1.1.1', predecessors: ['M1.1.3'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', predecessors: ['M1.1.2'] },
    ])
    const withExtraRoot = makeProgramUnchecked([
      { id: 'M1.1.0' },
      { id: 'M1.1.1', predecessors: ['M1.1.3'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1', 'M1.1.0'] },
      { id: 'M1.1.3', predecessors: ['M1.1.2'] },
    ])

    const a = topologicalOrder(buildAdjacency(forward.tasks)).cycles[0]
    const b = topologicalOrder(buildAdjacency(withExtraRoot.tasks)).cycles[0]
    expect(a).toEqual(b)
  })

  it('renders the loop as a loop, not as a list', () => {
    const error = new DependencyCycleError([['M4.3.3', 'M4.3.4', 'M4.3.6']])
    expect(error.message).toContain('M4.3.3 → M4.3.4 → M4.3.6 → M4.3.3')
    expect(error.message).toContain('Remove an edge in program.yaml')
  })

  it('makes computeProgramGraph fail loudly, as SPEC §7 requires', () => {
    const program = makeProgramUnchecked([
      { id: 'M1.1.1', predecessors: ['M1.1.2'] },
      { id: 'M1.1.2', predecessors: ['M1.1.1'] },
    ])
    expect(() => computeProgramGraph(program)).toThrow(DependencyCycleError)
  })
})
