/**
 * Compact builder for hand-made test graphs.
 *
 * Everything it produces goes through validateProgram, so a test can never be
 * written against input the real pipeline would have rejected. Milestones,
 * packages and the role registry are inferred from the task IDs and owners.
 */

import { validateProgram } from '../../schema/validate.js'
import type { Program, Status } from '../../schema/program.schema.js'

export interface TaskSpec {
  id: string
  /** Bare number is a fixed duration; omit for zero-length (D4). */
  duration?: number | { min: number; max: number }
  predecessors?: string[]
  status?: Status
  owners?: string[]
  gate?: boolean
  type?: 'PHY' | 'DIG' | 'DOC' | 'HYB'
}

export function makeProgram(specs: TaskSpec[]): Program {
  const packageIds = [...new Set(specs.map((s) => s.id.split('.').slice(0, 2).join('.')))].sort()
  const milestoneIds = [...new Set(specs.map((s) => s.id.split('.')[0]!))].sort()
  const roleIds = [...new Set(specs.flatMap((s) => s.owners ?? ['R1']))].sort()

  const doc = {
    program: { id: 'test', name: 'Test Program' },
    roles: roleIds.map((id) => ({ id, name: `Role ${id}` })),
    milestones: milestoneIds.map((id) => ({
      id,
      name: `Milestone ${id}`,
      approver: roleIds[0] ?? 'R1',
    })),
    packages: packageIds.map((id) => ({
      id,
      milestone: id.split('.')[0]!,
      name: `Package ${id}`,
      type: 'DOC',
      owners: [roleIds[0] ?? 'R1'],
    })),
    tasks: specs.map((spec) => ({
      id: spec.id,
      package: spec.id.split('.').slice(0, 2).join('.'),
      name: `Task ${spec.id}`,
      type: spec.type ?? 'DOC',
      owners: spec.owners ?? ['R1'],
      ...(spec.duration === undefined ? {} : { duration: spec.duration }),
      predecessors: spec.predecessors ?? [],
      ...(spec.gate
        ? { gate: true, criterion: `Criterion for ${spec.id}`, evidence: `Evidence for ${spec.id}` }
        : {}),
      ...(spec.status ? { status: spec.status } : {}),
      // Aging statuses require a date (D6).
      ...(spec.status === 'AT_RISK' || spec.status === 'BLOCKED'
        ? { status_since: '2026-01-01' }
        : {}),
    })),
  }

  return validateProgram(doc, 'test-fixture')
}

/**
 * Build a program WITHOUT validating, for tests that need input validation
 * would reject — cycles above all. Referential integrity does not detect
 * cycles (that is this phase's job), but a cycle fixture still has to bypass
 * the self-predecessor and duplicate checks cleanly.
 */
export function makeProgramUnchecked(specs: TaskSpec[]): Program {
  try {
    return makeProgram(specs)
  } catch {
    // Fall back to an unvalidated cast: the graph layer is what is under test.
    const packageIds = [...new Set(specs.map((s) => s.id.split('.').slice(0, 2).join('.')))].sort()
    const milestoneIds = [...new Set(specs.map((s) => s.id.split('.')[0]!))].sort()
    return {
      program: { id: 'test', name: 'Test Program' },
      roles: [{ id: 'R1', name: 'Role R1' }],
      milestones: milestoneIds.map((id) => ({ id, name: `Milestone ${id}`, approver: 'R1' })),
      packages: packageIds.map((id) => ({
        id,
        milestone: id.split('.')[0]!,
        name: `Package ${id}`,
        type: 'DOC' as const,
        owners: ['R1'] as [string, ...string[]],
      })),
      tasks: specs.map((spec) => ({
        id: spec.id,
        package: spec.id.split('.').slice(0, 2).join('.'),
        name: `Task ${spec.id}`,
        type: spec.type ?? ('DOC' as const),
        owners: (spec.owners ?? ['R1']) as [string, ...string[]],
        duration:
          typeof spec.duration === 'number'
            ? { min: spec.duration, max: spec.duration }
            : spec.duration,
        predecessors: spec.predecessors ?? [],
        gate: spec.gate ?? false,
        status: spec.status ?? ('NOT_STARTED' as const),
        external: false,
      })),
    } as unknown as Program
  }
}
