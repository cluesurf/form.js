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
 *  - calls `context.builder(type, props, ...children)` for `view`
 *    nodes (and for the implicit fragment wrappers around
 *    `weave`, `list`, `walk`, `loop`, `case`)
 *  - reads view components from `context.component[name]`
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
  type BaseContext,
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
export type ElementContext<T = unknown, C = unknown> = BaseContext & {
  builder: ElementBuilder<T>
  fragment?: unknown
  component?: Record<string, C>
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function renderElement<T = unknown, C = unknown>(
  node: Node,
  context: ElementContext<T, C>,
): T | string | null {
  return walkElement(node, context) as T | string | null
}

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

function walkElement(node: Node, context: ElementContext): unknown {
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
        context,
        node.list.map((n, i) => keyed(walkElement(n, context), i)),
      )
    case 'weave':
      return wrapFragment(
        context,
        node.flow.map((n, i) => keyed(walkElement(n, context), i)),
      )

    // ----- reads -----
    case 'reference':
      return toElementChild(context.scope.get(node.name))
    case 'path':
      return toElementChild(
        evaluatePath(
          node,
          context,
          walkValue as (n: Node, c: BaseContext) => unknown,
        ),
      )

    // ----- calls -----
    case 'call':
      return toElementChild(evaluateCall(node, context))

    // ----- control flow -----
    case 'branch': {
      const t = walkValue(node.test, context)
      if (t) return walkElement(node.then, context)
      return node.fall === undefined ? null : walkElement(node.fall, context)
    }
    case 'switch': {
      const v = walkValue(node.value, context)
      for (const arm of node.cases) {
        if (deepEq(walkValue(arm.when, context), v)) {
          return walkElement(arm.then, context)
        }
      }
      return node.fall === undefined ? null : walkElement(node.fall, context)
    }
    case 'match': {
      for (const branch of node.branches) {
        if (walkValue(branch.test, context)) {
          return walkElement(branch.then, context)
        }
      }
      return node.fall === undefined ? null : walkElement(node.fall, context)
    }
    case 'case':
      return walkCase(node, context)
    case 'pick': {
      const values = walkValue(node.values, context)
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v != null) return toElementChild(v)
        }
      }
      return null
    }
    case 'walk': {
      const list = walkValue(node.list, context) as
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
        const inner: ElementContext = {
          ...context,
          scope: context.scope.push(frame),
        }
        out.push(keyed(walkElement(node.hook, inner), i))
      }
      return wrapFragment(context, out)
    }
    case 'loop': {
      const start = Number(walkValue(node.start, context))
      const end = Number(walkValue(node.end, context))
      const step =
        node.step === undefined ? 1 : Number(walkValue(node.step, context))
      const itemName = node.item ?? 'i'
      const indexName = node.index ?? 'index'
      const out: unknown[] = []
      let idx = 0
      for (let n = start; step > 0 ? n < end : n > end; n += step) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = n
        frame[indexName] = idx
        const inner: ElementContext = {
          ...context,
          scope: context.scope.push(frame),
        }
        out.push(keyed(walkElement(node.hook, inner), idx))
        idx += 1
      }
      return wrapFragment(context, out)
    }
    case 'attempt': {
      try {
        return walkElement(node.flow, context)
      } catch {
        return node.catch === undefined
          ? null
          : walkElement(node.catch, context)
      }
    }

    // ----- views -----
    case 'view':
      return walkView(node, context)
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

function walkValue(node: Node, context: ElementContext): unknown {
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
      return node.list.map(n => walkValue(n, context))
    case 'weave':
      return node.flow.map(n => walkValue(n, context)).join('')
    case 'reference':
      return context.scope.get(node.name)
    case 'path':
      return evaluatePath(
        node,
        context,
        walkValue as (n: Node, c: BaseContext) => unknown,
      )
    case 'call':
      return evaluateCall(node, context)
    default:
      // For control-flow / views in a value position, fall back
      // to the element walker.
      return walkElement(node, context)
  }
}

// ---------------------------------------------------------------------------
// View dispatch
// ---------------------------------------------------------------------------

function walkView(node: ViewNode, context: ElementContext): unknown {
  const type = context.component?.[node.name] ?? node.name

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
    props[k] = isNode(v) ? walkValue(v, context) : v
  }

  // Resolve nest children.
  const children = (node.nest ?? []).map((n, i) =>
    keyed(walkElement(n, context), i),
  )

  return context.builder(type, props, ...children)
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

function walkCase(node: CaseNode, context: ElementContext): unknown {
  const subject = walkValue(node.test, context)
  for (const arm of node.case) {
    if (matchArm(arm, subject, context)) {
      return wrapFragment(
        context,
        arm.flow.map((n, i) => keyed(walkElement(n, context), i)),
      )
    }
  }
  return null
}

function matchArm(
  arm: CaseArm,
  subject: unknown,
  context: ElementContext,
): boolean {
  switch (arm.form) {
    case 'case-value':
      return deepEq((arm as CaseValueArm).value, subject)
    case 'case-test':
      return Boolean(evaluateCallWithSubject(arm.test, subject, context))
    case 'case-default':
      return true
  }
}

// ---------------------------------------------------------------------------
// Call helpers
// ---------------------------------------------------------------------------

function evaluateCall(node: CallNode, context: ElementContext): unknown {
  const handler = getCall(context, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(
    node,
    context,
    walkValue as (n: Node, c: BaseContext) => unknown,
  )
  return handler(args, context)
}

function evaluateCallWithSubject(
  node: CallNode,
  subject: unknown,
  context: ElementContext,
): unknown {
  const handler = getCall(context, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(
    node,
    context,
    walkValue as (n: Node, c: BaseContext) => unknown,
  )
  if (args.subject === undefined) args.subject = subject
  return handler(args, context)
}

// ---------------------------------------------------------------------------
// Fragment + key helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a children array as a single result. If `context.fragment`
 * is provided, build a real fragment element. Otherwise return
 * the array as-is — most vdom libraries accept arrays directly
 * as a child slot.
 */
function wrapFragment(context: ElementContext, children: unknown[]): unknown {
  if (context.fragment !== undefined) {
    return context.builder(context.fragment, null, ...children)
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
