/**
 * Operator lookup for the renderers.
 *
 * The flow library has no module-level mutable registry.
 * Operators (`call` handlers) are passed through the render
 * context's `hook` map — the same `HookHash` shape as
 * `Base.hook` at codegen time.
 *
 * Built-in operators live in `code/make/hook.ts` as named
 * exports; `DEFAULT_HOOK` below merges them and remaps the few
 * names that ship as kebab-case in flow trees (`is-null`, `in`)
 * but cannot be JS identifiers.
 *
 * Custom transformations register as call operators —
 *
 *   renderText(tree, {
 *     scope: makeScope(),
 *     hook: {
 *       reverse: ({ value }) =>
 *         String(value).split('').reverse().join(''),
 *     },
 *   })
 *
 * In the tree:
 *
 *   flow.call('reverse', { value: flow.reference('name') })
 *
 * Args are pre-evaluated by the walker — the hook receives
 * resolved values, never raw flow nodes.
 */

import type { Form, HookHash } from '@/form'
import * as builtIn from '../../hook'
import type { Node } from '../types'
import type { Scope } from './scope'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export type BaseCtx = {
  scope: Scope
  /**
   * Operator + task implementations. Keyed by name. Merges
   * over `DEFAULT_HOOK` at lookup time — supply only
   * additions / overrides.
   */
  hook?: HookHash
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export type CallHandler = (
  args: Record<string, unknown>,
  ctx: BaseCtx,
) => unknown

/**
 * Schema for a custom call operator. Optional. Pair with a
 * `hook` entry of the same name when codegen / validators /
 * editor inspectors need to read the args shape.
 */
export type CallEntry = {
  schema?: Form
  handler: CallHandler
}

export function getCall(
  ctx: BaseCtx,
  name: string,
): CallHandler | undefined {
  const fn = ctx.hook?.[name] ?? DEFAULT_HOOK[name]
  return fn as CallHandler | undefined
}

/**
 * Pull operator args off a `call` node, evaluating any nested
 * flow nodes via the supplied walker. Reserved keys (`form`,
 * `name`, `version`, `id`, `meta`) are stripped.
 */
export function collectCallArgs(
  node: Record<string, unknown>,
  ctx: BaseCtx,
  evaluateNode: (n: Node, ctx: BaseCtx) => unknown,
): Record<string, unknown> {
  const args: Record<string, unknown> = {}
  for (const k of Object.keys(node)) {
    if (
      k === 'form' ||
      k === 'name' ||
      k === 'version' ||
      k === 'id' ||
      k === 'meta'
    ) {
      continue
    }
    const v = node[k]
    args[k] = isNode(v) ? evaluateNode(v as Node, ctx) : v
  }
  return args
}

export function isNode(v: unknown): v is Node {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    'form' in (v as Record<string, unknown>)
  )
}

// ---------------------------------------------------------------------------
// deepEq — used by `eq` / `switch` / `case-value` matching
// ---------------------------------------------------------------------------

export function deepEq(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((x, i) => deepEq(x, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a as object)
    const bk = Object.keys(b as object)
    if (ak.length !== bk.length) return false
    return ak.every(k =>
      deepEq(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    )
  }
  return false
}

// ---------------------------------------------------------------------------
// Default operator hook
// ---------------------------------------------------------------------------

/**
 * Merge of every named export from `code/make/hook.ts`, with
 * remaps for the few kebab-case call names that show up in
 * flow trees but cannot be JS identifiers.
 */

export const DEFAULT_HOOK: HookHash = {
  ...builtIn,
  in: builtIn.inOf,
  'is-null': builtIn.isNull,
  'is-empty': builtIn.isEmpty,
}
