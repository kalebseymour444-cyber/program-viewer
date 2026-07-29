// @vitest-environment jsdom
/**
 * Drill-down behaviour (SPEC §5, §8 phase 6), asserted against the real
 * generated document rather than a hand-built fixture — the point of shipping
 * the computed graph in program.json is that the app renders exactly it, so the
 * tests should exercise exactly it. IDs are derived from the data at runtime,
 * so these stay honest as program.yaml changes.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import realProgram from '../../public/program.json'
import { ScenarioProvider } from '../components/Layout.js'
import { ProgramContext, type ProgramDocument } from '../lib/program.js'
import { MilestoneView } from './Milestone.js'
import { PackageView, TaskView } from './Package.js'

const program = realProgram as unknown as ProgramDocument

const milestone = program.milestones.find((m) => m.childIds.length > 0)!
const pkg = program.packages.find((p) => p.taskIds.length >= 2)!
const pkgTasks = pkg.taskIds.map((id) => program.tasks.find((t) => t.id === id)!)

afterEach(cleanup)

function renderAt(path: string) {
  return render(
    <ProgramContext.Provider value={program}>
      <ScenarioProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/milestone/:milestoneId" element={<MilestoneView />} />
            <Route path="/package/:packageId" element={<PackageView />} />
            <Route path="/task/:taskId" element={<TaskView />} />
          </Routes>
        </MemoryRouter>
      </ScenarioProvider>
    </ProgramContext.Provider>,
  )
}

/** First-column IDs in the order the table renders them. */
function renderedTaskIds(container: HTMLElement): string[] {
  return [...container.querySelectorAll('tbody tr')]
    .map((tr) => tr.querySelector('td')?.textContent?.match(/M[\d.]+/)?.[0] ?? '')
    .filter(Boolean)
}

describe('L1 — milestone', () => {
  it('lists every child package of the milestone', () => {
    renderAt(`/milestone/${milestone.id}`)
    expect(screen.getByText(milestone.name)).toBeDefined()
    for (const pkgId of milestone.childIds) {
      expect(screen.getAllByText(pkgId).length).toBeGreaterThan(0)
    }
  })

  it('shows gate criteria when the milestone has gates', () => {
    const withGates = program.milestones.find((m) => m.gateTaskIds.length > 0)!
    renderAt(`/milestone/${withGates.id}`)
    expect(screen.getByText('Gate criteria')).toBeDefined()
  })

  it('reports a milestone that does not exist rather than blanking', () => {
    renderAt('/milestone/NOPE')
    expect(screen.getByText(/No milestone/)).toBeDefined()
  })
})

describe('L2 — package task table', () => {
  it('renders a row for every task in the package', () => {
    const { container } = renderAt(`/package/${pkg.id}`)
    const ids = renderedTaskIds(container)
    for (const task of pkgTasks) expect(ids).toContain(task.id)
  })

  it('breadcrumbs back through the milestone the package authors', () => {
    renderAt(`/package/${pkg.id}`)
    const nav = screen.getByLabelText('Breadcrumb')
    expect(within(nav).getByText(pkg.milestone)).toBeDefined()
    expect(within(nav).getByText(pkg.id)).toBeDefined()
  })

  it('sorts by ID descending when the ID header is toggled', () => {
    const { container } = renderAt(`/package/${pkg.id}`)
    // Default order is ID-ascending, so a toggle gives the exact reverse.
    const before = renderedTaskIds(container)
    fireEvent.click(screen.getByRole('button', { name: /^ID/ }))
    const after = renderedTaskIds(container)
    expect(after).toEqual([...before].reverse())
    expect(after).not.toEqual(before)
  })

  it('filters the table by task type', () => {
    const type = pkgTasks[0]!.type
    const expected = pkgTasks.filter((t) => t.type === type).map((t) => t.id)
    const { container } = renderAt(`/package/${pkg.id}`)

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: type } })
    const ids = renderedTaskIds(container)
    expect(ids.sort()).toEqual([...expected].sort())
  })

  it('reports a package that does not exist', () => {
    renderAt('/package/NOPE')
    expect(screen.getByText(/No package/)).toBeDefined()
  })
})

describe('deep link — /task/:id', () => {
  it('lands on the owning package with the task row focused', () => {
    const task = pkgTasks[0]!
    const { container } = renderAt(`/task/${task.id}`)

    // Breadcrumb shows the package, proving we resolved parentage from the ID.
    const nav = screen.getByLabelText('Breadcrumb')
    expect(within(nav).getByText(task.package)).toBeDefined()

    // Exactly one row carries the focus ring.
    const focused = container.querySelectorAll('tbody tr.ring-1')
    expect(focused.length).toBe(1)
    expect(focused[0]!.textContent).toContain(task.id)
  })

  it('reports a task that does not exist', () => {
    renderAt('/task/NOPE')
    expect(screen.getByText(/No task/)).toBeDefined()
  })
})
