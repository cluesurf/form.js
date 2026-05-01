/**
 * `flow.*` builder helpers.
 *
 * Helpers compose into the canonical JSON shape, byte for byte.
 * Promotion: a primitive passed where a Node is expected gets
 * wrapped automatically (`0` → integer/natural_number,
 * `'hello'` → text, `true` → boolean, `Date` → date,
 * `[...]` → list, plain object with a `form` field passes
 * through unchanged).
 */

import type {
  AttemptNode,
  BooleanNode,
  BranchNode,
  CallNode,
  CaseArm,
  CaseDefaultArm,
  CaseNode,
  CaseTestArm,
  CaseValueArm,
  DateNode,
  FieldSeg,
  IndexSeg,
  IntegerNode,
  WeaveNode,
  ListNode,
  LoopNode,
  MatchNode,
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

// ---------------------------------------------------------------------------
// Promotion
// ---------------------------------------------------------------------------

export type Promotable =
  | Node
  | string
  | number
  | boolean
  | Date
  | unknown[]

/**
 * Wrap a primitive in the matching literal flow node. If the
 * argument is already a flow node (has a `form` field), pass
 * it through unchanged.
 */
export function promote(value: Promotable): Node {
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  ) {
    if ('form' in (value as Record<string, unknown>)) {
      return value
    }
  }
  if (typeof value === 'string') return text(value)
  if (typeof value === 'boolean') return boolean(value)
  if (value instanceof Date) return date(value.toISOString())
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0
      ? naturalNumber(value)
      : Number.isInteger(value)
      ? integer(value)
      : number(value)
  }
  if (Array.isArray(value)) {
    return list(value.map(v => promote(v as Promotable)))
  }
  throw new Error(`flow.promote: unsupported value ${String(value)}`)
}

// ---------------------------------------------------------------------------
// Literals
// ---------------------------------------------------------------------------

export function text(s: string): TextNode {
  return { form: 'text', text: s }
}

export function integer(n: number): IntegerNode {
  return { form: 'integer', value: n }
}

export function naturalNumber(n: number): NaturalNumberNode {
  return { form: 'natural_number', value: n }
}

export function number(n: number): NumberNode {
  return { form: 'number', value: n }
}

export function boolean(b: boolean): BooleanNode {
  return { form: 'boolean', value: b }
}

export function date(s: string): DateNode {
  return { form: 'date', value: s }
}

export function list(items: Node[]): ListNode {
  return { form: 'list', list: items }
}

export function weave(...children: Promotable[]): WeaveNode {
  return { form: 'weave', flow: children.map(promote) }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function reference(name: string): Reference {
  return { form: 'reference', name }
}

// ----- path segments -----

export function variable(
  name: string,
  opts?: { safe?: boolean },
): VariableSeg {
  return opts?.safe
    ? { form: 'variable', name, safe: true }
    : { form: 'variable', name }
}

export function field(
  name: string,
  opts?: { safe?: boolean },
): FieldSeg {
  return opts?.safe
    ? { form: 'field', name, safe: true }
    : { form: 'field', name }
}

export function idx(
  value: number | Node,
  opts?: { safe?: boolean },
): IndexSeg {
  return opts?.safe
    ? { form: 'index', value, safe: true }
    : { form: 'index', value }
}

export function slice(
  rise?: number | Node | null,
  fall?: number | Node | null,
  opts?: { safe?: boolean },
): SliceSeg {
  const seg: SliceSeg = { form: 'slice' }
  if (rise !== undefined) seg.rise = rise
  if (fall !== undefined) seg.fall = fall
  if (opts?.safe) seg.safe = true
  return seg
}

/**
 * Build a path. First arg is the head (string → variable
 * segment by name; or a pre-built segment object). Subsequent
 * string args become field segments; segment objects pass
 * through.
 *
 * Examples:
 *   path('count')                 // → reference (single segment, normalized)
 *   path('user', 'name')          // user.name
 *   path('items', idx(0))         // items[0]
 *   path('items', slice(3, 10))   // items[3..10]
 */
export function path(
  ...segments: (string | PathSeg)[]
): Reference | PathNode {
  if (segments.length === 0) {
    throw new Error('flow.path: at least one segment required')
  }
  const built: PathSeg[] = segments.map((s, i) => {
    if (typeof s === 'string') {
      return i === 0
        ? { form: 'variable', name: s }
        : { form: 'field', name: s }
    }
    return s
  })
  // Normalize a single bare-variable to a `reference` node.
  const head = built[0]
  if (built.length === 1 && head?.form === 'variable' && !head.safe) {
    return { form: 'reference', name: head.name }
  }
  return { form: 'path', path: built }
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export function call(
  name: string,
  args?: Record<string, Promotable>,
): CallNode {
  const node: CallNode = { form: 'call', name }
  if (args) {
    for (const [k, v] of Object.entries(args)) {
      ;(node as Record<string, unknown>)[k] = promote(v)
    }
  }
  return node
}

// ----- predicates -----

export const eq = (a: Promotable, b: Promotable) => call('eq', { a, b })
export const ne = (a: Promotable, b: Promotable) => call('ne', { a, b })
export const gt = (a: Promotable, b: Promotable) => call('gt', { a, b })
export const gte = (a: Promotable, b: Promotable) =>
  call('gte', { a, b })
export const lt = (a: Promotable, b: Promotable) => call('lt', { a, b })
export const lte = (a: Promotable, b: Promotable) =>
  call('lte', { a, b })

export function inOf(
  value: Promotable,
  listOf: Promotable[],
): CallNode {
  return call('in', { value, list: listOf })
}

export function negate(value: Promotable): CallNode {
  return call('negate', { value })
}

export function and(...values: Promotable[]): CallNode {
  return call('and', { values })
}

export function or(...values: Promotable[]): CallNode {
  return call('or', { values })
}

export const isNull = (value: Promotable) => call('is-null', { value })
export const isEmpty = (value: Promotable) =>
  call('is-empty', { value })

// ----- aggregates -----

export const count = (listOf: Promotable) =>
  call('count', { list: listOf })
export const sum = (listOf: Promotable) => call('sum', { list: listOf })
export const mean = (listOf: Promotable) =>
  call('mean', { list: listOf })
export const min = (listOf: Promotable) => call('min', { list: listOf })
export const max = (listOf: Promotable) => call('max', { list: listOf })

// ----- derives -----

export const plural = (value: Promotable) => call('plural', { value })
export const length = (value: Promotable) => call('length', { value })

// ----- formatters (note: these overlap by name with literals; helpers
// below are explicit) -----

export const fmtNumber = (value: Promotable, options?: Promotable) =>
  options === undefined
    ? call('number', { value })
    : call('number', { value, options })

export const currency = (value: Promotable, code: string) =>
  call('currency', { value, code })

export const percent = (value: Promotable) => call('percent', { value })

export const fmtDate = (value: Promotable, options?: Promotable) =>
  options === undefined
    ? call('date', { value })
    : call('date', { value, options })

export const fmtTime = (value: Promotable, options?: Promotable) =>
  options === undefined
    ? call('time', { value })
    : call('time', { value, options })

export const relative = (value: Promotable, unit: string) =>
  call('relative', { value, unit })

// ---------------------------------------------------------------------------
// Control flow
// ---------------------------------------------------------------------------

export function branch(
  test: Promotable,
  thenNode: Promotable,
  fall?: Promotable,
): BranchNode {
  const node: BranchNode = {
    form: 'branch',
    test: promote(test),
    then: promote(thenNode),
  }
  if (fall !== undefined) node.fall = promote(fall)
  return node
}

export function switchOn(
  value: Promotable,
  cases: { when: Promotable; then: Promotable }[],
  fall?: Promotable,
): SwitchNode {
  const node: SwitchNode = {
    form: 'switch',
    value: promote(value),
    cases: cases.map(c => ({
      when: promote(c.when),
      then: promote(c.then),
    })),
  }
  if (fall !== undefined) node.fall = promote(fall)
  return node
}

export function match(
  branches: { test: Promotable; then: Promotable }[],
  fall?: Promotable,
): MatchNode {
  const node: MatchNode = {
    form: 'match',
    branches: branches.map(b => ({
      test: promote(b.test),
      then: promote(b.then),
    })),
  }
  if (fall !== undefined) node.fall = promote(fall)
  return node
}

// ----- case arms -----

export function valueArm(
  value: string | number | boolean,
  flow: Node[] | string,
): CaseValueArm {
  return {
    form: 'case-value',
    value,
    flow: typeof flow === 'string' ? [text(flow)] : flow,
  }
}

export function testArm(
  testCall: CallNode,
  flow: Node[] | string,
): CaseTestArm {
  return {
    form: 'case-test',
    test: testCall,
    flow: typeof flow === 'string' ? [text(flow)] : flow,
  }
}

export function otherwise(flow: Node[] | string): CaseDefaultArm {
  return {
    form: 'case-default',
    flow: typeof flow === 'string' ? [text(flow)] : flow,
  }
}

export function caseOf(test: Promotable, arms: CaseArm[]): CaseNode {
  return { form: 'case', test: promote(test), case: arms }
}

// ----- pick -----

export function pick(...values: Promotable[]): PickNode {
  return {
    form: 'pick',
    values: { form: 'list', list: values.map(promote) },
  }
}

// ----- walk / loop -----

export function walk(
  listOf: Promotable,
  hook: Promotable,
  opts?: { item?: string; index?: string },
): WalkNode {
  const node: WalkNode = {
    form: 'walk',
    list: promote(listOf),
    hook: promote(hook),
  }
  if (opts?.item) node.item = opts.item
  if (opts?.index) node.index = opts.index
  return node
}

export function loop(
  start: Promotable,
  end: Promotable,
  hook: Promotable,
  opts?: { step?: Promotable; item?: string; index?: string },
): LoopNode {
  const node: LoopNode = {
    form: 'loop',
    start: promote(start),
    end: promote(end),
    hook: promote(hook),
  }
  if (opts?.step !== undefined) node.step = promote(opts.step)
  if (opts?.item) node.item = opts.item
  if (opts?.index) node.index = opts.index
  return node
}

export function attempt(
  flow: Promotable,
  catchNode?: Promotable,
): AttemptNode {
  const node: AttemptNode = { form: 'attempt', flow: promote(flow) }
  if (catchNode !== undefined) node.catch = promote(catchNode)
  return node
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export function view(
  name: string,
  props?: Record<string, Promotable>,
  nest?: Promotable[],
): ViewNode {
  const node: ViewNode = { form: 'view', name }
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      ;(node as Record<string, unknown>)[k] = promote(v)
    }
  }
  if (nest && nest.length > 0) {
    node.nest = nest.map(promote)
  }
  return node
}

// ---------------------------------------------------------------------------
// Higher-order template helpers
// ---------------------------------------------------------------------------

/**
 * Plural switch keyed by CLDR category names.
 *
 *   pluralCases('count', { one: 'message', other: 'messages' })
 *
 * Compiles to a `case` over `plural(reference(name))` with one
 * `case-value` arm per non-`other` key plus a `case-default`
 * arm for `other`.
 */
export function pluralCases(
  refName: string,
  arms: Record<string, Node[] | string>,
): CaseNode {
  const armsList: CaseArm[] = []
  for (const [k, v] of Object.entries(arms)) {
    if (k === 'other') continue
    armsList.push(valueArm(k, v))
  }
  if ('other' in arms) {
    armsList.push(otherwise(arms.other))
  }
  return caseOf(plural(reference(refName)), armsList)
}

/**
 * Select switch keyed by literal values.
 *
 *   selectCases('gender', { male: 'Mr.', female: 'Mrs.', other: '' })
 *
 * Compiles to a `case` over `reference(name)` with one
 * `case-value` arm per non-`other` key plus a `case-default`
 * arm for `other` if present.
 */
export function selectCases(
  refName: string,
  arms: Record<string, Node[] | string>,
): CaseNode {
  const armsList: CaseArm[] = []
  for (const [k, v] of Object.entries(arms)) {
    if (k === 'other') continue
    armsList.push(valueArm(k, v))
  }
  if ('other' in arms) {
    armsList.push(otherwise(arms.other))
  }
  return caseOf(reference(refName), armsList)
}
