/**
 * Tests for the per-context extension system: `hook` (custom
 * call operators / task implementations) and `formHook`
 * (custom top-level forms).
 *
 * The flow runtime has no module-level mutable registry —
 * every extension is passed in via the render context. The
 * `hook` map is the same `HookHash` used by `Base.hook` at
 * codegen time, so a single name → function table covers
 * operators, task implementations, and ad-hoc extensions.
 */

import { describe, it, expect } from 'vitest'
import { flow, renderText } from './index'

describe('hook (call operators)', () => {
  it('adds a new call operator via ctx.hook', () => {
    const tree = flow.call('reverse', { value: 'hello' })
    expect(
      renderText(tree, {
        scope: flow.scope(),
        hook: {
          reverse: ({ value }) =>
            String(value).split('').reverse().join(''),
        },
      }),
    ).toBe('olleh')
  })

  it('hook-only registration with no schema works', () => {
    const tree = flow.call('shout', { value: 'hi' })
    expect(
      renderText(tree, {
        scope: flow.scope(),
        hook: { shout: ({ value }) => `${String(value).toUpperCase()}!` },
      }),
    ).toBe('HI!')
  })

  it('overrides built-ins via ctx.hook', () => {
    const tree = flow.count(flow.list([flow.text('a'), flow.text('b')]))
    expect(
      renderText(tree, {
        scope: flow.scope(),
        hook: { count: () => 999 },
      }),
    ).toBe('999')
  })
})

describe('formHook (custom forms)', () => {
  it('adds a new top-level form via ctx.formHook', () => {
    type RepeatNode = {
      form: 'repeat'
      body: { form: 'text'; text: string }
      times: { form: 'natural_number'; value: number }
    }

    const tree = {
      form: 'repeat' as const,
      body: { form: 'text' as const, text: 'ab' },
      times: { form: 'natural_number' as const, value: 3 },
    }

    expect(
      renderText(tree as never, {
        scope: flow.scope(),
        formHook: {
          repeat: (node, ctx, walk) => {
            const r = node as unknown as RepeatNode
            const text = String(walk(r.body, ctx))
            const n = Number(walk(r.times, ctx))
            return text.repeat(n)
          },
        },
      }),
    ).toBe('ababab')
  })

  it('overlays a built-in form', () => {
    const tree = flow.reference('something')
    expect(
      renderText(tree, {
        scope: flow.scope({ something: 'real' }),
        formHook: {
          reference: node =>
            `[overlay:${(node as { name: string }).name}]`,
        },
      }),
    ).toBe('[overlay:something]')
  })
})
