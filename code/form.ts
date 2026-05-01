import { RefinementCtx } from 'zod'
import type { Node as FlowNode } from './make/flow/types'

export type Load = Base & {
  testLink: string
  codeLink: string
}

export type FormBond = string | number | boolean | null

export type FormBase = {
  form: 'form'
  save: string
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormBaseCase = FormBase & {
  case: FormLike[]
}

export type FormLike = {
  like: string
  test?: (bond: any, link?: any) => boolean
  note?: string
}

export type FormLikeCase = {
  case: FormLike[]
}

export type FormBaseFuse = FormBase & {
  fuse: FormLike[]
}

export type FormBaseLink = FormBase & {
  base?: string
  link: LinkMesh
  name?: string
  make?: string
  leak?: boolean
  load?: string[]
}

export type Form = FormBaseCase | FormBaseFuse | FormBaseLink

export type BaseHash = Record<
  string,
  Form | Hash | List | Test | Make | Task | Flow
>

export type NameHash = Record<string, string>

/**
 * Map of name → implementation function. Two consumers:
 *
 * - `Base.hook` at codegen time, where each entry implements a
 *   declared `Task` and the `input` is the task's `take` shape.
 *
 * - The flow render context (`BaseContext.hook`), where each entry
 *   implements a `call` operator and may receive a second
 *   `context` argument (locale, scope) — built-ins like `plural`
 *   and `currency` use it.
 *
 * Loose at this layer; call sites narrow to the exact input
 * record type.
 */
export type HookHash = Record<string, (input: any, context?: any) => any>

/**
 * Codegen overrides for the built-in `like` → output mappings.
 *
 * - `form` overrides TypeScript type emission. Each value is the
 *   raw TS type expression to emit when a field has the matching
 *   `like` (e.g. `{ keyword: 'string' }` makes
 *   `like: 'keyword'` render as `string` in `index.ts`).
 *
 * - `take` overrides zod parser emission. Each value is the raw
 *   zod expression (e.g. `{ keyword: 'z.string()' }` makes
 *   `like: 'keyword'` render as `z.string()` in `take.ts`).
 *
 * Built-in mappings (`string`, `boolean`, `integer`,
 * `natural_number`, `decimal`, `number`, `uuid`, `timestamp`,
 * `date`, `array_buffer`, `blob`, `json`) ship by default.
 * Entries here merge over the defaults — supply only the names
 * you want to add or change.
 */
export type CastHash = {
  form?: Record<string, string>
  take?: Record<string, string>
}

export type Base = {
  mesh: BaseHash
  link: BaseHash
  name: NameHash
  hook?: HookHash
  cast?: CastHash
}

export type LinkMesh = Record<string, FormLink>

export type FormLink = {
  head?: string
  note?: string
  back?: string
  base?: string
  fall?: any
  bind?: FormBond | Record<string, FormBond> | FormBond[]
  fill?: boolean
  hold?: boolean
  like?: string
  case?: Record<string, FormLink> | FormLink[]
  fuse?: FormLink[]
  bond?: FormLink
  link?: LinkMesh
  list?: boolean
  name?: {
    base?: string // database name
    mark?: string // cli short name
  }
  need?: boolean
  size?:
    | number
    | {
        fall?: number
        fall_meet?: number
        rise?: number
        rise_meet?: number
      }
  take?: any[]
  test?: string
  trim?: boolean
  load?: boolean
}

export type Hash = {
  form: 'hash'
  save: string
  hash: Record<string, any>
  link?: string
  bond: FormLike | FormLikeCase
  load?: boolean
}

export type List = {
  form: 'list'
  save: string
  list: any[]
  load?: boolean
}

export type Test = {
  form: 'test'
  save: string
  test: (bond: any, name: string) => boolean | string | TestBack
}

export type Make = {
  form: 'make'
  save: string
  make: (bond: any, context: RefinementCtx, name: string) => any
}

/**
 * A `Task` describes a function. `take` declares the input
 * parameters (same shape as `form.link`). `like` names the
 * output form (a string referring to another schema entry).
 *
 * Codegen emits the input record TS type and zod parser for
 * `take`. Implementations are wired through `Base.hook`.
 */
export type Task = {
  form: 'task'
  save: string
  take: LinkMesh
  like: string
  note?: string
}

/**
 * A `Flow` describes a renderable tree with declared inputs.
 * It's the unified shape behind both i18n templates (rendered
 * to a string via `renderText`) and dynamic component trees
 * (rendered to React via `renderReact`).
 *
 *  - `link` declares the call params (same shape as
 *    `form.link`).
 *  - `flow` is the array of nodes the renderer walks. Same
 *    `Node` union for both renderers — only the renderer's
 *    output type changes.
 *
 * Codegen emits the input record TS type and zod parser for
 * `link`. The `flow` payload is data evaluated at render time
 * by `@cluesurf/form/make/flow`.
 */
export type Flow = {
  form: 'flow'
  save: string
  link: LinkMesh
  flow: FlowNode[]
  note?: string
}

export type TestBack = {
  message?: string
  path?: string[]
  params?: any
}
