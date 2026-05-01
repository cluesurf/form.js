/**
 * Compatibility re-export. The renderer lives in `./render/`
 * split between text and React. Direct imports from this file
 * are deprecated — import from `./render` (or the `flow`
 * namespace) instead.
 */

export {
  evaluateText as evaluate,
  evaluateText,
  makeScope,
  renderText as render,
  renderText,
} from './render/index'

export type {
  BaseContext,
  Scope,
  TextContext,
  TextContext as RenderCtx,
} from './render/index'
