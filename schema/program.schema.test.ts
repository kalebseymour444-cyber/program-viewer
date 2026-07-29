import { describe, expect, it } from 'vitest'
import { loadFixture, fixtureYaml } from './__fixtures__/load.js'
import {
  ProgramValidationError,
  validateProgram,
  validateProgramYaml,
  type ValidationIssue,
} from './validate.js'

/** Runs `fn`, asserts it failed validation, and hands back every issue it reported. */
function issuesFrom(fn: () => unknown): ValidationIssue[] {
  try {
    fn()
  } catch (error) {
    if (error instanceof ProgramValidationError) return error.issues
    throw error
  }
  throw new Error('expected validation to fail, but it passed')
}

const messages = (issues: ValidationIssue[]) => issues.map((i) => i.message).join('\n')

/** Replace the first task matching `id` with a patched version. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchTask(doc: any, id: string, patch: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = doc.tasks.find((t: any) => t.id === id)
  if (!task) throw new Error(`fixture has no task ${id} — test is out of date`)
  Object.assign(task, patch)
  return task
}

describe('the valid fixture', () => {
  it('validates', () => {
    expect(() => validateProgramYaml(fixtureYaml(), 'valid-program.yaml')).not.toThrow()
  })

  it('has the shape the tests below assume', () => {
    const program = validateProgram(loadFixture())
    expect(program.roles).toHaveLength(5)
    expect(program.milestones).toHaveLength(3)
    expect(program.packages).toHaveLength(5)
    expect(program.tasks).toHaveLength(13)
  })

  it('is not domain-specific — it is a publishing program, not a data hall', () => {
    // Guards SPEC §9. If someone makes the schema depend on data-centre
    // vocabulary, this fixture stops validating.
    const program = validateProgram(loadFixture())
    expect(program.program.id).toBe('field-guide-2e')
    expect(program.roles.map((r) => r.id)).toEqual(['ED', 'DES', 'PRT', 'MKT', 'LEG'])
  })
})

describe('duration (D1, D4)', () => {
  const durationOf = (id: string) => {
    const program = validateProgram(loadFixture())
    return program.tasks.find((t) => t.id === id)?.duration
  }

  it('normalises the bare-number shorthand to a range', () => {
    expect(durationOf('M1.1.2')).toEqual({ min: 8, max: 8 })
  })

  it('preserves an authored range', () => {
    expect(durationOf('M1.1.1')).toEqual({ min: 10, max: 15 })
  })

  it('leaves an absent duration absent rather than defaulting it to zero', () => {
    // D4: absent means zero-length for path arithmetic, but the field itself
    // must stay undefined so the UI can render "—" and not "0d".
    expect(durationOf('M1.2.2')).toBeUndefined()
  })

  it('rejects min greater than max', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.1.1', { duration: { min: 15, max: 10 } })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/min must be less than or equal/)
  })

  it('accepts min equal to max', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.1.1', { duration: { min: 4, max: 4 } })
    expect(() => validateProgram(doc)).not.toThrow()
  })

  it('rejects a negative duration', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.1.1', { duration: { min: -1, max: 5 } })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects a fractional duration', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.1.1', { duration: { min: 1.5, max: 5 } })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects an unknown key inside duration', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.1.1', { duration: { min: 1, max: 5, likely: 3 } })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })
})

describe('defaults', () => {
  it('applies them so an omitted field never means something different from its default', () => {
    const program = validateProgram(loadFixture())

    // M2.1.1 omits gate, status and external.
    const authored = program.tasks.find((t) => t.id === 'M2.1.1')!
    expect(authored.gate).toBe(false)
    expect(authored.status).toBe('NOT_STARTED')
    expect(authored.external).toBe(false)

    // M1.1.1 omits predecessors — a root, not a task with unknown edges.
    const root = program.tasks.find((t) => t.id === 'M1.1.1')!
    expect(root.predecessors).toEqual([])
  })
})

describe('strictness', () => {
  it('rejects an unrecognised key rather than ignoring it', () => {
    // The failure this prevents: `predecessor:` instead of `predecessors:`
    // silently dropping every edge on the task, which then looks entirely
    // plausible in the graph while being wrong.
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { predecessor: ['M1.1.3'] })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/[Uu]nrecognized key/)
  })

  it('rejects `owner` singular, which was the pre-D2 spelling', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M2.1.1', { owner: 'DES' })
    delete task.owners
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects `gate` authored on a milestone (D7 — gate is a task property)', () => {
    // A gate flag on a rollup is a second claim to truth about the same fact.
    const doc = loadFixture()
    doc.milestones[0].gate = true
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/[Uu]nrecognized key/)
  })

  it('rejects `gate` authored on a package (D7)', () => {
    const doc = loadFixture()
    doc.packages[0].gate = true
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/[Uu]nrecognized key/)
  })

  it('rejects an authored duration on a package, which must be derived', () => {
    const doc = loadFixture()
    doc.packages[0].duration = { min: 1, max: 2 }
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects authored predecessors on a milestone, which must roll up from tasks', () => {
    const doc = loadFixture()
    doc.milestones[1].predecessors = ['M1']
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })
})

describe('identifier grammar', () => {
  it('rejects a task ID with too few segments', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { id: 'M2.1' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/task ID/)
  })

  it('rejects a task ID with too many segments', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { id: 'M2.1.1.4' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/task ID/)
  })

  it('rejects a package ID used where a task ID belongs', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { predecessors: ['M1.1'] })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/task ID/)
  })

  it('rejects a milestone ID containing a dot', () => {
    const doc = loadFixture()
    doc.milestones[0].id = 'M1.0'
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/milestone ID/)
  })

  it('does not require the "M" prefix — the ID scheme is the program\'s, not the model\'s', () => {
    // SPEC §9: nothing domain-specific hardcoded. A program may number its
    // milestones however it likes, as long as IDs carry their path.
    const doc = loadFixture()
    doc.milestones[2].id = 'LAUNCH'
    doc.packages[4].id = 'LAUNCH.1'
    doc.packages[4].milestone = 'LAUNCH'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const task of doc.tasks as any[]) {
      if (typeof task.id === 'string' && task.id.startsWith('M3.1')) {
        task.id = task.id.replace('M3.1', 'LAUNCH.1')
        task.package = 'LAUNCH.1'
      }
      if (Array.isArray(task.predecessors)) {
        task.predecessors = task.predecessors.map((p: string) => p.replace('M3.1', 'LAUNCH.1'))
      }
    }
    expect(() => validateProgram(doc)).not.toThrow()
  })
})

describe('enumerations', () => {
  it('rejects an unknown task type', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { type: 'ADMIN' })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects an unknown status', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { status: 'ON_TRACK' })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects the space-separated status spelling used in the legacy markdown', () => {
    // conventions.md writes `NOT STARTED`; the schema is `NOT_STARTED`.
    // The importer has to translate, and this is what catches it if it doesn't.
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { status: 'NOT STARTED' })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })
})

describe('gates must be evidenced, not asserted', () => {
  it('rejects a gate with no criterion', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M1.1.3', {})
    delete task.criterion
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/gate requires both/)
  })

  it('rejects a gate with no evidence', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M1.1.3', {})
    delete task.evidence
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/gate requires both/)
  })

  it('allows a non-gate task to omit both', () => {
    const program = validateProgram(loadFixture())
    const task = program.tasks.find((t) => t.id === 'M2.1.1')!
    expect(task.gate).toBe(false)
    expect(task.criterion).toBeUndefined()
  })
})

describe('aging cannot be hidden (D6)', () => {
  it('requires status_since when a task is AT_RISK', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M1.2.2', {})
    delete task.status_since
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/status_since` is required/)
  })

  it('requires status_since when a task is BLOCKED', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M2.2.3', {})
    delete task.status_since
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/status_since` is required/)
  })

  it('does not require status_since for IN_PROGRESS', () => {
    const doc = loadFixture()
    const task = patchTask(doc, 'M1.1.2', {})
    delete task.status_since
    expect(() => validateProgram(doc)).not.toThrow()
  })

  it('does not require status_since for NOT_STARTED, where days-in-state is meaningless', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { status: 'NOT_STARTED' })
    expect(() => validateProgram(doc)).not.toThrow()
  })

  it('rejects a status_since that is not a real calendar date', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.2.2', { status_since: '2026-02-30' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/not a real calendar date/)
  })

  it('rejects a non-ISO date format', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.2.2', { status_since: '30/06/2026' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/ISO calendar date/)
  })

  it('accepts a Date, since a YAML loader may hand back a parsed timestamp', () => {
    const doc = loadFixture()
    patchTask(doc, 'M1.2.2', { status_since: new Date('2026-06-30T00:00:00Z') })
    const program = validateProgram(doc)
    expect(program.tasks.find((t) => t.id === 'M1.2.2')?.status_since).toBe('2026-06-30')
  })
})

describe('predecessors', () => {
  it('rejects a task that is its own predecessor', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { predecessors: ['M1.1.3', 'M2.1.1'] })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/cannot be its own predecessor/)
  })

  it('rejects duplicate predecessors', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { predecessors: ['M1.1.3', 'M1.1.3'] })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/duplicate entries/)
  })
})

describe('owners (D2)', () => {
  it('accepts two owners on a HYB task', () => {
    const program = validateProgram(loadFixture())
    expect(program.tasks.find((t) => t.id === 'M2.1.3')?.owners).toEqual(['DES', 'PRT'])
  })

  it('rejects an empty owners list', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { owners: [] })
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })
})

describe('required collections', () => {
  it.each(['roles', 'milestones', 'packages', 'tasks'])('rejects an empty %s list', (key) => {
    const doc = loadFixture()
    doc[key] = []
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })

  it('rejects a missing program block', () => {
    const doc = loadFixture()
    delete doc.program
    expect(issuesFrom(() => validateProgram(doc))).not.toHaveLength(0)
  })
})

describe('YAML handling', () => {
  it('reports a syntax error with a line number instead of a stack trace', () => {
    const issues = issuesFrom(() =>
      validateProgramYaml('program:\n  id: x\nroles: [ {id: ED', 'broken.yaml'),
    )
    expect(issues[0]!.message).toMatch(/YAML syntax error/)
    expect(issues[0]!.path).toMatch(/line \d+/)
  })

  it('reports an empty file plainly', () => {
    expect(messages(issuesFrom(() => validateProgramYaml('', 'empty.yaml')))).toMatch(/file is empty/)
  })
})

describe('error reporting', () => {
  it('names the file, the location, and the offending ID', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { type: 'ADMIN' })

    let message = ''
    try {
      validateProgram(doc, 'program.yaml')
    } catch (error) {
      message = (error as Error).message
    }

    expect(message).toContain('program.yaml')
    expect(message).toContain('tasks[')
    expect(message).toContain('M2.1.1')
  })

  it('says references were not checked when the shape failed, so the count is not mistaken for the total', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { type: 'ADMIN' })

    try {
      validateProgram(doc, 'program.yaml')
      throw new Error('expected validation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ProgramValidationError)
      const err = error as ProgramValidationError
      expect(err.phase).toBe('shape')
      expect(err.message).toMatch(/References .* were NOT checked/s)
    }
  })

  it('does not claim references are unchecked when they are what failed', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { predecessors: ['M1.1.9'] })

    try {
      validateProgram(doc, 'program.yaml')
      throw new Error('expected validation to fail')
    } catch (error) {
      const err = error as ProgramValidationError
      expect(err.phase).toBe('references')
      expect(err.message).not.toMatch(/were NOT checked/)
    }
  })

  it('reports every problem at once, not just the first', () => {
    const doc = loadFixture()
    patchTask(doc, 'M2.1.1', { type: 'ADMIN' })
    patchTask(doc, 'M2.1.2', { status: 'ON_TRACK' })
    patchTask(doc, 'M3.1.1', { owners: [] })

    expect(issuesFrom(() => validateProgram(doc)).length).toBeGreaterThanOrEqual(3)
  })
})
