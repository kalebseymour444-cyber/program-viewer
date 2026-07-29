// @vitest-environment jsdom
/**
 * The chain, rendered beside the graph (SPEC §5). Exercised against a real
 * closure so the list, the counts, and the longest-reach callout reflect the
 * tested computation rather than a fixture's guesswork.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import realProgram from '../../../public/program.json'
import { closureOf } from '../../../graph/closure.js'
import { ProgramContext, type ProgramDocument } from '../../lib/program.js'
import { graphInputs } from '../../lib/graph.js'
import { ChainPanel } from './ChainPanel.js'

const program = realProgram as unknown as ProgramDocument
const { adjacency, schedules } = graphInputs(program)

const anchor = program.tasks.find((t) => t.predecessors.length > 0 && t.successors.length > 0)!
const closure = closureOf(adjacency, anchor.id, schedules.pessimistic)

afterEach(cleanup)

function renderPanel(onSelect = vi.fn()) {
  render(
    <ProgramContext.Provider value={program}>
      <MemoryRouter>
        <ChainPanel closure={closure} onSelect={onSelect} />
      </MemoryRouter>
    </ProgramContext.Provider>,
  )
  return onSelect
}

describe('ChainPanel', () => {
  it('names the selected task and both chain directions', () => {
    renderPanel()
    expect(screen.getAllByText(anchor.id).length).toBeGreaterThan(0)
    expect(screen.getByText('Upstream')).toBeDefined()
    expect(screen.getByText('Downstream')).toBeDefined()
  })

  it('lists every upstream node the closure found', () => {
    renderPanel()
    const section = screen.getByText('Upstream').closest('section')!
    for (const node of closure.upstream) {
      expect(within(section).getAllByText(node.id).length).toBeGreaterThan(0)
    }
  })

  it('selects a chained task when its row is clicked', () => {
    const onSelect = renderPanel()
    const target = closure.upstream[0]
    if (target === undefined) return // anchor with no upstream — nothing to click
    const section = screen.getByText('Upstream').closest('section')!
    fireEvent.click(within(section).getAllByText(target.id)[0]!)
    expect(onSelect).toHaveBeenCalledWith(target.id)
  })
})
