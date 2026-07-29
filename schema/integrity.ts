/**
 * Referential integrity — the checks Zod cannot express.
 *
 * program.schema.ts proves each entity has the right SHAPE. This proves the
 * entities actually refer to each other: that a predecessor names a real task,
 * that an owner resolves to a registered role, and that an ID's path resolves
 * to the parent it claims.
 *
 * That last one matters more than it looks. `M4.3.2` asserts it is task 2 of
 * package 3 of milestone 4. If `M4.3.2` is filed under package `M5.1`, every
 * breadcrumb, drill-down and rollup silently disagrees with every ID on screen.
 *
 * NOT here: cycle detection. That needs the graph layer and belongs to phase 3,
 * where it will run over the same task edges this file proves are resolvable.
 */

import { parentId } from './program.schema.js'
import type { Program } from './program.schema.js'

export interface ValidationIssue {
  /** Where in the document, e.g. `tasks[12].predecessors[0]`. */
  path: string
  /** The ID of the entity at fault, when there is one. */
  id?: string
  message: string
}

/** Reports every problem found, never just the first — one run should be enough to fix the file. */
export function checkIntegrity(program: Program): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const add = (path: string, message: string, id?: string) => issues.push({ path, id, message })

  /* ── Uniqueness ─────────────────────────────────────────────────────────
   * "IDs are permanent. If work is removed, the ID is retired, never reused."
   * A duplicate means two different things answer to one name, and every
   * reference to it is ambiguous.
   */
  const duplicates = (items: { id: string }[], collection: string) => {
    const seen = new Map<string, number>()
    items.forEach((item, i) => {
      const first = seen.get(item.id)
      if (first !== undefined) {
        add(
          `${collection}[${i}].id`,
          `duplicate ID — already used by ${collection}[${first}]. IDs are permanent and never reused`,
          item.id,
        )
      } else {
        seen.set(item.id, i)
      }
    })
  }

  duplicates(program.roles, 'roles')
  duplicates(program.milestones, 'milestones')
  duplicates(program.packages, 'packages')
  duplicates(program.tasks, 'tasks')

  const roleIds = new Set(program.roles.map((r) => r.id))
  const milestoneIds = new Set(program.milestones.map((m) => m.id))
  const packageIds = new Set(program.packages.map((p) => p.id))
  const taskIds = new Set(program.tasks.map((t) => t.id))

  const knownRole = (id: string) => roleIds.has(id)

  /* ── Milestones ───────────────────────────────────────────────────────── */

  program.milestones.forEach((milestone, i) => {
    if (!knownRole(milestone.approver)) {
      add(
        `milestones[${i}].approver`,
        `approver "${milestone.approver}" is not in the roles registry`,
        milestone.id,
      )
    }
  })

  /* ── Packages ─────────────────────────────────────────────────────────── */

  program.packages.forEach((pkg, i) => {
    if (!milestoneIds.has(pkg.milestone)) {
      add(`packages[${i}].milestone`, `milestone "${pkg.milestone}" does not exist`, pkg.id)
    }

    const parent = parentId(pkg.id)
    if (parent !== null && parent !== pkg.milestone) {
      add(
        `packages[${i}].id`,
        `ID says this package belongs to milestone "${parent}", but it is filed under "${pkg.milestone}" — ` +
          `an ID must carry its own path upward`,
        pkg.id,
      )
    }

    pkg.owners.forEach((owner, j) => {
      if (!knownRole(owner)) {
        add(`packages[${i}].owners[${j}]`, `owner "${owner}" is not in the roles registry`, pkg.id)
      }
    })

    if (new Set(pkg.owners).size !== pkg.owners.length) {
      add(`packages[${i}].owners`, 'duplicate entries in `owners`', pkg.id)
    }
  })

  /* ── Tasks ────────────────────────────────────────────────────────────── */

  program.tasks.forEach((task, i) => {
    if (!packageIds.has(task.package)) {
      add(`tasks[${i}].package`, `package "${task.package}" does not exist`, task.id)
    }

    const parent = parentId(task.id)
    if (parent !== null && parent !== task.package) {
      add(
        `tasks[${i}].id`,
        `ID says this task belongs to package "${parent}", but it is filed under "${task.package}" — ` +
          `an ID must carry its own path upward`,
        task.id,
      )
    }

    task.owners.forEach((owner, j) => {
      if (!knownRole(owner)) {
        add(`tasks[${i}].owners[${j}]`, `owner "${owner}" is not in the roles registry`, task.id)
      }
    })

    if (new Set(task.owners).size !== task.owners.length) {
      add(`tasks[${i}].owners`, 'duplicate entries in `owners`', task.id)
    }

    task.predecessors.forEach((pred, j) => {
      if (!taskIds.has(pred)) {
        add(
          `tasks[${i}].predecessors[${j}]`,
          `predecessor "${pred}" does not exist. Dependencies are authored on tasks only — ` +
            `a package or milestone ID here is not a valid edge`,
          task.id,
        )
      }
    })
  })

  /* ── Empty containers ─────────────────────────────────────────────────────
   * A milestone with no tasks beneath it has no derivable duration, no status
   * to roll up, and no position in the graph. It is a heading, not a milestone.
   */

  const packagesByMilestone = new Set(program.packages.map((p) => p.milestone))
  program.milestones.forEach((milestone, i) => {
    if (!packagesByMilestone.has(milestone.id)) {
      add(
        `milestones[${i}]`,
        'milestone has no packages — nothing to roll up from, so its duration and status are undefined',
        milestone.id,
      )
    }
  })

  const tasksByPackage = new Set(program.tasks.map((t) => t.package))
  program.packages.forEach((pkg, i) => {
    if (!tasksByPackage.has(pkg.id)) {
      add(
        `packages[${i}]`,
        'package has no tasks — nothing to roll up from, so its duration and status are undefined',
        pkg.id,
      )
    }
  })

  return issues
}
