// @vitest-environment jsdom
/**
 * These are the acceptance criteria from SPEC §3 and §9, as tests.
 *
 * "AT_RISK is never rendered as healthy; aging always visible" is a checkbox in
 * the spec. A checkbox nobody can run is a promise, so it is asserted here
 * against the rendered output rather than against the class names in passing.
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GateCount, StatusBadge, TypeBadge } from './Badges.js'
import type { Status } from '../../schema/program.schema.js'

afterEach(cleanup)

const classesFor = (status: Status, since?: string): string => {
  const { container } = render(<StatusBadge status={status} since={since} />)
  return container.querySelector('span > span')!.className
}

describe('AT_RISK is never rendered as healthy', () => {
  it('uses no green or emerald colour', () => {
    const classes = classesFor('AT_RISK', '2026-01-01')
    expect(classes).not.toMatch(/emerald|green|lime|teal/)
  })

  it('is a different hue from IN_PROGRESS, not a different shade', () => {
    // Two shades of one colour would vanish in greyscale and for a reader with
    // colour-vision deficiency. The hues must actually differ.
    const atRisk = classesFor('AT_RISK', '2026-01-01')
    const inProgress = classesFor('IN_PROGRESS')

    const hue = (classes: string) => classes.match(/text-([a-z]+)-\d+/)![1]
    expect(hue(atRisk)).not.toBe(hue(inProgress))
  })

  it('is a different hue from COMPLETE', () => {
    const atRisk = classesFor('AT_RISK', '2026-01-01')
    const complete = classesFor('COMPLETE')
    const hue = (classes: string) => classes.match(/text-([a-z]+)-\d+/)![1]
    expect(hue(atRisk)).not.toBe(hue(complete))
  })

  it('reads as AT RISK, not as something softer', () => {
    render(<StatusBadge status="AT_RISK" since="2026-01-01" />)
    expect(screen.getByText('AT RISK')).toBeDefined()
  })
})

describe('aging is always displayed', () => {
  const today = new Date('2026-07-28T00:00:00Z')

  it('shows days in state for AT_RISK', () => {
    render(<StatusBadge status="AT_RISK" since="2026-06-28" today={today} />)
    expect(screen.getByText('30d')).toBeDefined()
  })

  it('shows days in state for BLOCKED', () => {
    render(<StatusBadge status="BLOCKED" since="2026-07-21" today={today} />)
    expect(screen.getByText('7d')).toBeDefined()
  })

  it('says so loudly when an aging status has no date, rather than showing nothing', () => {
    render(<StatusBadge status="BLOCKED" today={today} />)
    expect(screen.getByText('no date')).toBeDefined()
  })

  it('shows aging for every AT_RISK badge, with no opt-out', () => {
    // There is deliberately no `showAging` prop on StatusBadge — a prop that
    // could hide aging would eventually be used to hide it. This asserts the
    // behaviour; the absence of the prop is enforced by the type.
    render(<StatusBadge status="AT_RISK" since="2026-07-01" today={today} />)
    expect(screen.getByText('27d')).toBeDefined()
  })

  it('does not clutter non-aging statuses with a day count', () => {
    render(<StatusBadge status="IN_PROGRESS" since="2026-06-01" today={today} />)
    expect(screen.queryByText(/^\d+d$/)).toBeNull()
  })
})

describe('type badges', () => {
  it.each(['PHY', 'DIG', 'DOC', 'HYB'] as const)('renders %s', (type) => {
    render(<TypeBadge type={type} />)
    expect(screen.getByText(type)).toBeDefined()
  })

  it('explains HYB as needing two owners present', () => {
    const { container } = render(<TypeBadge type="HYB" />)
    expect(container.querySelector('span')!.title).toMatch(/two owners/)
  })
})

describe('gate marks show a count, never a bare marker (D8)', () => {
  it('shows the count', () => {
    render(<GateCount count={4} />)
    expect(screen.getByText('4')).toBeDefined()
  })

  it('shows an em dash when there are none', () => {
    render(<GateCount count={0} />)
    expect(screen.getByText('—')).toBeDefined()
  })
})
