/**
 * React renderer.
 *
 * Walks a flow tree and produces React nodes. Dispatches
 * `view` to a component registry passed via `ctx.viewRegistry`
 * (or a global default). Calls and computed values still
 * resolve through the same operator registry.
 *
 * The two renderers share scope, path resolution, and the
 * call registry. They differ in:
 *   - the output type of `evaluate` (here `unknown`, but
 *     `walk` flattens into `ReactNode` for renderable nodes)
 *   - how literals are emitted (here as React text nodes,
 *     which is just the string value)
 *   - how `view` is handled (dispatches to a registered
 *     component; falls back to a generic JSX element if no
 *     handler is registered)
 */

import {
  type ComponentType,
  Fragment,
  type ReactElement,
  type ReactNode,
  createElement,
} from 'react'
import type {
  CallNode,
  CaseArm,
  CaseNode,
  CaseValueArm,
  Node,
  ViewNode,
} from '../types'
import { evaluatePath } from './path'
import {
  collectCallArgs,
  deepEq,
  getCall,
  getForm,
  isNode,
  type BaseCtx,
} from './registry'
import type { Scope } from './scope'

/**
 * Per-render React context. `viewHook` maps `view` node names
 * to React components. Same per-context-only pattern as
 * `hook` and `formHook` — no module-level mutable registry.
 */
export type ReactCtx = BaseCtx & {
  viewHook?: Record<string, ComponentType<Record<string, unknown>>>
}

function getView(
  ctx: ReactCtx,
  name: string,
): ComponentType<Record<string, unknown>> | undefined {
  return ctx.viewHook?.[name]
}

/**
 * Render a flow node to a React node.
 */
export function renderReact(node: Node, ctx: ReactCtx): ReactNode {
  return walkReact(node, ctx)
}

function walkReact(node: Node, ctx: ReactCtx): ReactNode {
  // Custom forms registered via `registerForm` win over the
  // built-in dispatch.
  const customForm = getForm(ctx, node.form)
  if (customForm) {
    return customForm(node, ctx, walkReact as (n: Node, c: BaseCtx) => unknown) as ReactNode
  }

  switch (node.form) {
    // ----- literals — emit as React text nodes -----
    case 'text':
      return node.text
    case 'integer':
    case 'natural_number':
    case 'number':
    case 'boolean':
    case 'date':
      return String(node.value)
    case 'list':
      return createElement(
        Fragment,
        null,
        ...node.list.map((n, i) => withKey(walkReact(n, ctx), i)),
      )
    case 'weave':
      return createElement(
        Fragment,
        null,
        ...node.flow.map((n, i) => withKey(walkReact(n, ctx), i)),
      )

    // ----- reads — resolve to value, coerce to ReactNode -----
    case 'reference':
      return toReactNode(ctx.scope.get(node.name))
    case 'path':
      return toReactNode(evaluatePath(node, ctx, walkValue))

    // ----- calls — resolve to value, coerce -----
    case 'call':
      return toReactNode(evaluateCall(node, ctx))

    // ----- control flow -----
    case 'branch': {
      const t = walkValue(node.test, ctx)
      if (t) return walkReact(node.then, ctx)
      return node.fall === undefined ? null : walkReact(node.fall, ctx)
    }
    case 'switch': {
      const v = walkValue(node.value, ctx)
      for (const arm of node.cases) {
        if (deepEq(walkValue(arm.when, ctx), v)) {
          return walkReact(arm.then, ctx)
        }
      }
      return node.fall === undefined ? null : walkReact(node.fall, ctx)
    }
    case 'match': {
      for (const branch of node.branches) {
        if (walkValue(branch.test, ctx)) {
          return walkReact(branch.then, ctx)
        }
      }
      return node.fall === undefined ? null : walkReact(node.fall, ctx)
    }
    case 'case':
      return walkCase(node, ctx)
    case 'pick': {
      const values = walkValue(node.values, ctx)
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v != null) return toReactNode(v)
        }
      }
      return null
    }
    case 'walk': {
      const list = walkValue(node.list, ctx) as
        | unknown[]
        | null
        | undefined
      if (!Array.isArray(list)) return null
      const itemName = node.item ?? 'item'
      const indexName = node.index ?? 'index'
      const out: ReactNode[] = []
      for (let i = 0; i < list.length; i += 1) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = list[i]
        frame[indexName] = i
        const inner: ReactCtx = {
          ...ctx,
          scope: ctx.scope.push(frame),
        }
        out.push(withKey(walkReact(node.hook, inner), i))
      }
      return createElement(Fragment, null, ...out)
    }
    case 'loop': {
      const start = Number(walkValue(node.start, ctx))
      const end = Number(walkValue(node.end, ctx))
      const step =
        node.step === undefined ? 1 : Number(walkValue(node.step, ctx))
      const itemName = node.item ?? 'i'
      const indexName = node.index ?? 'index'
      const out: ReactNode[] = []
      let idx = 0
      for (let n = start; step > 0 ? n < end : n > end; n += step) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = n
        frame[indexName] = idx
        const inner: ReactCtx = {
          ...ctx,
          scope: ctx.scope.push(frame),
        }
        out.push(withKey(walkReact(node.hook, inner), idx))
        idx += 1
      }
      return createElement(Fragment, null, ...out)
    }
    case 'attempt': {
      try {
        return walkReact(node.flow, ctx)
      } catch {
        return node.catch === undefined
          ? null
          : walkReact(node.catch, ctx)
      }
    }

    // ----- views — dispatch to registered component -----
    case 'view':
      return walkView(node, ctx)
  }

  throw new Error(
    `flow.renderReact: unknown form '${
      (node as Node & { form: string }).form
    }'`,
  )
}

// ---------------------------------------------------------------------------
// Value walker — used inside paths, predicates, branch tests
// ---------------------------------------------------------------------------

function walkValue(node: Node, ctx: ReactCtx): unknown {
  switch (node.form) {
    case 'text':
      return node.text
    case 'integer':
    case 'natural_number':
    case 'number':
    case 'boolean':
    case 'date':
      return node.value
    case 'list':
      return node.list.map(n => walkValue(n, ctx))
    case 'weave':
      return node.flow.map(n => walkValue(n, ctx)).join('')
    case 'reference':
      return ctx.scope.get(node.name)
    case 'path':
      return evaluatePath(node, ctx, walkValue)
    case 'call':
      return evaluateCall(node, ctx)
    default:
      // For control-flow / views in a value position, fall back
      // to the React walker and stringify.
      return walkReact(node, ctx)
  }
}

// ---------------------------------------------------------------------------
// View dispatch
// ---------------------------------------------------------------------------

function walkView(node: ViewNode, ctx: ReactCtx): ReactElement {
  const Comp = getView(ctx, node.name)

  // Resolve flat props.
  const props: Record<string, unknown> = {}
  for (const k of Object.keys(node)) {
    if (
      k === 'form' ||
      k === 'name' ||
      k === 'version' ||
      k === 'id' ||
      k === 'meta' ||
      k === 'nest'
    ) {
      continue
    }
    const v = (node as Record<string, unknown>)[k]
    props[k] = isNode(v) ? walkValue(v, ctx) : v
  }

  // Resolve nest children.
  const children: ReactNode[] = (node.nest ?? []).map((n, i) =>
    withKey(walkReact(n, ctx), i),
  )

  if (Comp) {
    return createElement(Comp, props, ...children)
  }

  // No component registered for this view name — fall back to a
  // raw intrinsic element so prototyping doesn't need a registry.
  return createElement(node.name, props, ...children)
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

function walkCase(node: CaseNode, ctx: ReactCtx): ReactNode {
  const subject = walkValue(node.test, ctx)
  for (const arm of node.case) {
    if (matchArm(arm, subject, ctx)) {
      return createElement(
        Fragment,
        null,
        ...arm.flow.map((n, i) => withKey(walkReact(n, ctx), i)),
      )
    }
  }
  return null
}

function matchArm(
  arm: CaseArm,
  subject: unknown,
  ctx: ReactCtx,
): boolean {
  switch (arm.form) {
    case 'case-value':
      return deepEq((arm as CaseValueArm).value, subject)
    case 'case-test':
      return Boolean(evaluateCallWithSubject(arm.test, subject, ctx))
    case 'case-default':
      return true
  }
}

// ---------------------------------------------------------------------------
// Call helpers
// ---------------------------------------------------------------------------

function evaluateCall(node: CallNode, ctx: ReactCtx): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, ctx, walkValue)
  return handler(args, ctx)
}

function evaluateCallWithSubject(
  node: CallNode,
  subject: unknown,
  ctx: ReactCtx,
): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, ctx, walkValue)
  if (args.subject === undefined) args.subject = subject
  return handler(args, ctx)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toReactNode(value: unknown): ReactNode {
  if (value == null) return null
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }
  return String(value)
}

function withKey(node: ReactNode, key: number): ReactNode {
  if (
    node !== null &&
    typeof node === 'object' &&
    'type' in (node as unknown as Record<string, unknown>) &&
    !(
      'key' in (node as unknown as Record<string, unknown>) &&
      (node as unknown as { key: unknown }).key !== null
    )
  ) {
    return { ...(node as ReactElement), key: String(key) } as ReactNode
  }
  return node
}

export type { Scope }
