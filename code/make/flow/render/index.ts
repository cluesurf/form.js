/**
 * Renderer surface (text only).
 *
 * The React renderer lives at `../react` as a separate entry
 * point so `react` stays an optional peer dep rather than
 * forcing every form.js consumer to install it.
 *
 *   import { flow } from '@cluesurf/form'              // text + builders
 *   import { renderReact } from '@cluesurf/form/make/flow/render/react'
 */

export type { Scope } from './scope'
export { makeScope } from './scope'

export type {
  BaseCtx,
  CallEntry,
  CallHandler,
} from './registry'
export {
  DEFAULT_HOOK,
  deepEq,
  getCall,
  isNode,
} from './registry'

export type { TextCtx } from './text'
export { evaluateText, renderText } from './text'
