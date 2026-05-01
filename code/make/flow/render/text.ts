/**
 * Text renderer.
 *
 * Walks a flow tree and produces a string. Used for
 * localization templates, computed labels, status strings,
 * any place a flow tree should resolve to text.
 *
 * Views render as `[view:<name>]` placeholders here — render
 * a flow tree that contains views with the React renderer
 * instead.
 */

import type {
  CallNode,
  CaseArm,
  CaseNode,
  CaseValueArm,
  Node,
} from '../types'
import { evaluatePath } from './path'
import {
  collectCallArgs,
  deepEq,
  getCall,
  type BaseCtx,
} from './registry'
import { type Scope } from './scope'

export type TextCtx = BaseCtx

/**
 * Render a flow node to a string.
 */
export function renderText(node: Node, ctx: TextCtx): string {
  const value = evaluateText(node, ctx)
  return value == null ? '' : String(value)
}

/**
 * Evaluate a flow node to a JS value (for the text-side
 * walker). Most consumers want `renderText` instead.
 */
export function evaluateText(node: Node, ctx: TextCtx): unknown {
  switch (node.form) {
    // ----- literals -----
    case 'text':
      return node.text
    case 'integer':
    case 'natural_number':
    case 'number':
    case 'boolean':
    case 'date':
      return node.value
    case 'list':
      return node.list.map(n => evaluateText(n, ctx))
    case 'weave':
      return node.flow.map(n => renderText(n, ctx)).join('')

    // ----- reads -----
    case 'reference':
      return ctx.scope.get(node.name)
    case 'path':
      return evaluatePath(node, ctx, evaluateText)

    // ----- calls -----
    case 'call':
      return evaluateCall(node, ctx)

    // ----- control flow -----
    case 'branch': {
      const t = evaluateText(node.test, ctx)
      if (t) return evaluateText(node.then, ctx)
      return node.fall === undefined ? null : evaluateText(node.fall, ctx)
    }
    case 'switch': {
      const v = evaluateText(node.value, ctx)
      for (const arm of node.cases) {
        if (deepEq(evaluateText(arm.when, ctx), v)) {
          return evaluateText(arm.then, ctx)
        }
      }
      return node.fall === undefined ? null : evaluateText(node.fall, ctx)
    }
    case 'match': {
      for (const branch of node.branches) {
        if (evaluateText(branch.test, ctx)) {
          return evaluateText(branch.then, ctx)
        }
      }
      return node.fall === undefined ? null : evaluateText(node.fall, ctx)
    }
    case 'case':
      return evaluateCase(node, ctx)
    case 'pick': {
      const values = evaluateText(node.values, ctx)
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v != null) return v
        }
      }
      return null
    }
    case 'walk': {
      const list = evaluateText(node.list, ctx) as
        | unknown[]
        | null
        | undefined
      if (!Array.isArray(list)) return ''
      const itemName = node.item ?? 'item'
      const indexName = node.index ?? 'index'
      const out: string[] = []
      for (let i = 0; i < list.length; i += 1) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = list[i]
        frame[indexName] = i
        const inner: TextCtx = { ...ctx, scope: ctx.scope.push(frame) }
        out.push(renderText(node.hook, inner))
      }
      return out.join('')
    }
    case 'loop': {
      const start = Number(evaluateText(node.start, ctx))
      const end = Number(evaluateText(node.end, ctx))
      const step =
        node.step === undefined ? 1 : Number(evaluateText(node.step, ctx))
      const itemName = node.item ?? 'i'
      const indexName = node.index ?? 'index'
      const out: string[] = []
      let idx = 0
      for (let n = start; step > 0 ? n < end : n > end; n += step) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = n
        frame[indexName] = idx
        const inner: TextCtx = { ...ctx, scope: ctx.scope.push(frame) }
        out.push(renderText(node.hook, inner))
        idx += 1
      }
      return out.join('')
    }
    case 'attempt': {
      try {
        return evaluateText(node.flow, ctx)
      } catch {
        return node.catch === undefined
          ? ''
          : evaluateText(node.catch, ctx)
      }
    }

    // ----- views (placeholder in text mode) -----
    case 'view':
      return `[view:${node.name}]`
  }

  throw new Error(
    `flow.renderText: unknown form '${
      (node as Node & { form: string }).form
    }'`,
  )
}

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

function evaluateCase(node: CaseNode, ctx: TextCtx): unknown {
  const subject = evaluateText(node.test, ctx)
  for (const arm of node.case) {
    if (matchArm(arm, subject, ctx)) {
      return arm.flow.map(n => renderText(n, ctx)).join('')
    }
  }
  return ''
}

function matchArm(
  arm: CaseArm,
  subject: unknown,
  ctx: TextCtx,
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
// Calls
// ---------------------------------------------------------------------------

function evaluateCall(node: CallNode, ctx: TextCtx): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, ctx, evaluateText)
  return handler(args, ctx)
}

function evaluateCallWithSubject(
  node: CallNode,
  subject: unknown,
  ctx: TextCtx,
): unknown {
  const handler = getCall(ctx, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, ctx, evaluateText)
  if (args.subject === undefined) args.subject = subject
  return handler(args, ctx)
}

// Re-export the Scope type for convenience.
export type { Scope }
