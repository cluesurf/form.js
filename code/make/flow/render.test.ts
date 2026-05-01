import { describe, it, expect } from 'vitest'
import { flow, makeScope } from './index'

describe('literal rendering', () => {
  it('renders text', () => {
    expect(flow.render(flow.text('hello'), { scope: makeScope() })).toBe('hello')
  })

  it('renders integer', () => {
    expect(flow.render(flow.integer(42), { scope: makeScope() })).toBe('42')
  })

  it('renders boolean', () => {
    expect(flow.render(flow.boolean(true), { scope: makeScope() })).toBe('true')
  })

  it('list literal evaluates to a JS array', () => {
    const tree = flow.list([flow.text('a'), flow.text('b'), flow.text('c')])
    expect(flow.evaluate(tree, { scope: makeScope() })).toEqual(['a', 'b', 'c'])
  })

  it('renders line as woven sequence', () => {
    const tree = flow.weave('I am ', flow.reference('status'), '.')
    const out = flow.render(tree, {
      scope: makeScope({ status: 'fine' }),
    })
    expect(out).toBe('I am fine.')
  })
})

describe('reference and path rendering', () => {
  it('reads a reference from scope', () => {
    const scope = makeScope({ name: 'Lance' })
    expect(flow.render(flow.reference('name'), { scope })).toBe('Lance')
  })

  it('walks a nested path', () => {
    const scope = makeScope({ user: { name: 'Lance' } })
    const tree = flow.path('user', 'name')
    expect(flow.render(tree, { scope })).toBe('Lance')
  })

  it('indexes a list', () => {
    const scope = makeScope({ items: ['apple', 'banana', 'cherry'] })
    const tree = flow.path('items', flow.idx(1))
    expect(flow.render(tree, { scope })).toBe('banana')
  })

  it('negative index counts from the end', () => {
    const scope = makeScope({ items: ['a', 'b', 'c'] })
    expect(flow.render(flow.path('items', flow.idx(-1)), { scope })).toBe('c')
  })

  it('slice', () => {
    const scope = makeScope({ items: [1, 2, 3, 4, 5] })
    const result = flow.evaluate(flow.path('items', flow.slice(1, 4)), { scope })
    expect(result).toEqual([2, 3, 4])
  })

  it('slice with negative bounds counts from the end', () => {
    const scope = makeScope({ items: [1, 2, 3, 4, 5] })
    const result = flow.evaluate(
      flow.path('items', flow.slice(-3, -1)),
      { scope },
    )
    expect(result).toEqual([3, 4])
  })

  it('slice with only a negative tail bound', () => {
    const scope = makeScope({ items: [1, 2, 3, 4, 5] })
    const result = flow.evaluate(
      flow.path('items', flow.slice(undefined, -2)),
      { scope },
    )
    expect(result).toEqual([1, 2, 3])
  })

  it('safe index short-circuits when intermediate is null', () => {
    const scope = makeScope({ user: null })
    const tree = flow.path(
      flow.variable('user'),
      flow.field('items', { safe: true }),
      flow.idx(0, { safe: true }),
    )
    expect(flow.evaluate(tree, { scope })).toBeNull()
  })

  it('safe index short-circuits on out-of-bounds lookup', () => {
    const scope = makeScope({ items: [] })
    const tree = flow.path(
      flow.variable('items'),
      flow.idx(0, { safe: true }),
      flow.field('name', { safe: true }),
    )
    expect(flow.evaluate(tree, { scope })).toBeNull()
  })

  it('non-safe index out-of-bounds returns undefined (no chain protection)', () => {
    const scope = makeScope({ items: [] })
    const tree = flow.path(flow.variable('items'), flow.idx(0))
    expect(flow.evaluate(tree, { scope })).toBeUndefined()
  })

  it('optional chaining returns null when intermediate is null', () => {
    const scope = makeScope({ user: null })
    const tree = flow.path(
      flow.variable('user'),
      flow.field('metadata', { safe: true }),
      flow.field('ready', { safe: true }),
    )
    expect(flow.evaluate(tree, { scope })).toBeNull()
  })

  it('optional chaining short-circuits at first null', () => {
    const scope = makeScope({ user: { metadata: null } })
    const tree = flow.path(
      flow.variable('user'),
      flow.field('metadata', { safe: true }),
      flow.field('ready', { safe: true }),
    )
    expect(flow.evaluate(tree, { scope })).toBeNull()
  })

  it('computed index uses inner path', () => {
    const scope = makeScope({
      items: ['a', 'b', 'c'],
      i: 2,
    })
    const tree = flow.path('items', flow.idx(flow.reference('i')))
    expect(flow.render(tree, { scope })).toBe('c')
  })
})

describe('call rendering', () => {
  it('eq', () => {
    const scope = makeScope({ x: 5 })
    expect(
      flow.evaluate(flow.eq(flow.reference('x'), 5), { scope }),
    ).toBe(true)
  })

  it('gt', () => {
    const scope = makeScope({ x: 10 })
    expect(
      flow.evaluate(flow.gt(flow.reference('x'), 5), { scope }),
    ).toBe(true)
  })

  it('count', () => {
    const scope = makeScope({ items: [1, 2, 3] })
    expect(
      flow.evaluate(flow.count(flow.reference('items')), { scope }),
    ).toBe(3)
  })

  it('sum', () => {
    const scope = makeScope({ items: [1, 2, 3, 4] })
    expect(
      flow.evaluate(flow.sum(flow.reference('items')), { scope }),
    ).toBe(10)
  })

  it('plural — English', () => {
    const scope = makeScope({ count: 1, locale: 'en' })
    expect(
      flow.evaluate(flow.plural(flow.reference('count')), { scope }),
    ).toBe('one')
  })

  it('plural — many in English is "other"', () => {
    const scope = makeScope({ count: 5, locale: 'en' })
    expect(
      flow.evaluate(flow.plural(flow.reference('count')), { scope }),
    ).toBe('other')
  })
})

describe('control flow rendering', () => {
  it('branch — truthy goes to then', () => {
    const scope = makeScope({ x: 10 })
    const tree = flow.branch(flow.gt(flow.reference('x'), 0), 'yes', 'no')
    expect(flow.render(tree, { scope })).toBe('yes')
  })

  it('branch — falsy goes to fall', () => {
    const scope = makeScope({ x: -1 })
    const tree = flow.branch(flow.gt(flow.reference('x'), 0), 'yes', 'no')
    expect(flow.render(tree, { scope })).toBe('no')
  })

  it('switch matches', () => {
    const scope = makeScope({ kind: 'image' })
    const tree = flow.switch(flow.reference('kind'), [
      { when: 'audio', then: 'AUDIO' },
      { when: 'image', then: 'IMAGE' },
    ], 'OTHER')
    expect(flow.render(tree, { scope })).toBe('IMAGE')
  })

  it('switch falls through', () => {
    const scope = makeScope({ kind: 'video' })
    const tree = flow.switch(flow.reference('kind'), [
      { when: 'audio', then: 'AUDIO' },
      { when: 'image', then: 'IMAGE' },
    ], 'OTHER')
    expect(flow.render(tree, { scope })).toBe('OTHER')
  })

  it('match — first truthy wins', () => {
    const scope = makeScope({ count: 50 })
    const tree = flow.match([
      { test: flow.gt(flow.reference('count'), 100), then: 'many' },
      { test: flow.gt(flow.reference('count'), 10), then: 'some' },
    ], 'few')
    expect(flow.render(tree, { scope })).toBe('some')
  })

  it('case — value match', () => {
    const scope = makeScope({ gender: 'female' })
    const tree = flow.case(flow.reference('gender'), [
      flow.value('male', 'Mr.'),
      flow.value('female', 'Mrs.'),
      flow.otherwise(''),
    ])
    expect(flow.render(tree, { scope })).toBe('Mrs.')
  })

  it('case — default fallback', () => {
    const scope = makeScope({ gender: 'unknown' })
    const tree = flow.case(flow.reference('gender'), [
      flow.value('male', 'Mr.'),
      flow.value('female', 'Mrs.'),
      flow.otherwise(''),
    ])
    expect(flow.render(tree, { scope })).toBe('')
  })

  it('case — plural integration', () => {
    const tree = flow.pluralCases('count', {
      one: 'message',
      other: 'messages',
    })
    expect(
      flow.render(tree, {
        scope: makeScope({ count: 1, locale: 'en' }),
      }),
    ).toBe('message')
    expect(
      flow.render(tree, {
        scope: makeScope({ count: 13, locale: 'en' }),
      }),
    ).toBe('messages')
  })

  it('pick — first non-null', () => {
    const scope = makeScope({ a: null, b: 'two', c: 'three' })
    const tree = flow.pick(
      flow.reference('a'),
      flow.reference('b'),
      flow.reference('c'),
    )
    expect(flow.evaluate(tree, { scope })).toBe('two')
  })

  it('pick — all null returns null', () => {
    const scope = makeScope({ a: null, b: null })
    const tree = flow.pick(flow.reference('a'), flow.reference('b'))
    expect(flow.evaluate(tree, { scope })).toBeNull()
  })

  it('walk — iterates and concatenates', () => {
    const scope = makeScope({ items: ['a', 'b', 'c'] })
    const tree = flow.walk(
      flow.reference('items'),
      flow.weave(flow.reference('item'), '|'),
    )
    expect(flow.render(tree, { scope })).toBe('a|b|c|')
  })

  it('walk — index binding', () => {
    const scope = makeScope({ items: ['x', 'y'] })
    const tree = flow.walk(
      flow.reference('items'),
      flow.weave(flow.reference('index'), ':', flow.reference('item'), ' '),
    )
    expect(flow.render(tree, { scope })).toBe('0:x 1:y ')
  })

  it('loop — numeric range', () => {
    const tree = flow.loop(1, 4, flow.weave(flow.reference('i'), ' '))
    expect(flow.render(tree, { scope: makeScope() })).toBe('1 2 3 ')
  })

  it('attempt — catches', () => {
    const tree = flow.attempt(
      // path through null without safe → propagates null, but
      // we want a thrown error to test catch. Use a deliberate
      // unknown call.
      flow.call('does-not-exist', { x: 1 }),
      'fallback',
    )
    expect(flow.render(tree, { scope: makeScope() })).toBe('fallback')
  })
})

describe('localization template — full integration', () => {
  it('renders the greeting example', () => {
    const greeting = {
      form: 'weave' as const,
      flow: [
        { form: 'text' as const, text: 'You have ' },
        { form: 'reference' as const, name: 'count' },
        { form: 'text' as const, text: ' ' },
        flow.pluralCases('count', {
          one: 'message',
          other: 'messages',
        }),
        { form: 'text' as const, text: ' in your ' },
        { form: 'reference' as const, name: 'thing' },
        { form: 'text' as const, text: ', ' },
        flow.selectCases('gender', {
          male: 'Mr.',
          female: 'Mrs.',
          other: '',
        }),
        { form: 'text' as const, text: ' ' },
        { form: 'reference' as const, name: 'name' },
      ],
    }

    const out = flow.render(greeting, {
      scope: makeScope({
        count: 13,
        thing: 'inbox',
        gender: 'male',
        name: 'John',
        locale: 'en',
      }),
    })

    expect(out).toBe('You have 13 messages in your inbox, Mr. John')
  })
})
