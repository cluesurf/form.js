/**
 * @cluesurf/flow — a unified AST for values, computations,
 * control flow, templates, and views.
 *
 * Spec: note/library/flow/.
 *
 * The `flow` namespace export bundles every builder helper
 * and renderer entry under one import:
 *
 *   import { flow } from '@cluesurf/form'
 *   const tree = flow.branch(flow.gt(flow.path('count'), 0), ...)
 *   const out = flow.renderText(tree, { scope: flow.scope({ count: 5 }) })
 *
 * Extension via the render context:
 *
 *   flow.renderText(tree, {
 *     scope: flow.scope({ count: 5 }),
 *     hook: { reverse: ({ value }) => String(value).split('').reverse().join('') },
 *     formHook: { upper: (node, ctx, walk) => ... },
 *   })
 *
 * `hook` is the same `HookHash` used by `Base.hook` at codegen
 * time — a single name → function table covers built-in
 * operators, custom call operators, and task implementations.
 */

import * as builders from './build'
import { evaluateText, makeScope, renderText } from './render/index'

export type {
  AttemptNode,
  BooleanNode,
  BranchNode,
  CallNode,
  CaseArm,
  CaseDefaultArm,
  CaseNode,
  CaseTestArm,
  CaseValueArm,
  ControlFlow,
  DateNode,
  FieldSeg,
  IndexSeg,
  IntegerNode,
  WeaveNode,
  ListNode,
  Literal,
  LoopNode,
  MatchNode,
  Meta,
  NaturalNumberNode,
  Node,
  NumberNode,
  PathNode,
  PathSeg,
  PickNode,
  Reference,
  SliceSeg,
  SwitchNode,
  TextNode,
  VariableSeg,
  ViewNode,
  WalkNode,
} from './types'

export { RESERVED_NODE_KEYS } from './types'

export type { Promotable } from './build'

export type {
  BaseCtx,
  CallEntry,
  CallHandler,
  FormEntry,
  FormHandler,
  Scope,
  TextCtx,
} from './render/index'

export {
  DEFAULT_HOOK,
  deepEq,
  evaluateText,
  getCall,
  getForm,
  isNode,
  makeScope,
  renderText,
} from './render/index'

export type { ReactCtx } from './render/react'

export const flow = {
  // promotion
  promote: builders.promote,

  // literals
  text: builders.text,
  integer: builders.integer,
  naturalNumber: builders.naturalNumber,
  number: builders.number,
  boolean: builders.boolean,
  date: builders.date,
  list: builders.list,
  weave: builders.weave,

  // reads
  reference: builders.reference,
  path: builders.path,
  variable: builders.variable,
  field: builders.field,
  idx: builders.idx,
  slice: builders.slice,

  // calls
  call: builders.call,
  eq: builders.eq,
  ne: builders.ne,
  gt: builders.gt,
  gte: builders.gte,
  lt: builders.lt,
  lte: builders.lte,
  in: builders.inOf,
  negate: builders.negate,
  and: builders.and,
  or: builders.or,
  isNull: builders.isNull,
  isEmpty: builders.isEmpty,
  count: builders.count,
  sum: builders.sum,
  mean: builders.mean,
  min: builders.min,
  max: builders.max,
  plural: builders.plural,
  length: builders.length,
  fmtNumber: builders.fmtNumber,
  currency: builders.currency,
  percent: builders.percent,
  fmtDate: builders.fmtDate,
  fmtTime: builders.fmtTime,
  relative: builders.relative,

  // control flow
  branch: builders.branch,
  switch: builders.switchOn,
  match: builders.match,
  case: builders.caseOf,
  value: builders.valueArm,
  test: builders.testArm,
  otherwise: builders.otherwise,
  pick: builders.pick,
  walk: builders.walk,
  loop: builders.loop,
  attempt: builders.attempt,

  // views
  view: builders.view,

  // higher-order
  pluralCases: builders.pluralCases,
  selectCases: builders.selectCases,

  // evaluation
  scope: makeScope,
  renderText,
  evaluate: evaluateText,

  // back-compat alias
  render: renderText,
} as const
