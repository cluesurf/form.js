/**
 * Element renderer — vdom-agnostic.
 *
 * Walks a flow tree and produces element nodes for whichever
 * vdom you pass in (React, Preact, h-script, anything with the
 * `(type, props, ...children) => element` shape).
 *
 *   import { renderElement } from '@cluesurf/form/make/flow/render/element'
 *   import { createElement, Fragment } from 'react'
 *
 *   renderElement(tree, {
 *     scope: flow.scope(),
 *     builder: createElement,
 *     fragment: Fragment,
 *     component: { callout: Callout },
 *   })
 *
 * For Preact:
 *
 *   import { h, Fragment } from 'preact'
 *   renderElement(tree, { scope, builder: h, fragment: Fragment, ... })
 *
 * The renderer:
 *
 *  - calls `ctx.builder(type, props, ...children)` for `view`
 *    nodes (and for the implicit fragment wrappers around
 *    `weave`, `list`, `walk`, `loop`, `case`)
 *  - reads view components from `ctx.component[name]`
 *  - falls back to the bare view name as the element type when
 *    no component is registered (e.g. `'div'`)
 *  - threads `key` in via props for list children
 *
 * Calls and computed values resolve through the same `hook`
 * registry the text renderer uses.
 */

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
  isNode,
  type BaseCtx,
} from './registry'
import type { Scope } from './scope'

export type ElementBuilder<T> = (
  type: unknown,
  props: Record<string, unknown> | null,
  ...children: unknown[]
) => T

/**
 * Per-render context for an element-producing renderer.
 *
 *  - `builder` is the vdom factory (`React.createElement`,
 *    `h`, etc.). Required.
 *  - `fragment` is the value the builder accepts as a fragment
 *    marker. Optional; if absent, the renderer flattens
 *    fragment slots into arrays, which most vdom libraries
 *    accept directly as a child.
 *  - `component` maps `view` node names to whatever the
 *    builder accepts as a `type` (a component reference,
 *    usually).
 */
export type ElementCtx<T = unknown, C = unknown> = BaseCtx & {
  builder: ElementBuilder<T>
  fragment?: unknown
  component?: Record<string, C>
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function renderElement<T = unknown, C = unknown>(
  node: Node,
  ctx: ElementCtx<T, C>,
): T | string | null {
  return walkElement(node, ctx) as T | string | null
}

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

function walkElement(node: Node, ctx: ElementCtx): unknown {
  switch (node.form) {
    // ----- literals -----
    case 'text':
      return node.text
    case 'integer':
    case 'natural_number':
    case 'number':
    case 'boolean':
    case 'date':
      return String(node.value)
    case 'list':
      return wrapFragment(
        ctx,
        node.list.map((n, i) => keyed(walkElement(n, ctx), i)),
      )
    case 'weave':
      return wrapFragment(
        ctx,
        node.flow.map((n, i) => keyed(walkElement(n, ctx), i)),
      )

    // ----- reads -----
    case 'reference':
      return toElementChild(ctx.scope.get(node.name))
    case 'path':
      return toElementChild(
        evaluatePath(
          node,
          ctx,
          walkValue as (n: Node, c: BaseCtx) => unknown,
        ),
      )

    // ----- calls -----
    case 'call':
      return toElementChild(evaluateCall(node, ctx))

    // ----- control flow -----
    case 'branch': {
      const t = walkValue(node.test, ctx)
      if (t) return walkElement(node.then, ctx)
      return node.fall === undefined ? null : walkElement(node.fall, ctx)
    }
    case 'switch': {
      const v = walkValue(node.value, ctx)
      for (const arm of node.cases) {
        if (deepEq(walkValue(arm.when, ctx), v)) {
          return walkElement(arm.then, ctx)
        }
      }
      return node.fall === undefined ? null : walkElement(node.fall, ctx)
    }
    case 'match': {
      for (const branch of node.branches) {
        if (walkValue(branch.test, ctx)) {
          return walkElement(branch.then, ctx)
        }
      }
      return node.fall === undefined ? null : walkElement(node.fall, ctx)
    }
    case 'case':
      return walkCase(node, ctx)
    case 'pick': {
      const values = walkValue(node.values, ctx)
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v != null) return toElementChild(v)
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
      const out: unknown[] = []
      for (let i = 0; i < list.length; i += 1) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = list[i]
        frame[indexName] = i
        const inner: ElementCtx = {
          ...ctx,
          scope: ctx.scope.push(frame),
        }
        out.push(keyed(walkElement(node.hook, inner), i))
      }
      return wrapFragment(ctx, out)
    }
    case 'loop': {
      const start = Number(walkValue(node.start, ctx))
      const end = Number(walkValue(node.end, ctx))
      const step =
        node.step === undefined ? 1 : Number(walkValue(node.step, ctx))
      const itemName = node.item ?? 'i'
      const indexName = node.index ?? 'index'
      const out: unknown[] = []
      let idx = 0
      for (let n = start; step > 0 ? n < end : n > end; n += step) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = n
        frame[indexName] = idx
        const inner: ElementCtx = {
          ...ctx,
          scope: ctx.scope.push(frame),
        }
        out.push(keyed(walkElement(node.hook, inner), idx))
        idx += 1
      }
      return wrapFragment(ctx, out)
    }
    case 'attempt': {
      try {
        return walkElement(node.flow, ctx)
      } catch {
        return node.catch === undefined
          ? null
          : walkElement(node.catch, ctx)
      }
    }

    // ----- views -----
    case 'view':
      return walkView(node, ctx)
  }

  throw new Error(
    `flow.renderElement: unknown form '${
      (node as Node & { form: string }).form
    }'`,
  )
}

// ---------------------------------------------------------------------------
// Value walker — used inside paths, predicates, branch tests
// ---------------------------------------------------------------------------

function walkValue(node: Node, ctx: ElementCtx): unknown {
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
      return evaluatePath(
        node,
        ctx,
        walkValue as (n: Node, c: BaseCtx) => unknown,
      )
    case 'call':
      return evaluateCall(node, ctx)
    default:
      // For control-flow / views in a value position, fall back
      // to the element walker.
      return walkElement(node, ctx)
  }
}

// ---------------------------------------------------------------------------
// View dispatch
// ---------------------------------------------------------------------------

function walkView(node: ViewNode, ctx: ElementCtx): unknown {
  const type = ctx.component?.[node.name] ?? node.name

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
  const children = (node.nest ?? []).map((n, i) =>
    keyed(walkElement(n, ctx), i),
  )

  return ctx.builder(type, props, ...children)
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

function walkCase(node: CaseNode, ctx: ElementCtx): unknown {
  const subject = walkValue(node.test, ctx)
  for (const arm of node.case) {
    if (matchArm(arm, subject, ctx)) {
      return wrapFragment(
        ctx,
        arm.flow.map((n, i) => keyed(walkElement(n, ctx), i)),
      )
    }
  }
  return null
}

function matchArm(
  arm: CaseArm,
  subject: unknown,
  ctx: ElementCtx,
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

function evaluateCall(node: CallNode, ctx: ElementCtx): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(
    node,
    ctx,
    walkValue as (n: Node, c: BaseCtx) => unknown,
  )
  return handler(args, ctx)
}

function evaluateCallWithSubject(
  node: CallNode,
  subject: unknown,
  ctx: ElementCtx,
): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(
    node,
    ctx,
    walkValue as (n: Node, c: BaseCtx) => unknown,
  )
  if (args.subject === undefined) args.subject = subject
  return handler(args, ctx)
}

// ---------------------------------------------------------------------------
// Fragment + key helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a children array as a single result. If `ctx.fragment`
 * is provided, build a real fragment element. Otherwise return
 * the array as-is — most vdom libraries accept arrays directly
 * as a child slot.
 */
function wrapFragment(ctx: ElementCtx, children: unknown[]): unknown {
  if (ctx.fragment !== undefined) {
    return ctx.builder(ctx.fragment, null, ...children)
  }
  return children
}

/**
 * If `child` is an element with a settable `key` slot, give it
 * a stable string key. Plain values pass through unchanged.
 *
 * Most vdoms (React, Preact) accept `key` as a special prop set
 * at creation time — that path is taken in `walkView` /
 * fragment construction. This helper is a fallback for elements
 * that came back from a custom form handler.
 */
function keyed(child: unknown, key: number): unknown {
  if (
    child !== null &&
    typeof child === 'object' &&
    'type' in (child as Record<string, unknown>) &&
    !(
      'key' in (child as Record<string, unknown>) &&
      (child as { key: unknown }).key != null
    )
  ) {
    return { ...(child as Record<string, unknown>), key: String(key) }
  }
  return child
}

function toElementChild(value: unknown): unknown {
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

export type { Scope }
