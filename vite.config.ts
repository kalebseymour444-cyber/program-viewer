// `vitest/config` rather than `vite` so the `test` block below type-checks.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages serves a project site from /<repo-name>/, so the bundle needs a
 * matching base path. It is read from the environment rather than hardcoded:
 * the repo name is deployment configuration, not something the code should
 * know, and hardcoding it is one of the ways this site would break silently
 * when forked or renamed.
 *
 * The deploy workflow sets it from the repository name automatically.
 * Locally it defaults to '/', so `npm run dev` needs no configuration.
 */
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // The whole point is a graph the reader can interrogate; a source map is
    // worth more than a slightly smaller artifact on a site with no secrets.
    sourcemap: true,
  },
  test: {
    globals: false,
    include: [
      'src/**/*.test.{ts,tsx}',
      'schema/**/*.test.ts',
      'graph/**/*.test.ts',
      'scripts/**/*.test.ts',
    ],
    // Node by default: the schema, graph and generator suites read fixtures off
    // disk, and under jsdom `import.meta.url` is an http URL that fileURLToPath
    // rejects. Component tests opt in with `// @vitest-environment jsdom`.
    environment: 'node',
  },
})
