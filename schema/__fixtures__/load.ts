import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const VALID_PROGRAM = fileURLToPath(new URL('./valid-program.yaml', import.meta.url))

export function fixtureYaml(): string {
  return readFileSync(VALID_PROGRAM, 'utf8')
}

/**
 * A fresh, mutable copy of the valid fixture on every call, so a test that
 * breaks it cannot leak into the next test.
 *
 * Typed loosely on purpose: the point of most tests is to inject something the
 * schema should reject, which a correct type would forbid us from writing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadFixture(): any {
  return parse(fixtureYaml())
}
