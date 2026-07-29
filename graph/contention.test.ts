import { describe, expect, it } from 'vitest'
import { makeProgram } from './__fixtures__/make.js'
import { computeProgramGraph } from './index.js'

const contention = (specs: Parameters<typeof makeProgram>[0]) =>
  computeProgramGraph(makeProgram(specs)).pessimistic.contention

describe('owner overlap', () => {
  it('detects two tasks held by the same role at the same time', () => {
    const result = contention([
      { id: 'M1.1.1', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 5, owners: ['ICT'] },
    ])
    expect(result.get('ICT')!.overlaps).toEqual([['M1.1.1', 'M1.1.2']])
    expect(result.get('ICT')!.peakConcurrency).toBe(2)
  })

  it('does not flag the same role working sequentially', () => {
    const result = contention([
      { id: 'M1.1.1', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 5, owners: ['ICT'], predecessors: ['M1.1.1'] },
    ])
    expect(result.get('ICT')!.overlaps).toEqual([])
    expect(result.get('ICT')!.peakConcurrency).toBe(1)
  })

  it('does not flag different roles working concurrently', () => {
    const result = contention([
      { id: 'M1.1.1', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 5, owners: ['MECH'] },
    ])
    expect(result.get('ICT')!.overlaps).toEqual([])
    expect(result.get('MECH')!.overlaps).toEqual([])
  })

  it('treats windows as half-open — touching is not overlapping', () => {
    // A task finishing on day 5 does not contend with one starting on day 5.
    const result = contention([
      { id: 'M1.1.1', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 5, owners: ['ICT'], predecessors: ['M1.1.1'] },
    ])
    const windows = result.get('ICT')!.windows
    expect(windows[0]).toMatchObject({ start: 0, end: 5 })
    expect(windows[1]).toMatchObject({ start: 5, end: 10 })
    expect(result.get('ICT')!.overlaps).toEqual([])
  })

  it('detects partial overlap', () => {
    const result = contention([
      { id: 'M1.1.1', duration: 10, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 10, owners: ['ICT'] },
      { id: 'M1.1.3', duration: 1, owners: ['MECH'] },
    ])
    expect(result.get('ICT')!.overlaps).toHaveLength(1)
  })
})

describe('a HYB task occupies both of its owners (D2)', () => {
  it('contends on every role it names', () => {
    // conventions.md defines HYB as needing both people present at the same
    // time, so the task genuinely occupies two roles at once.
    const result = contention([
      { id: 'M1.1.1', duration: 5, owners: ['ICT', 'NET-R'], type: 'HYB' },
      { id: 'M1.1.2', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.3', duration: 5, owners: ['NET-R'] },
    ])
    expect(result.get('ICT')!.overlaps).toEqual([['M1.1.1', 'M1.1.2']])
    expect(result.get('NET-R')!.overlaps).toEqual([['M1.1.1', 'M1.1.3']])
  })
})

describe('zero-length tasks (D4)', () => {
  it('are excluded — they occupy no window, so they cannot contend for one', () => {
    const result = contention([
      { id: 'M1.1.1', owners: ['ICT'] }, // no duration
      { id: 'M1.1.2', duration: 5, owners: ['ICT'] },
    ])
    expect(result.get('ICT')!.windows.map((w) => w.taskId)).toEqual(['M1.1.2'])
    expect(result.get('ICT')!.overlaps).toEqual([])
  })
})

describe('peak concurrency', () => {
  it('counts the most simultaneous tasks, not the total', () => {
    const result = contention([
      { id: 'M1.1.1', duration: 10, owners: ['NET-R'] },
      { id: 'M1.1.2', duration: 10, owners: ['NET-R'] },
      { id: 'M1.1.3', duration: 10, owners: ['NET-R'] },
      { id: 'M1.1.4', duration: 10, owners: ['NET-R'], predecessors: ['M1.1.1'] },
    ])
    expect(result.get('NET-R')!.peakConcurrency).toBe(3)
    expect(result.get('NET-R')!.peakWindow).toEqual({ start: 0, end: 10 })
  })

  it('reports no peak window when the role never doubles up', () => {
    const result = contention([{ id: 'M1.1.1', duration: 5, owners: ['ICT'] }])
    expect(result.get('ICT')!.peakConcurrency).toBe(1)
    expect(result.get('ICT')!.peakWindow).toBeUndefined()
  })
})

describe('determinism', () => {
  it('orders roles, windows and pairs identically regardless of input order', () => {
    const specs: Parameters<typeof makeProgram>[0] = [
      { id: 'M1.1.1', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.2', duration: 5, owners: ['ICT'] },
      { id: 'M1.1.3', duration: 5, owners: ['MECH'] },
    ]
    const a = contention(specs)
    const b = contention([...specs].reverse())
    expect([...a.keys()]).toEqual([...b.keys()])
    expect([...a.entries()]).toEqual([...b.entries()])
  })
})
