import { describe, it, expect } from 'vitest'
import { flow } from './index'

describe('literals', () => {
  it('text literal', () => {
    expect(flow.text('hello')).toEqual({ form: 'text', text: 'hello' })
  })

  it('integer literal', () => {
    expect(flow.integer(42)).toEqual({ form: 'integer', value: 42 })
  })

  it('natural_number literal', () => {
    expect(flow.naturalNumber(5)).toEqual({
      form: 'natural_number',
      value: 5,
    })
  })

  it('number literal', () => {
    expect(flow.number(3.14)).toEqual({ form: 'number', value: 3.14 })
  })

  it('boolean literal', () => {
    expect(flow.boolean(true)).toEqual({ form: 'boolean', value: true })
  })

  it('date literal', () => {
    expect(flow.date('2026-04-30T00:00:00Z')).toEqual({
      form: 'date',
      value: '2026-04-30T00:00:00Z',
    })
  })

  it('list literal', () => {
    expect(flow.list([flow.text('a'), flow.text('b')])).toEqual({
      form: 'list',
      list: [
        { form: 'text', text: 'a' },
        { form: 'text', text: 'b' },
      ],
    })
  })

  it('line — woven sequence', () => {
    expect(flow.weave('I am ', flow.reference('status'), '.')).toEqual({
      form: 'weave',
      flow: [
        { form: 'text', text: 'I am ' },
        { form: 'reference', name: 'status' },
        { form: 'text', text: '.' },
      ],
    })
  })
})

describe('promote', () => {
  it('promotes string to text', () => {
    expect(flow.promote('hi')).toEqual({ form: 'text', text: 'hi' })
  })

  it('promotes positive int to natural_number', () => {
    expect(flow.promote(5)).toEqual({ form: 'natural_number', value: 5 })
  })

  it('promotes negative int to integer', () => {
    expect(flow.promote(-3)).toEqual({ form: 'integer', value: -3 })
  })

  it('promotes float to number', () => {
    expect(flow.promote(3.14)).toEqual({ form: 'number', value: 3.14 })
  })

  it('promotes boolean', () => {
    expect(flow.promote(true)).toEqual({ form: 'boolean', value: true })
  })

  it('promotes Date', () => {
    const d = new Date('2026-04-30T00:00:00Z')
    expect(flow.promote(d)).toEqual({
      form: 'date',
      value: '2026-04-30T00:00:00.000Z',
    })
  })

  it('promotes array to list', () => {
    expect(flow.promote(['a', 1])).toEqual({
      form: 'list',
      list: [
        { form: 'text', text: 'a' },
        { form: 'natural_number', value: 1 },
      ],
    })
  })

  it('passes flow nodes through unchanged', () => {
    const ref = flow.reference('count')
    expect(flow.promote(ref)).toBe(ref)
  })
})

describe('reads', () => {
  it('reference (bare scope read)', () => {
    expect(flow.reference('count')).toEqual({
      form: 'reference',
      name: 'count',
    })
  })

  it('path: single segment normalizes to reference', () => {
    expect(flow.path('count')).toEqual({
      form: 'reference',
      name: 'count',
    })
  })

  it('path: nested fields', () => {
    expect(flow.path('user', 'name')).toEqual({
      form: 'path',
      path: [
        { form: 'variable', name: 'user' },
        { form: 'field', name: 'name' },
      ],
    })
  })

  it('path: with index segment', () => {
    expect(flow.path('items', flow.idx(0))).toEqual({
      form: 'path',
      path: [
        { form: 'variable', name: 'items' },
        { form: 'index', value: 0 },
      ],
    })
  })

  it('path: with slice segment', () => {
    expect(flow.path('items', flow.slice(3, 10))).toEqual({
      form: 'path',
      path: [
        { form: 'variable', name: 'items' },
        { form: 'slice', rise: 3, fall: 10 },
      ],
    })
  })

  it('path: with optional chaining (safe field)', () => {
    const tree = flow.path(
      flow.variable('user'),
      flow.field('metadata', { safe: true }),
      flow.idx(
        flow.path('some', 'thing'),
      ),
      flow.field('ready', { safe: true }),
    )
    expect(tree).toEqual({
      form: 'path',
      path: [
        { form: 'variable', name: 'user' },
        { form: 'field', name: 'metadata', safe: true },
        {
          form: 'index',
          value: {
            form: 'path',
            path: [
              { form: 'variable', name: 'some' },
              { form: 'field', name: 'thing' },
            ],
          },
        },
        { form: 'field', name: 'ready', safe: true },
      ],
    })
  })
})

describe('calls', () => {
  it('eq', () => {
    expect(flow.eq(flow.reference('status'), 'published')).toEqual({
      form: 'call',
      name: 'eq',
      a: { form: 'reference', name: 'status' },
      b: { form: 'text', text: 'published' },
    })
  })

  it('gt with promoted literal', () => {
    expect(flow.gt(flow.reference('count'), 0)).toEqual({
      form: 'call',
      name: 'gt',
      a: { form: 'reference', name: 'count' },
      b: { form: 'natural_number', value: 0 },
    })
  })

  it('and', () => {
    const result = flow.and(
      flow.gt(flow.reference('count'), 0),
      flow.lt(flow.reference('count'), 100),
    )
    expect(result.form).toBe('call')
    expect(result.name).toBe('and')
    // varargs get promoted to a `list` literal under `values`
    expect((result as unknown as { values: { form: string } }).values.form).toBe('list')
  })

  it('count', () => {
    expect(flow.count(flow.reference('items'))).toEqual({
      form: 'call',
      name: 'count',
      list: { form: 'reference', name: 'items' },
    })
  })

  it('plural', () => {
    expect(flow.plural(flow.reference('count'))).toEqual({
      form: 'call',
      name: 'plural',
      value: { form: 'reference', name: 'count' },
    })
  })
})

describe('control flow', () => {
  it('branch with string promotion', () => {
    expect(flow.branch(flow.eq(flow.reference('x'), 1), 'yes', 'no')).toEqual({
      form: 'branch',
      test: {
        form: 'call',
        name: 'eq',
        a: { form: 'reference', name: 'x' },
        b: { form: 'natural_number', value: 1 },
      },
      then: { form: 'text', text: 'yes' },
      fall: { form: 'text', text: 'no' },
    })
  })

  it('case with arm helpers', () => {
    const tree = flow.case(flow.plural(flow.reference('count')), [
      flow.value('one', 'message'),
      flow.otherwise('messages'),
    ])
    expect(tree).toEqual({
      form: 'case',
      test: {
        form: 'call',
        name: 'plural',
        value: { form: 'reference', name: 'count' },
      },
      case: [
        {
          form: 'case-value',
          value: 'one',
          flow: [{ form: 'text', text: 'message' }],
        },
        {
          form: 'case-default',
          flow: [{ form: 'text', text: 'messages' }],
        },
      ],
    })
  })

  it('walk', () => {
    const tree = flow.walk(
      flow.reference('stanzas'),
      flow.view('paragraph', undefined, [
        flow.path('item', 'translation'),
      ]),
    )
    expect(tree.form).toBe('walk')
    expect(tree.list).toEqual({ form: 'reference', name: 'stanzas' })
    expect(tree.hook).toEqual({
      form: 'view',
      name: 'paragraph',
      nest: [
        {
          form: 'path',
          path: [
            { form: 'variable', name: 'item' },
            { form: 'field', name: 'translation' },
          ],
        },
      ],
    })
  })

  it('loop', () => {
    const tree = flow.loop(1, 7, flow.reference('i'))
    expect(tree).toEqual({
      form: 'loop',
      start: { form: 'natural_number', value: 1 },
      end: { form: 'natural_number', value: 7 },
      hook: { form: 'reference', name: 'i' },
    })
  })

  it('pick — varargs to list literal under values', () => {
    const tree = flow.pick(
      flow.reference('preferred'),
      flow.reference('auto'),
      'Untitled',
    )
    expect(tree.form).toBe('pick')
    expect((tree.values as { form: string; list: unknown[] }).form).toBe('list')
  })
})

describe('views', () => {
  it('view: flat props, no bind wrapper', () => {
    expect(
      flow.view('callout', {
        variant: 'note',
        body: 'No images yet.',
      }),
    ).toEqual({
      form: 'view',
      name: 'callout',
      variant: { form: 'text', text: 'note' },
      body: { form: 'text', text: 'No images yet.' },
    })
  })

  it('view with nest children', () => {
    const tree = flow.view(
      'section',
      { title: 'Phonology' },
      [flow.view('paragraph', undefined, ['Body text.'])],
    )
    expect(tree.nest).toEqual([
      {
        form: 'view',
        name: 'paragraph',
        nest: [{ form: 'text', text: 'Body text.' }],
      },
    ])
  })
})

describe('higher-order helpers', () => {
  it('pluralCases', () => {
    const tree = flow.pluralCases('count', {
      one: 'message',
      other: 'messages',
    })
    expect(tree.form).toBe('case')
    expect(tree.case).toHaveLength(2)
    expect(tree.case[0]).toEqual({
      form: 'case-value',
      value: 'one',
      flow: [{ form: 'text', text: 'message' }],
    })
    expect(tree.case[1]).toEqual({
      form: 'case-default',
      flow: [{ form: 'text', text: 'messages' }],
    })
  })

  it('selectCases', () => {
    const tree = flow.selectCases('gender', {
      male: 'Mr.',
      female: 'Mrs.',
      other: '',
    })
    expect(tree.test).toEqual({ form: 'reference', name: 'gender' })
    expect(tree.case).toHaveLength(3)
    expect(tree.case[2]).toEqual({
      form: 'case-default',
      flow: [{ form: 'text', text: '' }],
    })
  })
})
