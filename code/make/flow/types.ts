/**
 * @cluesurf/flow type definitions.
 *
 * Every flow tree node carries a `form` discriminant. Reserved
 * metadata keys are `form`, `name`, `version`, `id`, `meta`.
 * Operator-like nodes carry their args directly at the top
 * level (no `bind:` wrapper).
 */

export type Meta = Record<string, unknown>

// ---------------------------------------------------------------------------
// Literals
// ---------------------------------------------------------------------------

export type TextNode = {
  form: 'text'
  text: string
  id?: string
  meta?: Meta
}

export type IntegerNode = {
  form: 'integer'
  value: number
  id?: string
  meta?: Meta
}

export type NaturalNumberNode = {
  form: 'natural_number'
  value: number
  id?: string
  meta?: Meta
}

export type NumberNode = {
  form: 'number'
  value: number
  id?: string
  meta?: Meta
}

export type BooleanNode = {
  form: 'boolean'
  value: boolean
  id?: string
  meta?: Meta
}

export type DateNode = {
  form: 'date'
  value: string
  id?: string
  meta?: Meta
}

export type ListNode = {
  form: 'list'
  list: Node[]
  id?: string
  meta?: Meta
}

export type WeaveNode = {
  form: 'weave'
  flow: Node[]
  id?: string
  meta?: Meta
}

export type Literal =
  | TextNode
  | IntegerNode
  | NaturalNumberNode
  | NumberNode
  | BooleanNode
  | DateNode
  | ListNode
  | WeaveNode

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type Reference = {
  form: 'reference'
  name: string
  id?: string
  meta?: Meta
}

export type VariableSeg = {
  form: 'variable'
  name: string
  safe?: boolean
}

export type FieldSeg = {
  form: 'field'
  name: string
  safe?: boolean
}

export type IndexSeg = {
  form: 'index'
  value: number | Node
  safe?: boolean
}

export type SliceSeg = {
  form: 'slice'
  rise?: number | Node | null
  fall?: number | Node | null
  safe?: boolean
}

export type PathSeg = VariableSeg | FieldSeg | IndexSeg | SliceSeg

export type PathNode = {
  form: 'path'
  path: PathSeg[]
  id?: string
  meta?: Meta
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export type CallNode = {
  form: 'call'
  name: string
  version?: number
  id?: string
  meta?: Meta
  // operator args sit flat at the top level alongside metadata
  [arg: string]: unknown
}

// ---------------------------------------------------------------------------
// Control flow
// ---------------------------------------------------------------------------

export type BranchNode = {
  form: 'branch'
  test: Node
  then: Node
  fall?: Node
  version?: number
  id?: string
  meta?: Meta
}

export type SwitchNode = {
  form: 'switch'
  value: Node
  cases: { when: Node; then: Node }[]
  fall?: Node
  version?: number
  id?: string
  meta?: Meta
}

export type MatchNode = {
  form: 'match'
  branches: { test: Node; then: Node }[]
  fall?: Node
  version?: number
  id?: string
  meta?: Meta
}

export type CaseValueArm = {
  form: 'case-value'
  value: string | number | boolean
  flow: Node[]
}

export type CaseTestArm = {
  form: 'case-test'
  test: CallNode
  flow: Node[]
}

export type CaseDefaultArm = {
  form: 'case-default'
  flow: Node[]
}

export type CaseArm = CaseValueArm | CaseTestArm | CaseDefaultArm

export type CaseNode = {
  form: 'case'
  test: Node
  case: CaseArm[]
  id?: string
  meta?: Meta
}

export type PickNode = {
  form: 'pick'
  values: Node
  version?: number
  id?: string
  meta?: Meta
}

export type WalkNode = {
  form: 'walk'
  list: Node
  item?: string
  index?: string
  hook: Node
  version?: number
  id?: string
  meta?: Meta
}

export type LoopNode = {
  form: 'loop'
  start: Node
  end: Node
  step?: Node
  item?: string
  index?: string
  hook: Node
  version?: number
  id?: string
  meta?: Meta
}

export type AttemptNode = {
  form: 'attempt'
  flow: Node
  catch?: Node
  version?: number
  id?: string
  meta?: Meta
}

export type ControlFlow =
  | BranchNode
  | SwitchNode
  | MatchNode
  | CaseNode
  | PickNode
  | WalkNode
  | LoopNode
  | AttemptNode

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export type ViewNode = {
  form: 'view'
  name: string
  version?: number
  id?: string
  meta?: Meta
  nest?: Node[]
  // typed props sit flat at the top level
  [prop: string]: unknown
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type Node =
  | Literal
  | Reference
  | PathNode
  | CallNode
  | ControlFlow
  | ViewNode

// ---------------------------------------------------------------------------
// Reserved keys
// ---------------------------------------------------------------------------

/**
 * Keys that are metadata or structural on operator-like nodes.
 * Anything else at the top level of a `view` or `call` is a
 * user-defined prop / arg.
 */
export const RESERVED_NODE_KEYS = new Set<string>([
  'form',
  'name',
  'version',
  'id',
  'meta',
])
