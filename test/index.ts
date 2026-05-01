import * as MESH from './form'
import * as test from './test'
import * as TASK from './task'
import makeTree from '../code/make'
import type { CastHash, HookHash } from '../code/form'
import fs from 'fs'
import path from 'path'

const NAME = {
  html_div_element: 'HTMLDivElement',
}

/**
 * Demonstrates `cast`: override the built-in `like` → output
 * mappings. `keyword` is a project-specific brand for `string`
 * — it has no built-in mapping, so without the override the
 * codegen falls back to `z.instanceof(Keyword)` (broken). The
 * override threads `keyword` through as plain string in both
 * the TS output and the zod parser.
 */

const CAST: CastHash = {
  form: { keyword: 'string' },
  take: { keyword: 'z.string()' },
}

// `hook`: per-task implementations sourced from `task.ts`,
// which re-exports every `<name>/task.ts` in this project. Each
// function's input is typed with the codegen output for the
// matching task's `take` shape, so call sites are fully
// type-checked against the schema.

const HOOK: HookHash = TASK

make()

async function make() {
  const tree = await makeTree({
    name: NAME,
    mesh: { ...MESH, ...test },
    link: { ...MESH, ...test },
    cast: CAST,
    hook: HOOK,
    testLink: '~/test/test',
    codeLink: '.',
  })

  for (const name in tree.form) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.form[name] as string)
  }

  for (const name in tree.take) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.take[name] as string)
  }

  for (const name in tree.base) {
    const link = name.replace('~', '.')
    const base = path.dirname(link)
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(`${link}.ts`, tree.base[name] as string)
  }
}

// console.log(
//   convertObjectKeyCase(
//     {
//       FooBar: {
//         helloWorld: true,
//       },
//     },
//     'snakeCase',
//   ),
// )

// console.log(
//   convertObjectKeyCase(
//     {
//       foo_bar: {
//         hello_world: true,
//       },
//     },
//     'camelCase',
//   ),
// )
