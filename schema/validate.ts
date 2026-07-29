/**
 * The validation entry point. Everything downstream — the generator, the graph
 * layer, the app — starts from a Program that came through here.
 *
 * Failure is loud and total (SPEC §7). There is no partial success, no "warn
 * and continue": a program model that is 98% consistent is one that will render
 * a plausible, wrong answer to the only question anyone asks it.
 */

import { parse as parseYaml, YAMLParseError } from 'yaml'
import { programSchema } from './program.schema.js'
import type { Program } from './program.schema.js'
import { checkIntegrity } from './integrity.js'
import type { ValidationIssue } from './integrity.js'
import type { ZodError } from 'zod'

export type { ValidationIssue } from './integrity.js'

/** Which pass failed. See {@link validateProgram} for why they cannot be merged. */
export type ValidationPhase = 'shape' | 'references'

export class ProgramValidationError extends Error {
  readonly issues: ValidationIssue[]
  readonly source: string
  readonly phase: ValidationPhase

  constructor(issues: ValidationIssue[], source: string, phase: ValidationPhase = 'shape') {
    super(formatIssues(issues, source, phase))
    this.name = 'ProgramValidationError'
    this.issues = issues
    this.source = source
    this.phase = phase
  }
}

/** `['tasks', 12, 'predecessors', 0]` → `tasks[12].predecessors[0]` */
function formatPath(path: readonly (string | number | symbol)[]): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') return `${acc}[${segment}]`
    return acc === '' ? String(segment) : `${acc}.${String(segment)}`
  }, '')
}

/**
 * Recover the ID of the entity a Zod issue landed in, so the error names the
 * thing a human recognises rather than only its array index. `tasks[12]` means
 * nothing; `tasks[12] (M4.3.3)` is findable with a search.
 */
function idForPath(input: unknown, path: readonly (string | number | symbol)[]): string | undefined {
  const [collection, index] = path
  if (typeof collection !== 'string' || typeof index !== 'number') return undefined
  if (typeof input !== 'object' || input === null) return undefined

  const items = (input as Record<string, unknown>)[collection]
  if (!Array.isArray(items)) return undefined

  const entity = items[index]
  if (typeof entity !== 'object' || entity === null) return undefined

  const id = (entity as Record<string, unknown>).id
  return typeof id === 'string' ? id : undefined
}

function zodIssuesToValidationIssues(error: ZodError, input: unknown): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: formatPath(issue.path) || '(root)',
    id: idForPath(input, issue.path),
    // Zod reports a missing field as the bare word "Required", which reads as a
    // fragment rather than a problem. Say what is actually wrong.
    message:
      issue.code === 'invalid_type' && issue.received === 'undefined'
        ? 'required field is missing'
        : issue.message,
  }))
}

export function formatIssues(
  issues: ValidationIssue[],
  source: string,
  phase: ValidationPhase = 'shape',
): string {
  const count = issues.length
  const heading = `${source} — ${count} validation ${count === 1 ? 'error' : 'errors'}`

  const body = issues
    .map((issue, i) => {
      const n = String(i + 1).padStart(String(count).length, ' ')
      const where = issue.id ? `${issue.path}  (${issue.id})` : issue.path
      return `  ${n}. ${where}\n     ${issue.message}`
    })
    .join('\n\n')

  // Say plainly that this may not be the whole list. A run that reports one
  // error and then reports three more after it is fixed looks like the checker
  // is unreliable, unless it told you the second pass had not run yet.
  const footer =
    phase === 'shape'
      ? 'References (predecessors, owners, approvers, ID paths) were NOT checked — that\n' +
        'pass only runs once the shape is valid. Expect more once these are fixed.\n\n' +
        'Nothing is generated while validation fails.'
      : 'Nothing is generated while validation fails.'

  return `${heading}\n\n${body}\n\n${footer}`
}

/**
 * Validate an already-parsed object.
 *
 * Shape first, then references — if the shape is wrong there is no well-typed
 * Program to check references against, so the two passes cannot be merged. A
 * run that reports shape errors may therefore surface reference errors on the
 * next run. Both passes individually report EVERY problem they find.
 *
 * @throws {ProgramValidationError}
 */
export function validateProgram(input: unknown, source = 'program.yaml'): Program {
  const result = programSchema.safeParse(input)
  if (!result.success) {
    throw new ProgramValidationError(zodIssuesToValidationIssues(result.error, input), source)
  }

  const integrityIssues = checkIntegrity(result.data)
  if (integrityIssues.length > 0) {
    throw new ProgramValidationError(integrityIssues, source, 'references')
  }

  return result.data
}

/**
 * Parse and validate YAML source text.
 *
 * @throws {ProgramValidationError}
 */
export function validateProgramYaml(text: string, source = 'program.yaml'): Program {
  let parsed: unknown
  try {
    parsed = parseYaml(text)
  } catch (error) {
    if (error instanceof YAMLParseError) {
      const line = error.linePos?.[0]?.line
      throw new ProgramValidationError(
        [
          {
            path: line === undefined ? '(root)' : `line ${line}`,
            message: `YAML syntax error: ${error.message.split('\n')[0]}`,
          },
        ],
        source,
      )
    }
    throw error
  }

  if (parsed === null || parsed === undefined) {
    throw new ProgramValidationError([{ path: '(root)', message: 'file is empty' }], source)
  }

  return validateProgram(parsed, source)
}
