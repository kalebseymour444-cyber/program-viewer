#!/usr/bin/env tsx
/**
 * `npm run validate` — check program.yaml and say nothing useful is wrong.
 *
 * Exit 0 on success, 1 on any failure. The generator (phase 4) and the CI
 * pipeline (SPEC §7) both gate on this: nothing is generated, built or
 * deployed from a program model that does not validate.
 */

import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { ProgramValidationError, validateProgramYaml } from '../schema/validate.js'

const DEFAULT_SOURCE = 'program.yaml'

function main(argv: string[]): number {
  const target = argv[2] ?? DEFAULT_SOURCE
  const absolute = resolve(process.cwd(), target)
  const label = relative(process.cwd(), absolute).replace(/\\/g, '/') || target

  let text: string
  try {
    text = readFileSync(absolute, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`${label} not found.`)
      if (target === DEFAULT_SOURCE) {
        console.error(
          '\nprogram.yaml is the single hand-edited source of truth. It is produced in\n' +
            'phase 2 by `scripts/import-markdown.ts` from the legacy content in\n' +
            'datahall-bringup/, then reviewed by a human. It does not exist yet.\n' +
            '\nTo validate something else meanwhile:\n' +
            '  npm run validate -- schema/__fixtures__/valid-program.yaml',
        )
      }
      return 1
    }
    throw error
  }

  try {
    const program = validateProgramYaml(text, label)
    const gates = program.tasks.filter((t) => t.gate).length
    const external = program.tasks.filter((t) => t.external).length

    console.log(`${label} is valid.`)
    console.log(
      `  ${program.milestones.length} milestones · ${program.packages.length} packages · ` +
        `${program.tasks.length} tasks · ${program.roles.length} roles`,
    )
    console.log(`  ${gates} gates · ${external} externally controlled`)
    console.log(
      '\nNote: dependency cycles are NOT checked here — that arrives with the graph\n' +
        'layer in phase 3. A valid file may still contain one.',
    )
    return 0
  } catch (error) {
    if (error instanceof ProgramValidationError) {
      console.error(error.message)
      return 1
    }
    throw error
  }
}

process.exit(main(process.argv))
