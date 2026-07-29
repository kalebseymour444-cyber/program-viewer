import { describe, expect, it } from 'vitest'
import { loadFixture } from './__fixtures__/load.js'
import { ProgramValidationError, validateProgram, type ValidationIssue } from './validate.js'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function task(doc: any, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found = doc.tasks.find((t: any) => t.id === id)
  if (!found) throw new Error(`fixture has no task ${id} — test is out of date`)
  return found
}

describe('references must resolve', () => {
  it('rejects a predecessor that does not exist', () => {
    const doc = loadFixture()
    task(doc, 'M2.1.1').predecessors = ['M1.1.9']
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /predecessor "M1\.1\.9" does not exist/,
    )
  })

  it('rejects a task owner that is not in the roles registry', () => {
    const doc = loadFixture()
    task(doc, 'M2.1.1').owners = ['NOBODY']
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /owner "NOBODY" is not in the roles registry/,
    )
  })

  it('rejects a package owner that is not in the roles registry', () => {
    const doc = loadFixture()
    doc.packages[0].owners = ['NOBODY']
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/not in the roles registry/)
  })

  it('rejects an approver that is not in the roles registry', () => {
    const doc = loadFixture()
    doc.milestones[0].approver = 'NOBODY'
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /approver "NOBODY" is not in the roles registry/,
    )
  })

  it('rejects a package pointing at a milestone that does not exist', () => {
    const doc = loadFixture()
    doc.packages[0].id = 'M9.1'
    doc.packages[0].milestone = 'M9'
    // keep the package's tasks attached so this reports the milestone, not an orphan
    for (const t of doc.tasks) {
      if (t.package === 'M1.1') {
        t.package = 'M9.1'
        t.id = t.id.replace('M1.1', 'M9.1')
      }
    }
    for (const t of doc.tasks) {
      t.predecessors = (t.predecessors ?? []).map((p: string) => p.replace('M1.1', 'M9.1'))
    }
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /milestone "M9" does not exist/,
    )
  })

  it('rejects a task pointing at a package that does not exist', () => {
    const doc = loadFixture()
    const t = task(doc, 'M2.1.1')
    t.id = 'M2.9.1'
    t.package = 'M2.9'
    for (const other of doc.tasks) {
      other.predecessors = (other.predecessors ?? []).filter((p: string) => p !== 'M2.1.1')
    }
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/package "M2\.9" does not exist/)
  })
})

describe('an ID must carry its own path upward', () => {
  // conventions.md: "M4.3.2 is unambiguously task 2 of work package 3 of
  // milestone 4. This is what makes traversal mechanical." If the ID and the
  // parent field disagree, every breadcrumb on screen contradicts the data.

  it('rejects a task whose ID says one package but is filed under another', () => {
    const doc = loadFixture()
    task(doc, 'M2.1.1').package = 'M2.2'
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /ID says this task belongs to package "M2\.1", but it is filed under "M2\.2"/,
    )
  })

  it('rejects a package whose ID says one milestone but is filed under another', () => {
    const doc = loadFixture()
    doc.packages[0].milestone = 'M2'
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(
      /ID says this package belongs to milestone "M1", but it is filed under "M2"/,
    )
  })
})

describe('IDs are permanent and never reused', () => {
  it('rejects a duplicate task ID', () => {
    const doc = loadFixture()
    doc.tasks.push({ ...task(doc, 'M2.1.1'), name: 'A second thing with the same name' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/duplicate ID/)
  })

  it('rejects a duplicate role ID', () => {
    const doc = loadFixture()
    doc.roles.push({ id: 'ED', name: 'Editorial, again' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/duplicate ID/)
  })

  it('rejects a duplicate package ID', () => {
    const doc = loadFixture()
    doc.packages.push({ ...doc.packages[0], name: 'Duplicate' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/duplicate ID/)
  })

  it('points at the earlier occurrence so both can be found', () => {
    const doc = loadFixture()
    doc.roles.push({ id: 'ED', name: 'Editorial, again' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/already used by roles\[0\]/)
  })
})

describe('nothing may be empty that has to roll up', () => {
  it('rejects a milestone with no packages', () => {
    const doc = loadFixture()
    doc.milestones.push({ id: 'M4', name: 'Nothing beneath it', approver: 'ED' })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/milestone has no packages/)
  })

  it('rejects a package with no tasks', () => {
    const doc = loadFixture()
    doc.packages.push({ id: 'M3.2', milestone: 'M3', name: 'Empty', type: 'DOC', owners: ['MKT'] })
    expect(messages(issuesFrom(() => validateProgram(doc)))).toMatch(/package has no tasks/)
  })
})

describe('reporting', () => {
  it('reports every reference failure at once, not just the first', () => {
    const doc = loadFixture()
    task(doc, 'M2.1.1').predecessors = ['M1.1.9']
    task(doc, 'M2.1.2').owners = ['NOBODY']
    doc.milestones[0].approver = 'ALSO_NOBODY'

    expect(issuesFrom(() => validateProgram(doc)).length).toBeGreaterThanOrEqual(3)
  })

  it('attaches the offending entity ID to the issue', () => {
    const doc = loadFixture()
    task(doc, 'M2.1.1').predecessors = ['M1.1.9']

    const issue = issuesFrom(() => validateProgram(doc)).find((i) => i.message.includes('M1.1.9'))
    expect(issue?.id).toBe('M2.1.1')
    expect(issue?.path).toMatch(/^tasks\[\d+\]\.predecessors\[0\]$/)
  })
})

describe('what integrity deliberately does not check', () => {
  it('does not reject a cycle — that is phase 3, and it needs the graph layer', () => {
    // Documenting the boundary so a later reader does not assume validation
    // already caught this. SPEC §7 requires the BUILD to fail on a cycle; that
    // check lands with the topological sort.
    const doc = loadFixture()
    task(doc, 'M1.1.1').predecessors = ['M1.1.2']
    expect(() => validateProgram(doc)).not.toThrow()
  })

  it('allows an externally-controlled task to have predecessors', () => {
    // D5 makes `external: true` mean "the interval is not ours", not "no
    // predecessors". Permitting is external and still follows route survey.
    const doc = loadFixture()
    expect(task(doc, 'M1.2.2').external).toBe(true)
    expect(task(doc, 'M1.2.2').predecessors).toEqual(['M1.2.1'])
    expect(() => validateProgram(doc)).not.toThrow()
  })

  it('allows a role in the registry that nothing uses', () => {
    const doc = loadFixture()
    doc.roles.push({ id: 'IDX', name: 'Indexer' })
    expect(() => validateProgram(doc)).not.toThrow()
  })
})
