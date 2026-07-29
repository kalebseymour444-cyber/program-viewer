/**
 * The authored shape of `program.yaml` — the single hand-edited source of truth.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTHING DERIVED MAY BE ADDED TO THIS FILE.
 *
 * Milestone/package dependencies, durations, earliest start & finish, critical
 * path, float, rolled-up status, days-in-state, upstream/downstream closure,
 * cross-milestone edges and resource contention are all COMPUTED (SPEC §3).
 * A field here that could be computed is a second claim to truth about the same
 * fact, and the two will diverge. If you are about to add one, read SPEC §2.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deviations from SPEC §3, decided 2026-07-28 (see docs/open-questions.md):
 *   D1  duration is a {min, max} range in days, not a single integer
 *   D2  `owners: RoleId[]`, not a single `owner`
 *   D4  duration is optional; absent means zero-length
 *   D6  status_since is required exactly when status is AT_RISK or BLOCKED
 *   D7  `gate` is authored on tasks only — never on packages or milestones
 *
 * This file validates SHAPE. Cross-references between entities (does this
 * predecessor exist? does this owner resolve to a role?) are checked in
 * ./integrity.ts. Cycle detection belongs to phase 3, not here.
 */

import { z } from 'zod'

/* ── Identifiers ───────────────────────────────────────────────────────────
 *
 * An ID carries its own path upward: `M4.3.2` is task 2 of package 3 of
 * milestone 4. That is what makes traversal mechanical rather than a matter of
 * someone remembering (conventions.md). The grammar enforces the *shape* of
 * that path; integrity.ts enforces that the path actually resolves.
 *
 * Deliberately NOT hardcoding the `M` prefix — a milestone ID is any token.
 * `M4` is this program's convention, not the model's (SPEC §9).
 */

const CHAR = '[A-Za-z0-9_-]'
/** One path segment: `3`, `2a`, `NET-R`. */
const SEGMENT = `${CHAR}+`
/** The root segment must start with a letter, so an ID never reads as a number. */
const ROOT = `[A-Za-z]${CHAR}*`

export const MILESTONE_ID_RE = new RegExp(`^${ROOT}$`)
export const PACKAGE_ID_RE = new RegExp(`^${ROOT}\\.${SEGMENT}$`)
export const TASK_ID_RE = new RegExp(`^${ROOT}\\.${SEGMENT}\\.${SEGMENT}$`)
export const ROLE_ID_RE = new RegExp(`^${ROOT}$`)

/** `M4.3.2` → `M4.3`. Returns null for an ID with no parent. */
export function parentId(id: string): string | null {
  const cut = id.lastIndexOf('.')
  return cut === -1 ? null : id.slice(0, cut)
}

const milestoneId = z
  .string()
  .regex(MILESTONE_ID_RE, 'must be a milestone ID — a bare token with no dots, e.g. "M4"')
const packageId = z
  .string()
  .regex(PACKAGE_ID_RE, 'must be a package ID of the form <milestone>.<n>, e.g. "M4.3"')
const taskId = z
  .string()
  .regex(TASK_ID_RE, 'must be a task ID of the form <milestone>.<n>.<n>, e.g. "M4.3.2"')
const roleId = z.string().regex(ROLE_ID_RE, 'must be a role ID, e.g. "NET-R"')

/* ── Enumerations ──────────────────────────────────────────────────────── */

export const TASK_TYPES = ['PHY', 'DIG', 'DOC', 'HYB'] as const
export const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'BLOCKED', 'COMPLETE'] as const

/** Statuses for which aging must always be visible, so status_since is required (SPEC §3, D6). */
export const AGING_STATUSES = ['AT_RISK', 'BLOCKED'] as const

const taskType = z.enum(TASK_TYPES)
const status = z.enum(STATUSES)

/* ── Duration (D1, D4) ─────────────────────────────────────────────────── */

const durationRange = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  })
  .strict()
  .refine((d) => d.min <= d.max, {
    message: 'duration.min must be less than or equal to duration.max',
    path: ['min'],
  })

/**
 * Authored as `{min: 3, max: 5}`, or as bare `3` for a fixed duration, which
 * normalises to `{min: 3, max: 3}`. One canonical internal form; the shorthand
 * exists only so the ~180 fixed-duration tasks are not three lines each.
 *
 * Absent entirely = zero-length (D4). Renders as "—", never "0d": a continuous
 * activity must not read as instantaneous.
 */
const duration = z.preprocess(
  (v) => (typeof v === 'number' ? { min: v, max: v } : v),
  durationRange,
)

/* ── Dates ─────────────────────────────────────────────────────────────── */

function isRealCalendarDate(s: string): boolean {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  const parsed = new Date(Date.UTC(y, m - 1, d))
  return (
    parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
  )
}

/** Accepts `2026-07-28` whether the YAML loader hands us a string or a Date. */
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO calendar date, e.g. 2026-07-28')
    .refine(isRealCalendarDate, 'is not a real calendar date'),
)

/* ── Entities ──────────────────────────────────────────────────────────────
 *
 * Every object is .strict(): an unrecognised key is an error, not a shrug.
 * A typo'd `predecessor:` silently dropping every edge on that task is exactly
 * the kind of failure that looks plausible while being wrong.
 */

export const roleSchema = z
  .object({
    id: roleId,
    name: z.string().min(1),
  })
  .strict()

export const programMetaSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1).optional(),
  })
  .strict()

export const milestoneSchema = z
  .object({
    id: milestoneId,
    name: z.string().min(1),
    /** Named signatory. "A definition without a signature recorded against it is a suggestion." */
    approver: roleId,
    note: z.string().min(1).optional(),
  })
  .strict()

export const packageSchema = z
  .object({
    id: packageId,
    milestone: milestoneId,
    name: z.string().min(1),
    type: taskType,
    owners: z.array(roleId).nonempty('at least one owner is required'),
    note: z.string().min(1).optional(),
  })
  .strict()

const taskFields = z
  .object({
    id: taskId,
    package: packageId,
    name: z.string().min(1),
    type: taskType,
    /** Plural by decision D2. A HYB task needs two owners present simultaneously. */
    owners: z.array(roleId).nonempty('at least one owner is required'),
    /** Optional (D4). Absent = zero-length. Working days (SPEC §3). */
    duration: duration.optional(),
    /** The ONLY place dependencies are authored. Everything above rolls up from here. */
    predecessors: z.array(taskId).default([]),

    gate: z.boolean().default(false),
    criterion: z.string().min(1).optional(),
    evidence: z.string().min(1).optional(),

    status: status.default('NOT_STARTED'),
    status_since: isoDate.optional(),

    note: z.string().min(1).optional(),
    /** Externally controlled — permits, carriers, vendors, inspection queues. */
    external: z.boolean().default(false),
  })
  .strict()

export const taskSchema = taskFields
  .refine((t) => !t.gate || (t.criterion && t.evidence), {
    message:
      'a gate requires both `criterion` and `evidence` — gate exit is measured, not asserted, ' +
      'and a gate with no stated evidence is decorative',
    path: ['criterion'],
  })
  .refine(
    (t) => !(AGING_STATUSES as readonly string[]).includes(t.status) || t.status_since !== undefined,
    {
      message:
        '`status_since` is required when status is AT_RISK or BLOCKED — aging is always displayed, ' +
        'so it must not be possible to hide it by omitting the date',
      path: ['status_since'],
    },
  )
  .refine((t) => !t.predecessors.includes(t.id), {
    message: 'a task cannot be its own predecessor',
    path: ['predecessors'],
  })
  .refine((t) => new Set(t.predecessors).size === t.predecessors.length, {
    message: 'duplicate entries in `predecessors`',
    path: ['predecessors'],
  })

export const programSchema = z
  .object({
    program: programMetaSchema,
    roles: z.array(roleSchema).nonempty('a role registry is required'),
    milestones: z.array(milestoneSchema).nonempty('at least one milestone is required'),
    packages: z.array(packageSchema).nonempty('at least one package is required'),
    tasks: z.array(taskSchema).nonempty('at least one task is required'),
  })
  .strict()

/* ── Types ─────────────────────────────────────────────────────────────── */

export type Role = z.infer<typeof roleSchema>
export type ProgramMeta = z.infer<typeof programMetaSchema>
export type Milestone = z.infer<typeof milestoneSchema>
export type Package = z.infer<typeof packageSchema>
export type Task = z.infer<typeof taskSchema>
export type Program = z.infer<typeof programSchema>
export type Duration = z.infer<typeof durationRange>
export type TaskType = (typeof TASK_TYPES)[number]
export type Status = (typeof STATUSES)[number]
