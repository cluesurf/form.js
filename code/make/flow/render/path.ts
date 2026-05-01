/**
 * Shared `path` evaluation. Walks typed segments, threads
 * scope, applies optional-chain (`safe`) short-circuiting.
 */

import type { Node, PathNode, PathSeg } from '../types'
import type { BaseContext } from './registry'

/**
 * Resolve a path node to its value. The renderer passes a
 * `evaluateNode` callback so nested nodes inside index/slice
 * bounds are evaluated in the same flavor (text or react).
 */
export function evaluatePath(
  node: PathNode,
  context: BaseContext,
  evaluateNode: (n: Node, context: BaseContext) => unknown,
): unknown {
  let current: unknown = undefined
  for (let i = 0; i < node.path.length; i += 1) {
    const seg = node.path[i]
    if (!seg) continue
    if (i === 0) {
      if (seg.form !== 'variable') {
        throw new Error(
          `flow.path: first segment must be a variable, got ${seg.form}`,
        )
      }
      current = context.scope.get(seg.name)
      if (seg.safe && current == null) return null
      continue
    }
    if (current == null) return null
    current = evaluateSeg(seg, current, context, evaluateNode)
    if ((seg as { safe?: boolean }).safe && current == null) return null
  }
  return current
}

function evaluateSeg(
  seg: PathSeg,
  current: unknown,
  context: BaseContext,
  evaluateNode: (n: Node, context: BaseContext) => unknown,
): unknown {
  switch (seg.form) {
    case 'variable':
      throw new Error('flow.path: variable segment only valid at head')
    case 'field':
      return (current as Record<string, unknown>)[seg.name]
    case 'index': {
      const i =
        typeof seg.value === 'number'
          ? seg.value
          : Number(evaluateNode(seg.value, context))
      if (Array.isArray(current)) {
        const j = i < 0 ? current.length + i : i
        return current[j]
      }
      return (current as Record<string, unknown>)[String(i)]
    }
    case 'slice': {
      if (!Array.isArray(current)) return current
      const rise =
        seg.rise == null
          ? 0
          : typeof seg.rise === 'number'
            ? seg.rise
            : Number(evaluateNode(seg.rise, context))
      const fall =
        seg.fall == null
          ? current.length
          : typeof seg.fall === 'number'
            ? seg.fall
            : Number(evaluateNode(seg.fall, context))
      return current.slice(rise, fall)
    }
  }
}
