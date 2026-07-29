import { describe, expect, it } from 'vitest'
import { makeProgram } from './__fixtures__/make.js'
import { computeProgramGraph } from './index.js'
import { buildAdjacency } from './build.js'
import { closureOf, crossMilestoneEdges } from './closure.js'

describe('closure is transitive, not adjacent', () => {
  // A → B → C → D, plus an unrelated E.
  const graph = computeProgramGraph(
    makeProgram([
      { id: 'M1.1.1', duration: 1 },
      { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.2'] },
      { id: 'M1.1.4', duration: 1, predecessors: ['M1.1.3'] },
      { id: 'M1.2.1', duration: 1 },
    ]),
  )

  it('reaches the whole upstream chain, not just immediate predecessors', () => {
    const ids = graph.closure('M1.1.4').upstream.map((n) => n.id)
    expect(ids).toEqual(['M1.1.3', 'M1.1.2', 'M1.1.1'])
  })

  it('reaches the whole downstream chain', () => {
    const ids = graph.closure('M1.1.1').downstream.map((n) => n.id)
    expect(ids).toEqual(['M1.1.2', 'M1.1.3', 'M1.1.4'])
  })

  it('records depth as the edge count', () => {
    const upstream = graph.closure('M1.1.4').upstream
    expect(upstream.find((n) => n.id === 'M1.1.3')!.depth).toBe(1)
    expect(upstream.find((n) => n.id === 'M1.1.1')!.depth).toBe(3)
  })

  it('excludes unrelated tasks and the node itself', () => {
    const closure = graph.closure('M1.1.4')
    expect(closure.upstream.map((n) => n.id)).not.toContain('M1.2.1')
    expect(closure.upstream.map((n) => n.id)).not.toContain('M1.1.4')
    expect(closure.downstream).toEqual([])
  })

  it('throws on an unknown task', () => {
    expect(() => graph.closure('M9.9.9')).toThrow(/unknown task/)
  })
})

describe('diamonds', () => {
  const graph = computeProgramGraph(
    makeProgram([
      { id: 'M1.1.1', duration: 1 },
      { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
      { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1'] },
      { id: 'M1.1.4', duration: 1, predecessors: ['M1.1.2', 'M1.1.3'] },
    ]),
  )

  it('lists a node reachable by two paths exactly once', () => {
    const ids = graph.closure('M1.1.4').upstream.map((n) => n.id)
    expect(ids).toEqual(['M1.1.2', 'M1.1.3', 'M1.1.1'])
    expect(ids.filter((id) => id === 'M1.1.1')).toHaveLength(1)
  })

  it('reports the shortest depth when a node is reachable at several', () => {
    const graph2 = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 1 },
        { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
        // Reachable from M1.1.1 directly (depth 1) and via M1.1.2 (depth 2).
        { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.1', 'M1.1.2'] },
      ]),
    )
    const upstream = graph2.closure('M1.1.3').upstream
    expect(upstream.find((n) => n.id === 'M1.1.1')!.depth).toBe(1)
  })
})

describe('longest reach — the callout SPEC §5 asks for', () => {
  it('picks the upstream node furthest away in days, not in edges', () => {
    // A long-duration early task, then a short chain. The reach that matters
    // is time, not hop count: the point is "this was decided months ago".
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 100 },
        { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
        { id: 'M1.1.3', duration: 1, predecessors: ['M1.1.2'] },
      ]),
    )
    const closure = graph.closure('M1.1.3')
    expect(closure.longestUpstream?.id).toBe('M1.1.1')
    expect(closure.longestUpstream?.spanDays).toBe(101)
  })

  it('measures downstream reach forwards', () => {
    const graph = computeProgramGraph(
      makeProgram([
        { id: 'M1.1.1', duration: 10 },
        { id: 'M1.1.2', duration: 10, predecessors: ['M1.1.1'] },
      ]),
    )
    expect(graph.closure('M1.1.1').longestDownstream).toMatchObject({
      id: 'M1.1.2',
      spanDays: 10,
    })
  })

  it('is undefined when there is nothing upstream', () => {
    const graph = computeProgramGraph(makeProgram([{ id: 'M1.1.1', duration: 1 }]))
    expect(graph.closure('M1.1.1').longestUpstream).toBeUndefined()
  })

  it('works without a schedule, falling back to depth', () => {
    const program = makeProgram([
      { id: 'M1.1.1', duration: 1 },
      { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
    ])
    const closure = closureOf(buildAdjacency(program.tasks), 'M1.1.2')
    expect(closure.upstream[0]).toEqual({ id: 'M1.1.1', depth: 1 })
    expect(closure.longestUpstream?.id).toBe('M1.1.1')
  })
})

describe('cross-milestone edges', () => {
  const program = makeProgram([
    { id: 'M1.1.1', duration: 10 },
    { id: 'M1.1.2', duration: 1, predecessors: ['M1.1.1'] },
    { id: 'M2.1.1', duration: 1, predecessors: ['M1.1.2'] },
    { id: 'M3.1.1', duration: 1, predecessors: ['M1.1.1'] },
  ])
  const graph = computeProgramGraph(program)

  it('lists only edges whose endpoints differ in milestone', () => {
    const edges = graph.pessimistic.crossMilestoneEdges
    expect(edges.map((e) => `${e.from}->${e.to}`).sort()).toEqual([
      'M1.1.1->M3.1.1',
      'M1.1.2->M2.1.1',
    ])
  })

  it('sorts by reach, longest first — the long ones are the ones that fail', () => {
    const edges = graph.pessimistic.crossMilestoneEdges
    expect(edges[0]!.from).toBe('M1.1.1')
    expect(edges[0]!.spanDays).toBe(10)
    expect(edges[1]!.spanDays).toBe(1)
  })

  it('records both endpoints\' milestones', () => {
    const edge = graph.pessimistic.crossMilestoneEdges.find((e) => e.to === 'M2.1.1')!
    expect(edge.fromMilestone).toBe('M1')
    expect(edge.toMilestone).toBe('M2')
  })

  it('is deterministic when spans tie', () => {
    const a = crossMilestoneEdges(buildAdjacency(program.tasks))
    const b = crossMilestoneEdges(buildAdjacency([...program.tasks].reverse()))
    expect(a).toEqual(b)
  })
})
