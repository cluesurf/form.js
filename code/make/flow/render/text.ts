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
  type BaseContext,
} from './registry'
import { type Scope } from './scope'

export type TextContext = BaseContext

/**
 * Render a flow node to a string.
 */
export function renderText(node: Node, context: TextContext): string {
  const value = evaluateText(node, context)
  return value == null ? '' : String(value)
}

/**
 * Evaluate a flow node to a JS value (for the text-side
 * walker). Most consumers want `renderText` instead.
 */
export function evaluateText(node: Node, context: TextContext): unknown {
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
      return node.list.map(n => evaluateText(n, context))
    case 'weave':
      return node.flow.map(n => renderText(n, context)).join('')

    // ----- reads -----
    case 'reference':
      return context.scope.get(node.name)
    case 'path':
      return evaluatePath(node, context, evaluateText)

    // ----- calls -----
    case 'call':
      return evaluateCall(node, context)

    // ----- control flow -----
    case 'branch': {
      const t = evaluateText(node.test, context)
      if (t) return evaluateText(node.then, context)
      return node.fall === undefined ? null : evaluateText(node.fall, context)
    }
    case 'switch': {
      const v = evaluateText(node.value, context)
      for (const arm of node.cases) {
        if (deepEq(evaluateText(arm.when, context), v)) {
          return evaluateText(arm.then, context)
        }
      }
      return node.fall === undefined ? null : evaluateText(node.fall, context)
    }
    case 'match': {
      for (const branch of node.branches) {
        if (evaluateText(branch.test, context)) {
          return evaluateText(branch.then, context)
        }
      }
      return node.fall === undefined ? null : evaluateText(node.fall, context)
    }
    case 'case':
      return evaluateCase(node, context)
    case 'pick': {
      const values = evaluateText(node.values, context)
      if (Array.isArray(values)) {
        for (const v of values) {
          if (v != null) return v
        }
      }
      return null
    }
    case 'walk': {
      const list = evaluateText(node.list, context) as
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
        const inner: TextContext = { ...context, scope: context.scope.push(frame) }
        out.push(renderText(node.hook, inner))
      }
      return out.join('')
    }
    case 'loop': {
      const start = Number(evaluateText(node.start, context))
      const end = Number(evaluateText(node.end, context))
      const step =
        node.step === undefined ? 1 : Number(evaluateText(node.step, context))
      const itemName = node.item ?? 'i'
      const indexName = node.index ?? 'index'
      const out: string[] = []
      let idx = 0
      for (let n = start; step > 0 ? n < end : n > end; n += step) {
        const frame: Record<string, unknown> = {}
        frame[itemName] = n
        frame[indexName] = idx
        const inner: TextContext = { ...context, scope: context.scope.push(frame) }
        out.push(renderText(node.hook, inner))
        idx += 1
      }
      return out.join('')
    }
    case 'attempt': {
      try {
        return evaluateText(node.flow, context)
      } catch {
        return node.catch === undefined
          ? ''
          : evaluateText(node.catch, context)
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

function evaluateCase(node: CaseNode, context: TextContext): unknown {
  const subject = evaluateText(node.test, context)
  for (const arm of node.case) {
    if (matchArm(arm, subject, context)) {
      return arm.flow.map(n => renderText(n, context)).join('')
    }
  }
  return ''
}

function matchArm(
  arm: CaseArm,
  subject: unknown,
  context: TextContext,
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
// Calls
// ---------------------------------------------------------------------------

function evaluateCall(node: CallNode, context: TextContext): unknown {
  const handler = getCall(context, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, context, evaluateText)
  return handler(args, context)
}

function evaluateCallWithSubject(
  node: CallNode,
  subject: unknown,
  context: TextContext,
): unknown {
  const handler = getCall(context, node.name)
  if (!handler) {
    throw new Error(`flow.call: unknown operator '${node.name}'`)
  }
  const args = collectCallArgs(node, context, evaluateText)
  if (args.subject === undefined) args.subject = subject
  return handler(args, context)
}

// Re-export the Scope type for convenience.
export type { Scope }
